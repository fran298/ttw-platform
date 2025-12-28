from rest_framework.authentication import SessionAuthentication
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication

from django.conf import settings
from django.utils import timezone
from apps.core.emails import send_email
from apps.core.tasks import send_booking_email_task

from apps.bookings.models import AdminNotification
from .models import Booking
from .serializers import BookingSerializer, CreateBookingSerializer
from .serializers import AdminBookingSerializer
from apps.listings.models import Listing

from decimal import Decimal

from apps.payments.models import MerchantPayout

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateBookingSerializer
        return BookingSerializer

    def get_queryset(self):
        """
        Strict, role-based access ONLY.
        Ignores query params to prevent data leaks.
        """
        user = self.request.user

        # 1. Admin sees everything
        if user.role == 'ADMIN':
            return Booking.objects.select_related(
                'listing', 'listing__owner', 'user'
            ).all()

        # 2. Provider/Instructor sees bookings for THEIR listings
        # FIX: We filter by 'listing__owner' because that matches your Listing model
        if user.role in ['PROVIDER', 'INSTRUCTOR']:
            return Booking.objects.select_related(
                'listing', 'listing__owner', 'user'
            ).filter(listing__owner=user)

        # 3. Traveler/User sees only their own bookings
        return Booking.objects.select_related(
            'listing', 'listing__owner', 'user'
        ).filter(user=user)


    def create(self, request, *args, **kwargs):
        print('🔥 BOOKING CREATE VIEW HIT')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        listing = serializer.validated_data['listing']
        guests = serializer.validated_data.get('guests', 1)
        total_price = listing.price * guests

        booking = serializer.save(
            user=request.user,
            total_price=total_price,
            currency=listing.currency,
            status=Booking.Status.PENDING,
        )
        print('🔥 BOOKING SAVED:', booking.id)

        # =============================
        # EMAILS — BOOKING CREATED
        # =============================

        # USER EMAIL
        if booking.user and booking.user.email:
            print('📧 EMAIL SENT -> USER')
            send_email(
                to=[booking.user.email],
                subject='Booking request received – The Travel Wild',
                template='booking_created_user',
                context={
                    'booking': booking,
                    'listing': booking.listing,
                },
                from_email=settings.BOOKINGS_EMAIL,
                reply_to=settings.EMAIL_REPLY_TO,
            )

        # PROVIDER / SCHOOL EMAIL
        provider_email = booking.listing.owner.email if booking.listing.owner else None
        if provider_email:
            print('📧 EMAIL SENT -> PROVIDER')
            send_email(
                to=[provider_email],
                subject='New booking received – Action required',
                template='booking_created_provider',
                context={
                    'booking': booking,
                    'listing': booking.listing,
                },
                from_email=settings.BOOKINGS_EMAIL,
                reply_to=settings.EMAIL_REPLY_TO,
            )

        # ADMIN EMAIL
        print('📧 EMAIL SENT -> ADMIN')
        send_email(
            to=[settings.SUPPORT_EMAIL],
            subject='ADMIN: New booking created',
            template='booking_created_admin',
            context={
                'booking': booking,
                'listing': booking.listing,
            },
            from_email=settings.SUPPORT_EMAIL,
            reply_to=settings.SUPPORT_EMAIL,
        )

        headers = self.get_success_headers(serializer.data)
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    # ---------------------------------------------------------
    # CUSTOM ACTIONS
    # ---------------------------------------------------------

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """ Allow User to cancel their own booking """
        booking = self.get_object()
        
        if booking.status in [Booking.Status.COMPLETED, Booking.Status.CANCELLED]:
            return Response({"detail": "Cannot cancel this booking"}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = Booking.Status.CANCELLED
        booking.save()
        return Response({"status": "cancelled", "id": booking.id})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """ Allow Provider to confirm a booking """
        booking = self.get_object()
        
        # FIX: Check against listing.owner, not merchant.user
        if booking.listing.owner != request.user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        booking.status = Booking.Status.CONFIRMED
        booking.save()
        return Response({"status": "confirmed"})

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        """
        Provider finalizes an activity.
        Can mark it as completed, partially completed, or cancelled.
        Platform decides final amount and captures payment later.
        """
        booking = self.get_object()

        # Only provider / instructor owning the listing can finalize
        if booking.listing.owner != request.user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != Booking.Status.AUTHORIZED:
            return Response(
                {"detail": "Booking is not in an authorized state"},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Guard: once captured, the booking cannot be modified
        if booking.paid_at or booking.amount_captured:
            return Response(
                {"detail": "Booking already captured and cannot be modified"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if booking.status in [Booking.Status.COMPLETED, Booking.Status.CANCELLED] or booking.completed_at or booking.cancelled_at:
            return Response(
                {"detail": "Booking already finalized"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- EMAIL IDEMPOTENCY GUARD ---
        # If already finalized and emails were enqueued/sent, return the canonical final numbers.
        if booking.final_emails_sent_at:
            adjusted_total = booking.adjusted_total_price or booking.total_price
            fee = booking.platform_fee if booking.platform_fee is not None else booking.service_fee
            payout = booking.provider_amount if booking.provider_amount is not None else booking.provider_payout

            commission_rate = None
            if adjusted_total and Decimal(adjusted_total) > 0:
                try:
                    commission_rate = (Decimal(fee) / Decimal(adjusted_total)).quantize(Decimal("0.0001"))
                except Exception:
                    commission_rate = None

            return Response(
                {
                    "booking_id": booking.id,
                    "status": booking.status,
                    "completion_percentage": booking.completion_percentage,
                    "adjusted_total_price": adjusted_total,
                    "platform_fee": fee,
                    "provider_amount": payout,
                    "commission_rate": float(commission_rate) if commission_rate is not None else None,
                    "capture_required": True,
                    "admin_notified": True,
                    "emails_sent": True,
                    "detail": "Finalization emails already sent",
                },
                status=status.HTTP_200_OK,
            )

        completion_percentage = request.data.get("completion_percentage")
        reason = request.data.get("reason", "")

        try:
            completion_percentage = int(completion_percentage)
        except (TypeError, ValueError):
            return Response(
                {"detail": "completion_percentage must be an integer between 0 and 100"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if completion_percentage < 0 or completion_percentage > 100:
            return Response(
                {"detail": "completion_percentage must be between 0 and 100"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.completion_percentage = completion_percentage
        booking.adjustment_reason = reason

        booking.calculate_final_financials()

        # booking.total_price = adjusted_amount  # Deleted per instructions

        # --- Removed duplicated financial calculations ---

        # --- Final status ---
        if completion_percentage == 0:
            booking.status = Booking.Status.CANCELLED
        else:
            booking.status = Booking.Status.COMPLETED

        booking.save()

        # ---------------------------------------------------------
        # CREATE PENDING MERCHANT PAYOUT
        # ---------------------------------------------------------

        MerchantPayout.objects.create(
            booking=booking,
            merchant=booking.listing.owner,
            total_charged=booking.adjusted_total_price,
            platform_fee=booking.platform_fee,
            amount_due=booking.provider_amount,
            currency=booking.currency,
            status=MerchantPayout.Status.PENDING,
            method=MerchantPayout.Method.MANUAL,
        )

        # ---------------------------------------------------------
        # EMAIL NOTIFICATIONS (CELERY)
        # ---------------------------------------------------------

        # USER
        if booking.user and booking.user.email:
            send_booking_email_task.delay(
                to=[booking.user.email],
                subject="Your activity has been finalized – The Travel Wild",
                template="booking_finalized_user",
                context={"booking_id": str(booking.id)},
                from_email=settings.BOOKINGS_EMAIL,
            )

        # PROVIDER
        provider_email = booking.listing.owner.email if booking.listing.owner else None
        if provider_email:
            send_booking_email_task.delay(
                to=[provider_email],
                subject="Booking finalized – The Travel Wild",
                template="booking_finalized_provider",
                context={"booking_id": str(booking.id)},
                from_email=settings.BOOKINGS_EMAIL,
            )

        # ADMIN / OPS
        send_booking_email_task.delay(
            to=[settings.SUPPORT_EMAIL],
            subject="Booking finalized – Admin notification",
            template="booking_finalized_admin",
            context={"booking_id": str(booking.id)},
            from_email=settings.BOOKINGS_EMAIL,
        )

        # --- MARK FINAL EMAILS AS SENT (IDEMPOTENCY) ---
        booking.final_emails_sent_at = timezone.now()
        booking.save(update_fields=["final_emails_sent_at"])

        # ---------------------------------------------------------
        # ADMIN DASHBOARD NOTIFICATION
        # ---------------------------------------------------------

        AdminNotification.objects.create(
            type=(
                "BOOKING_CANCELLED"
                if booking.completion_percentage == 0
                else "BOOKING_PARTIAL"
                if booking.completion_percentage < 100
                else "BOOKING_FINALIZED"
            ),
            title="Booking finalized",
            message=(
                f"Booking {booking.id}\n"
                f"Completion: {booking.completion_percentage}%\n"
                f"Amount pending capture: {booking.adjusted_total_price} {booking.currency}"
            ),
            booking=booking,
        )

        adjusted_total = booking.adjusted_total_price or booking.total_price
        fee = booking.platform_fee if booking.platform_fee is not None else booking.service_fee
        payout = booking.provider_amount if booking.provider_amount is not None else booking.provider_payout

        commission_rate = None
        if adjusted_total and Decimal(adjusted_total) > 0:
            try:
                commission_rate = (Decimal(fee) / Decimal(adjusted_total)).quantize(Decimal("0.0001"))
            except Exception:
                commission_rate = None

        return Response(
            {
                "booking_id": booking.id,
                "status": booking.status,
                "completion_percentage": booking.completion_percentage,
                "adjusted_total_price": adjusted_total,
                "platform_fee": fee,
                "provider_amount": payout,
                "commission_rate": float(commission_rate) if commission_rate is not None else None,
                "capture_required": True,
                "admin_notified": True,
                "emails_sent": True,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def calculate(self, request):
        """
        Preview price calculation.
        Must match EXACT commission logic used in finalize.
        """
        listing_id = request.data.get("listing_id")
        guests = int(request.data.get("guests", 1))

        listing = get_object_or_404(Listing, id=listing_id)

        base_total = Decimal(listing.price) * Decimal(guests)

        # Default commission: 25%
        commission_rate = Decimal("0.25")

        owner = listing.owner
        if hasattr(owner, "provider_profile") and owner.provider_profile.is_subscribed:
            commission_rate = Decimal("0.15")
        elif hasattr(owner, "instructor_profile") and owner.instructor_profile.is_subscribed:
            commission_rate = Decimal("0.15")

        service_fee = (base_total * commission_rate).quantize(Decimal("0.01"))
        total_price = base_total

        return Response(
            {
                "base_price": float(listing.price),
                "subtotal": float(base_total),
                "service_fee": float(service_fee),
                "total_price": float(total_price),
                "commission_rate": float(commission_rate),
                "currency": listing.currency,
            }
        )

class AdminBookingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only bookings endpoint.
    Mirrors Django Admin > Bookings.
    """
    serializer_class = AdminBookingSerializer
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.select_related(
            'user',
            'listing',
            'listing__owner'
        ).all().order_by('-created_at')

    def list(self, request, *args, **kwargs):
        user = request.user

        if user.role != 'ADMIN':
            return Response(
                {"detail": "Admin access only"},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().list(request, *args, **kwargs)