import stripe
import time
from decimal import Decimal  # 👈 NUEVO
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from apps.core.tasks import send_booking_email_task
from django.contrib.auth import get_user_model
from apps.bookings.models import Booking
from .models import Transaction, MerchantPayout, PremiumSignupIntent
from django.utils import timezone

# --- Premium Partner logic imports ---
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile
from apps.providers.models import MerchantProfile

# Optional chat integration (will be used if the chat app exists)
try:
    from apps.chat.models import ChatRoom
except ImportError:
    ChatRoom = None

from django.db import transaction as db_transaction


# --- STRIPE HANDLED EVENTS ---
STRIPE_HANDLED_EVENTS = {
    "checkout.session.completed",
    "invoice.payment_succeeded",
    "payment_intent.succeeded",
    "payment_intent.canceled",
}


def _ensure_booking_snapshot_and_financials(booking: Booking):
    """
    Profesional: asegura que el booking tenga:
    - listing_snapshot con título, escuela, imagen, deporte
    - service_fee y provider_payout calculados según merchant/provider/instructor
    """

    listing = booking.listing

    # 1) SNAPSHOT del listing (para emails / histórico)
    if not booking.listing_snapshot:
        merchant = getattr(listing, "merchant", None)

        # Intentamos obtener un nombre "humano" de la escuela / instructor
        provider_name = None
        if merchant is not None:
            # Si es escuela
            provider = getattr(merchant, "provider", None)
            if provider and getattr(provider, "company_name", None):
                provider_name = provider.company_name

            # Si es instructor
            instructor = getattr(merchant, "instructor", None)
            if not provider_name and instructor:
                if getattr(instructor, "user", None):
                    provider_name = instructor.user.email

            # Fallback al nombre legal del merchant
            if not provider_name and getattr(merchant, "legal_name", None):
                provider_name = merchant.legal_name

        booking.listing_snapshot = {
            "title": getattr(listing, "title", None),
            "provider_name": provider_name,
            "image": (listing.images[0] if getattr(listing, "images", None) else None),
            "sport": getattr(getattr(listing, "sport", None), "name", None),
        }

    # 2) SERVICE FEE & PROVIDER PAYOUT
    amount = Decimal(booking.total_price or 0)

    if amount <= 0:
        # Nada que repartir, dejamos todo en 0
        booking.service_fee = Decimal("0.00")
        booking.provider_payout = Decimal("0.00")
        return

    merchant = getattr(listing, "merchant", None)

    # Lógica profesional de comisión:
    # - Si hay ProviderProfile o InstructorProfile vinculado al merchant,
    #   usamos su commission_rate / is_subscribed
    # - Si no, usamos commission_rate de MerchantProfile
    # - Fallback final: 25% comisión TTW
    commission_rate = None

    if merchant is not None:
        provider = getattr(merchant, "provider", None)
        instructor = getattr(merchant, "instructor", None)

        if provider is not None:
            # Si está suscripto → 15%, si no → provider.commission_rate (ej: 25)
            if provider.is_subscribed:
                commission_rate = Decimal("0.15")
            else:
                commission_rate = Decimal(provider.commission_rate) / 100
        elif instructor is not None:
            if instructor.is_subscribed:
                commission_rate = Decimal("0.15")
            else:
                commission_rate = Decimal(instructor.commission_rate) / 100
        elif getattr(merchant, "commission_rate", None) is not None:
            commission_rate = Decimal(merchant.commission_rate) / 100

    # Fallback si por algún motivo no logramos calcular una comisión
    if commission_rate is None:
        commission_rate = Decimal("0.25")  # 25% TTW por defecto

    service_fee = (amount * commission_rate).quantize(Decimal("0.01"))
    provider_payout = (amount - service_fee).quantize(Decimal("0.01"))

    booking.service_fee = service_fee
    booking.provider_payout = provider_payout




