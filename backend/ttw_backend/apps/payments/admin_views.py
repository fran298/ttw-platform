from decimal import Decimal
import stripe

from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.bookings.models import Booking, AdminNotification
from apps.payments.models import Transaction, MerchantPayout

stripe.api_key = settings.STRIPE_SECRET_KEY


class AdminCaptureBookingPaymentView(APIView):
    """
    Admin-only endpoint to manually capture an authorized Stripe PaymentIntent
    after a booking has been finalized.

    Flow:
    - Booking must be COMPLETED
    - PaymentIntent must NOT be captured yet
    - Capture adjusted_total_price
    - Store final financials
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        user = request.user

        if user.role != "ADMIN":
            return Response(
                {"detail": "Admin access only"},
                status=status.HTTP_403_FORBIDDEN
            )

        booking = get_object_or_404(Booking, id=booking_id)

        if booking.status != Booking.Status.COMPLETED:
            return Response(
                {"detail": "Booking must be completed before capture"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.amount_captured:
            return Response(
                {"detail": "Payment already captured"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not booking.stripe_payment_intent_id:
            return Response(
                {"detail": "Missing Stripe PaymentIntent"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Amount to capture (in cents)
        amount_to_capture = int(Decimal(booking.adjusted_total_price) * 100)

        # --- CAPTURE PAYMENT ---
        payment_intent = stripe.PaymentIntent.capture(
            booking.stripe_payment_intent_id,
            amount_to_capture=amount_to_capture
        )

        captured_amount = Decimal(payment_intent.amount_received) / 100

        platform_fee = booking.platform_fee
        provider_amount = booking.provider_amount

        # --- STORE FINAL FINANCIALS ---
        booking.amount_captured = captured_amount
        booking.save(update_fields=["amount_captured"])

        # --- TRANSACTION LOG (PAYMENT) ---
        Transaction.objects.create(
            booking=booking,
            stripe_id=payment_intent.id,
            amount=captured_amount,
            currency=booking.currency,
            status=Transaction.Status.SUCCEEDED,
            type=Transaction.Type.PAYMENT,
        )

        # --- ADMIN NOTIFICATION ---
        AdminNotification.objects.create(
            title="Payment captured",
            message=(
                f"Booking {booking.id} payment captured.\n\n"
                f"Captured: {captured_amount} {booking.currency}\n"
                f"Platform fee: {platform_fee} {booking.currency}\n"
                f"Provider amount: {provider_amount} {booking.currency}"
            ),
        )

        return Response(
            {
                "booking_id": booking.id,
                "captured_amount": captured_amount,
                "platform_fee": platform_fee,
                "provider_amount": provider_amount,
                "stripe_payment_intent": payment_intent.id,
            },
            status=status.HTTP_200_OK
        )