import stripe
from django.contrib.contenttypes.models import ContentType
from apps.providers.models import MerchantProfile
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import views, status, permissions, viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils.dateparse import parse_date
from rest_framework.decorators import action
from django.utils import timezone
from decimal import Decimal
from django.db import transaction as db_transaction

stripe.api_key = settings.STRIPE_SECRET_KEY

from .utils import create_checkout_session, create_stripe_express_account, create_account_link
from apps.bookings.models import Booking
from apps.providers.models import ProviderProfile
from apps.payments.models import MerchantPayout, Transaction, PremiumSignupIntent
from apps.payments.serializers import MerchantPayoutSerializer, AdminTransactionSerializer


class CreateCheckoutSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        listing_id = request.data.get('listing_id')
        start_date_raw = request.data.get('date')
        guests_raw = request.data.get('guests')
        size = request.data.get('size')

        if not listing_id or not start_date_raw:
            return Response({"error": "Missing parameters"}, status=400)

        # Parse date (expects ISO format YYYY-MM-DD from frontend)
        start_date = parse_date(start_date_raw)
        if start_date is None:
            return Response({"error": "Invalid date format. Expected YYYY-MM-DD."}, status=400)

        # Ensure guests is an integer
        try:
            guests = int(guests_raw) if guests_raw is not None else 1
        except (TypeError, ValueError):
            return Response({"error": "Invalid guests value."}, status=400)

        from apps.listings.models import Listing
        listing = get_object_or_404(Listing, id=listing_id)

        booking = Booking.objects.create(
            user=request.user,
            listing=listing,
            start_date=start_date,
            guests=guests,
            total_price=listing.price * guests,
            status=Booking.Status.AUTHORIZED
        )
        booking_id = booking.id

        try:
            # frontend URL
            domain = "http://localhost:5173"
            success_url = f"{domain}/booking/{booking_id}/success"
            cancel_url = f"{domain}/booking/{booking_id}/cancel"

            # Create checkout session using main Stripe account only (no fees, no transfers)
            url = create_checkout_session(
                booking=booking,
                success_url=success_url,
                cancel_url=cancel_url,
            )

            return Response({"url": url})
        except Exception as e:
            return Response({"error": str(e)}, status=400)



# --- Stripe Connect Onboarding ---
class StripeConnectOnboardingView(views.APIView):
    """
    Starts Stripe Express onboarding for Providers / Instructors.
    Stripe handles KYC, bank account, tax, etc.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # Resolve provider or instructor profile
        profile = None
        if hasattr(user, "provider_profile"):
            profile = user.provider_profile
        elif hasattr(user, "instructor_profile"):
            profile = user.instructor_profile

        if not profile:
            return Response(
                {"error": "User is not a provider or instructor"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Stripe account if missing
        if not profile.stripe_connect_id:
            account = stripe.Account.create(
                type="express",
                email=user.email,
                capabilities={
                    "transfers": {"requested": True},
                },
            )
            profile.stripe_connect_id = account.id
            profile.save(update_fields=["stripe_connect_id"])

        # Create onboarding link
        account_link = stripe.AccountLink.create(
            account=profile.stripe_connect_id,
            refresh_url=f"{settings.FRONTEND_URL}/dashboard/profile?stripe=refresh",
            return_url=f"{settings.FRONTEND_URL}/dashboard/profile?stripe=success",
            type="account_onboarding",
        )

        return Response({"url": account_link.url}, status=status.HTTP_200_OK)


# --- Stripe Connect Status ---
class StripeConnectStatusView(views.APIView):
    """
    Returns Stripe account connection status.
    Used by dashboard to show 'Connected' badge.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        profile = None
        if hasattr(user, "provider_profile"):
            profile = user.provider_profile
        elif hasattr(user, "instructor_profile"):
            profile = user.instructor_profile

        if not profile or not profile.stripe_connect_id:
            return Response({"connected": False})

        account = stripe.Account.retrieve(profile.stripe_connect_id)

        return Response({
            "connected": account.charges_enabled and account.payouts_enabled,
            "details_submitted": account.details_submitted,
        })