# --- HANDLER FUNCTIONS ---
def _handle_checkout_session_completed(event):
    print(f"START _handle_checkout_session_completed, event_id={event['id']}")
    with db_transaction.atomic():
        session = event['data']['object']
        metadata = session.get('metadata') or {}

        # --- PREMIUM SIGNUP FLOW ---
        if metadata.get("type") == "premium_partner":
            premium_intent_id = metadata.get("premium_intent_id")
            if not premium_intent_id:
                print("Premium webhook: missing premium_intent_id")
                print(f"END _handle_checkout_session_completed, event_id={event['id']}")
                return
            try:
                premium_intent = PremiumSignupIntent.objects.get(id=premium_intent_id)
            except PremiumSignupIntent.DoesNotExist:
                print(f"Premium webhook: intent not found {premium_intent_id}")
                print(f"END _handle_checkout_session_completed, event_id={event['id']}")
                return
            if premium_intent.status != PremiumSignupIntent.Status.PENDING:
                print(f"Premium webhook: intent already processed ({premium_intent.status})")
                print(f"END _handle_checkout_session_completed, event_id={event['id']}")
                return
            premium_intent.checkout_session_id = session.get("id")
            premium_intent.subscription_id = session.get("subscription")
            premium_intent.payment_intent_id = session.get("payment_intent")
            premium_intent.status = PremiumSignupIntent.Status.PAID
            premium_intent.stripe_event_id = event.get("id")
            premium_intent.paid_at = timezone.now()
            premium_intent.save()
            User = get_user_model()
            user = None
            if getattr(premium_intent, "email", None):
                user = User.objects.filter(email__iexact=premium_intent.email).first()
            activated = False
            activated_target = None
            if user:
                role = (getattr(premium_intent, "role", "") or "").upper()
                if role == "PROVIDER":
                    profile = ProviderProfile.objects.filter(user=user).first()
                    if profile is not None:
                        if hasattr(profile, "is_subscribed"):
                            profile.is_subscribed = True
                        if hasattr(profile, "subscribed_at"):
                            profile.subscribed_at = timezone.now()
                        if hasattr(profile, "premium_subscription_id"):
                            profile.premium_subscription_id = premium_intent.subscription_id
                        profile.save()
                        activated = True
                        activated_target = "PROVIDER"
                elif role == "INSTRUCTOR":
                    profile = InstructorProfile.objects.filter(user=user).first()
                    if profile is not None:
                        if hasattr(profile, "is_subscribed"):
                            profile.is_subscribed = True
                        if hasattr(profile, "subscribed_at"):
                            profile.subscribed_at = timezone.now()
                        if hasattr(profile, "premium_subscription_id"):
                            profile.premium_subscription_id = premium_intent.subscription_id
                        profile.save()
                        activated = True
                        activated_target = "INSTRUCTOR"
                else:
                    provider_profile = ProviderProfile.objects.filter(user=user).first()
                    if provider_profile is not None:
                        if hasattr(provider_profile, "is_subscribed"):
                            provider_profile.is_subscribed = True
                        if hasattr(provider_profile, "subscribed_at"):
                            provider_profile.subscribed_at = timezone.now()
                        if hasattr(provider_profile, "premium_subscription_id"):
                            provider_profile.premium_subscription_id = premium_intent.subscription_id
                        provider_profile.save()
                        activated = True
                        activated_target = "PROVIDER"
                    if not activated:
                        instructor_profile = InstructorProfile.objects.filter(user=user).first()
                        if instructor_profile is not None:
                            if hasattr(instructor_profile, "is_subscribed"):
                                instructor_profile.is_subscribed = True
                            if hasattr(instructor_profile, "subscribed_at"):
                                instructor_profile.subscribed_at = timezone.now()
                            if hasattr(instructor_profile, "premium_subscription_id"):
                                instructor_profile.premium_subscription_id = premium_intent.subscription_id
                            instructor_profile.save()
                            activated = True
                            activated_target = "INSTRUCTOR"
            if activated:
                send_booking_email_task(
                    to=["partners@thetravelwild.com", "support@thetravelwild.com"],
                    subject="Premium Partner activated",
                    template="premium_partner_activated_admin",
                    context={
                        "premium_intent_id": str(premium_intent.id),
                        "activated_target": activated_target,
                    },
                    from_email=settings.BOOKINGS_EMAIL,
                )
            else:
                send_booking_email_task(
                    to=["partners@thetravelwild.com", "support@thetravelwild.com"],
                    subject="New Premium Partner Purchase (Pending Signup)",
                    template="premium_partner_pending_admin",
                    context={
                        "premium_intent_id": str(premium_intent.id),
                    },
                    from_email=settings.BOOKINGS_EMAIL,
                )
            print(f"END _handle_checkout_session_completed, event_id={event['id']}")
            return
        booking_id = metadata.get('booking_id')
        if not booking_id:
            print("Stripe webhook: missing booking_id in session metadata")
            print(f"END _handle_checkout_session_completed, event_id={event['id']}")
            return
        try:
            booking = Booking.objects.get(id=booking_id)
            booking.status = Booking.Status.AUTHORIZED
            booking.stripe_payment_intent_id = session["payment_intent"]
            booking.payment_authorized_at = timezone.now()
            _ensure_booking_snapshot_and_financials(booking)
            booking.save()
            Transaction.objects.create(
                booking=booking,
                stripe_id=session["payment_intent"],
                amount=Decimal(session["amount_total"]) / 100,
                currency=session["currency"],
                status=Transaction.Status.PENDING,
                type=Transaction.Type.PAYMENT,
            )
            from django.contrib.contenttypes.models import ContentType
            print(
                f"Booking {booking_id} AUTHORIZED — Amount Authorized: {booking.total_price} {booking.currency} "
                f"| TTW Fee: {booking.service_fee} | Estimated Payout: {booking.provider_payout}"
            )
            # --- EMAIL IDEMPOTENCY GUARD ---
            if booking.authorized_emails_sent_at:
                print(f"Booking {booking.id}: authorized emails already sent, skipping")
                print(f"END _handle_checkout_session_completed, event_id={event['id']}")
                return
            # Enqueue booking authorized emails (synchronous)
            if booking.user and booking.user.email:
                send_booking_email_task(
                    to=[booking.user.email],
                    subject="Your booking is authorized – The Travel Wild",
                    template="booking_authorized_user",
                    context={"booking_id": str(booking.id)},
                    from_email=settings.BOOKINGS_EMAIL,
                )

            merchant = getattr(booking.listing, "merchant", None)
            merchant_user = getattr(merchant, "user", None) if merchant else None
            provider_email = getattr(merchant_user, "email", None)

            if provider_email:
                send_booking_email_task(
                    to=[provider_email],
                    subject="New booking authorized – The Travel Wild",
                    template="booking_authorized_provider",
                    context={"booking_id": str(booking.id)},
                    from_email=settings.BOOKINGS_EMAIL,
                )

            send_booking_email_task(
                to=[settings.SUPPORT_EMAIL],
                subject="New booking authorized – Internal notification",
                template="booking_authorized_admin",
                context={"booking_id": str(booking.id)},
                from_email=settings.BOOKINGS_EMAIL,
            )
            # Set idempotency marker after all emails, before chat room creation
            booking.authorized_emails_sent_at = timezone.now()
            booking.save(update_fields=["authorized_emails_sent_at"])
            if ChatRoom is not None:
                chat, created = ChatRoom.objects.get_or_create(booking=booking)
                if created:
                    print(f"ChatRoom created for booking {booking.id}")
                else:
                    print(f"ChatRoom already exists for booking {booking.id}")
            else:
                print("Chat app not installed; skipping ChatRoom creation.")
        except Booking.DoesNotExist:
            print("Booking not found for webhook")
    print(f"END _handle_checkout_session_completed, event_id={event['id']}")


def _handle_invoice_payment_succeeded(event):
    print(f"START _handle_invoice_payment_succeeded, event_id={event['id']}")
    with db_transaction.atomic():
        invoice = event['data']['object']
        subscription_id = invoice.get("subscription")
        if not subscription_id:
            print(f"END _handle_invoice_payment_succeeded, event_id={event['id']}")
            return
        try:
            premium_intent = PremiumSignupIntent.objects.get(
                subscription_id=subscription_id,
                status=PremiumSignupIntent.Status.PENDING,
            )
        except PremiumSignupIntent.DoesNotExist:
            print(f"END _handle_invoice_payment_succeeded, event_id={event['id']}")
            return
        premium_intent.status = PremiumSignupIntent.Status.PAID
        premium_intent.payment_intent_id = invoice.get("payment_intent")
        premium_intent.stripe_event_id = event.get("id")
        premium_intent.paid_at = timezone.now()
        premium_intent.save()
    print(f"END _handle_invoice_payment_succeeded, event_id={event['id']}")


def _handle_payment_intent_succeeded(event):
    print(f"START _handle_payment_intent_succeeded, event_id={event['id']}")
    with db_transaction.atomic():
        intent = event["data"]["object"]
        booking_id = intent["metadata"].get("booking_id")
        if not booking_id:
            print(f"END _handle_payment_intent_succeeded, event_id={event['id']}")
            return
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            print(f"END _handle_payment_intent_succeeded, event_id={event['id']}")
            return
        booking.status = Booking.Status.PAID
        booking.paid_at = timezone.now()
        booking.save(update_fields=["status", "paid_at"])
        Transaction.objects.filter(
            booking=booking,
            stripe_id=intent["id"],
            type=Transaction.Type.PAYMENT,
        ).update(status=Transaction.Status.SUCCEEDED)
    print(f"END _handle_payment_intent_succeeded, event_id={event['id']}")