class ProviderPayoutsView(views.APIView):
    """
    Returns all payouts associated with the logged-in provider (school or instructor).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Always use merchant of the logged-in user (Option A)
        merchant = getattr(user, "merchant_profile", None)

        if not merchant:
            return Response({"error": "This user does not have an associated merchant profile."}, status=404)

        from django.contrib.contenttypes.models import ContentType
        from django.db.models import Sum

        # Correct GenericForeignKey filtering
        merchant_ct = ContentType.objects.get_for_model(merchant)

        payouts_qs = MerchantPayout.objects.filter(
            merchant_content_type=merchant_ct,
            merchant_object_id=merchant.id
        ).order_by("-created_at")

        # Calculate totals
        total_paid = payouts_qs.filter(status="PAID").aggregate(total=Sum("amount_due"))["total"] or 0
        total_pending = payouts_qs.filter(status="PENDING").aggregate(total=Sum("amount_due"))["total"] or 0

        # Serialize payouts
        payouts = MerchantPayoutSerializer(payouts_qs, many=True).data

        return Response({
            "merchant_id": str(merchant.id),
            "total_paid": total_paid,
            "total_pending": total_pending,
            "payouts": payouts,
        }, status=200)


#
# PAYMENT CAPTURE RULE:
# - Stripe authorization happens at checkout → AUTHORIZED
# - Provider/Instructor manually finalizes → COMPLETED
# - ONLY AFTER COMPLETED an admin/system captures the payment
#
# --- CAPTURE AND PAYOUT ENDPOINT ---
class CaptureAndPayoutBookingView(views.APIView):
    """
    Captures an authorized payment and transfers funds to the provider via Stripe Connect.
    This is the FINAL step of the booking lifecycle.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        if request.user.role != "ADMIN":
            return Response({"detail": "Admin access only"}, status=status.HTTP_403_FORBIDDEN)

        booking = get_object_or_404(Booking, id=booking_id)

        if booking.status != Booking.Status.COMPLETED:
            return Response(
                {"detail": "Booking must be COMPLETED before capture"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not booking.stripe_payment_intent_id:
            return Response(
                {"detail": "Missing Stripe PaymentIntent"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine final amount to capture
        final_amount = booking.adjusted_total_price or booking.total_price
        amount_to_capture = int(Decimal(final_amount) * 100)

        try:
            with db_transaction.atomic():
                # --- CAPTURE PAYMENT ---
                capture = stripe.PaymentIntent.capture(
                    booking.stripe_payment_intent_id,
                    amount_to_capture=amount_to_capture
                )

                # --- LOG PAYMENT TRANSACTION (CAPTURE) ---
                Transaction.objects.create(
                    booking=booking,
                    stripe_id=capture.id,
                    amount=Decimal(final_amount),
                    currency=booking.currency,
                    status=Transaction.Status.SUCCEEDED,
                    type=Transaction.Type.PAYMENT,
                )

                # --- CREATE MERCHANT PAYOUT RECORD ---
                merchant = booking.listing.owner.merchant_profile

                payout = MerchantPayout.objects.create(
                    booking=booking,
                    merchant_content_type=ContentType.objects.get_for_model(MerchantProfile),
                    merchant_object_id=merchant.id,
                    amount_due=booking.provider_payout,
                    currency=booking.currency,
                    status=MerchantPayout.Status.PENDING,
                )

                # --- STRIPE CONNECT VALIDATION ---
                provider = getattr(booking.listing.owner, "provider_profile", None)
                instructor = getattr(booking.listing.owner, "instructor_profile", None)
                profile = provider or instructor

                if not profile or not profile.stripe_connect_id:
                    return Response(
                        {"error": "Provider or instructor must connect Stripe before receiving payouts"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                account = stripe.Account.retrieve(profile.stripe_connect_id)

                if not account.charges_enabled or not account.payouts_enabled:
                    return Response(
                        {"error": "Stripe account is not fully enabled to receive payouts"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # --- STRIPE TRANSFER ---
                transfer = stripe.Transfer.create(
                    amount=int(Decimal(booking.provider_payout) * 100),
                    currency=booking.currency,
                    destination=profile.stripe_connect_id,
                    transfer_group=f"BOOKING_{booking.id}",
                )

                payout.stripe_transfer_id = transfer.id
                payout.status = MerchantPayout.Status.PAID
                payout.paid_at = timezone.now()
                payout.save(update_fields=["stripe_transfer_id", "status", "paid_at"])

                # Capture happens AFTER provider/instructor finalized the activity.
                # Status remains COMPLETED; capture does not change lifecycle state.
                booking.paid_at = timezone.now()
                booking.save(update_fields=["paid_at"])

                # --- TRANSACTION LOG ---
                Transaction.objects.create(
                    booking=booking,
                    stripe_id=transfer.id,
                    amount=booking.provider_payout,
                    currency=booking.currency,
                    status=Transaction.Status.SUCCEEDED,
                    type=Transaction.Type.PAYOUT,
                )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "booking_id": booking.id,
                "captured_amount": final_amount,
                "provider_paid": booking.provider_payout,
                "transfer_id": payout.stripe_transfer_id,
            },
            status=status.HTTP_200_OK
        )


class AdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only view of ALL transactions.
    Mirrors Django Admin > Transaction.
    """
    serializer_class = AdminTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.select_related(
            "booking"
        ).all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Admin access only"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class AdminMerchantPayoutViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only view of ALL merchant payouts.
    Mirrors Django Admin > MerchantPayout.
    """
    serializer_class = MerchantPayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MerchantPayout.objects.select_related(
            "booking",
            "booking__listing",
        ).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Admin access only"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="mark-as-paid")
    def mark_as_paid(self, request, pk=None):
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Admin access only"},
                status=status.HTTP_403_FORBIDDEN
            )

        payout = self.get_object()

        if payout.status == "PAID":
            return Response(
                {"detail": "Payout already marked as PAID"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payout.status = "PAID"
        payout.paid_at = timezone.now()
        payout.save(update_fields=["status", "paid_at"])

        return Response(
            {"detail": "Payout marked as PAID"},
            status=status.HTTP_200_OK
        )


# Stripe Premium Partner Checkout view
@api_view(["POST"])
@permission_classes([AllowAny])
def premium_partner_checkout(request):
    """
    Public Stripe checkout for Premium Partner.
    User may NOT be authenticated.
    """

    # Resolve email (authenticated user OR public landing)
    email = request.data.get("email")

    if not email:
        user = request.user
        if user and user.is_authenticated and user.email:
            email = user.email

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    role = request.data.get("role")

    # If role not explicitly sent, infer from authenticated user
    if not role and request.user and request.user.is_authenticated:
        if hasattr(request.user, "provider_profile"):
            role = "PROVIDER"
        elif hasattr(request.user, "instructor_profile"):
            role = "INSTRUCTOR"

    # Final validation
    if role not in ["PROVIDER", "INSTRUCTOR"]:
        return Response(
            {"error": "Invalid role"},
            status=status.HTTP_400_BAD_REQUEST
        )

    premium_intent = PremiumSignupIntent.objects.create(
        email=email,
        role=role,
        status=PremiumSignupIntent.Status.PENDING,
    )

    # Decide success URL based on authentication state
    if request.user and request.user.is_authenticated:
        success_url = f"{settings.FRONTEND_URL}/dashboard/provider?premium=success&session_id={{CHECKOUT_SESSION_ID}}"
    else:
        success_url = f"{settings.FRONTEND_URL}/signup?premium=success&session_id={{CHECKOUT_SESSION_ID}}"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            customer_email=email,
            client_reference_id=str(premium_intent.id),
            line_items=[
                {
                    "price": settings.STRIPE_PREMIUM_PRICE_ID,
                    "quantity": 1,
                }
            ],
            discounts=[
                {"coupon": settings.STRIPE_PREMIUM_50_COUPON_ID}
            ],
            success_url=success_url,
            cancel_url=f"{settings.FRONTEND_URL}/membership",
            metadata={
                "type": "premium_partner",
                "premium_intent_id": str(premium_intent.id),
                "role": role,
            },
        )
        # Persist Stripe session ID for later validation
        premium_intent.checkout_session_id = session.id
        premium_intent.save(update_fields=["checkout_session_id"])
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {"checkout_url": session.url},
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def validate_premium_session(request):
    """
    Validate Stripe premium checkout session and return signup intent data.
    Used by frontend after Stripe redirect.
    """

    session_id = request.query_params.get("session_id")
    if not session_id:
        return Response(
            {"error": "session_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        premium_intent = PremiumSignupIntent.objects.get(
            checkout_session_id=session_id
        )
    except PremiumSignupIntent.DoesNotExist:
        return Response(
            {"error": "Invalid or unpaid premium session"},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "intent_id": str(premium_intent.id),
            "role": premium_intent.role,
            "email": premium_intent.email,
        },
        status=status.HTTP_200_OK
    )

# -------------------------------------------------
# STRIPE WEBHOOK (PAYMENT AUTHORIZATION)
# -------------------------------------------------
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except Exception as e:
        return Response({"error": "Invalid webhook signature"}, status=400)

    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})

    # -------------------------------------------------
    # PAYMENT AUTHORIZED
    # -------------------------------------------------
    if event_type == "payment_intent.amount_authorized":
        booking_id = data.get("metadata", {}).get("booking_id")

        if not booking_id:
            return Response(status=200)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(status=200)

        booking.status = Booking.Status.AUTHORIZED
        booking.stripe_payment_intent_id = data.get("id")
        booking.authorized_amount = Decimal(data.get("amount", 0)) / 100
        booking.save(update_fields=[
            "status",
            "stripe_payment_intent_id",
            "authorized_amount",
        ])

        # ---------------- EMAILS ----------------
        from apps.core.emails import send_email

        # USER
        if booking.user and booking.user.email:
            send_email(
                subject="Your booking is authorized – The Travel Wild",
                to=[booking.user.email],
                template="booking_authorized_user",
                context={
                    "booking": booking,
                },
            )

        # PROVIDER
        provider_email = booking.listing.owner.email if booking.listing.owner else None
        if provider_email:
            send_email(
                subject="New booking authorized – The Travel Wild",
                to=[provider_email],
                template="booking_authorized_provider",
                context={
                    "booking": booking,
                },
            )

        # ADMIN / OPS
        send_email(
            subject="New booking authorized – Admin notification",
            to=[settings.SUPPORT_EMAIL],
            template="booking_authorized_admin",
            context={
                "booking": booking,
            },
        )

        # ---------------- CHAT ----------------
        from apps.chat.models import ChatRoom
        ChatRoom.objects.get_or_create(booking=booking)

    return Response(status=200)