def _handle_payment_intent_canceled(event):
    print(f"START _handle_payment_intent_canceled, event_id={event['id']}")
    with db_transaction.atomic():
        intent = event["data"]["object"]
        booking_id = intent["metadata"].get("booking_id")
        if not booking_id:
            print(f"END _handle_payment_intent_canceled, event_id={event['id']}")
            return
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            print(f"END _handle_payment_intent_canceled, event_id={event['id']}")
            return
        booking.status = Booking.Status.CANCELED
        booking.save(update_fields=["status"])
        Transaction.objects.filter(
            booking=booking,
            stripe_id=intent["id"],
            type=Transaction.Type.PAYMENT,
        ).update(status=Transaction.Status.FAILED)
    print(f"END _handle_payment_intent_canceled, event_id={event['id']}")


# --- MAIN WEBHOOK LOGIC (legacy) ---
def stripe_main_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    if not sig_header:
        return HttpResponse(status=400)
    event = None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    if event['type'] == 'checkout.session.completed':
        _handle_checkout_session_completed(event)
    elif event['type'] == 'invoice.payment_succeeded':
        _handle_invoice_payment_succeeded(event)
    elif event["type"] == "payment_intent.succeeded":
        _handle_payment_intent_succeeded(event)
    elif event["type"] == "payment_intent.canceled":
        _handle_payment_intent_canceled(event)
    return HttpResponse(status=200)


# --- SINGLE PUBLIC WEBHOOK ENTRYPOINT ---
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    if not sig_header:
        return HttpResponse(status=400)
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    event_type = event.get("type")
    if event_type not in STRIPE_HANDLED_EVENTS:
        # Ignore unhandled events, always return 200 OK
        return HttpResponse(status=200)
    if event_type == "checkout.session.completed":
        _handle_checkout_session_completed(event)
    elif event_type == "invoice.payment_succeeded":
        _handle_invoice_payment_succeeded(event)
    elif event_type == "payment_intent.succeeded":
        _handle_payment_intent_succeeded(event)
    elif event_type == "payment_intent.canceled":
        _handle_payment_intent_canceled(event)
    return HttpResponse(status=200)