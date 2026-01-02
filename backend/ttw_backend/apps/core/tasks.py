from celery import shared_task
from apps.core.emails import send_email
from apps.bookings.models import Booking
import time
from django.conf import settings
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile
from django.utils import timezone



@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=10,
    retry_kwargs={"max_retries": 3},
)
def send_booking_email_task(
    self,
    *,
    to,
    subject,
    template,
    context,
    from_email=None,
):
    """
    Background task to send booking-related emails safely.
    Resolves booking from booking_id and injects it into template context.
    """

    booking_id = context.get("booking_id")
    if not booking_id:
        raise Exception("send_booking_email_task requires booking_id in context")

    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        raise Exception(f"Booking {booking_id} not found for email task")

    # Inject booking object for templates
    context = {"booking": booking}

    # Normalize recipients (Resend allows max 2, so send one by one)
    if isinstance(to, str):
        recipients = [to]
    else:
        recipients = list(to)

    for recipient in recipients:
        send_email(
            to=recipient,
            subject=subject,
            template=template,
            context=context,
            from_email=from_email,
        )

        # Respect Resend rate limits
        time.sleep(0.6)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_booking_authorized_user_email(self, booking_id: str):
    booking = Booking.objects.get(id=booking_id)

    if booking.authorized_user_email_sent_at:
        return

    if not booking.user or not booking.user.email:
        return

    send_email(
        to=booking.user.email,
        subject="Your booking is authorized – The Travel Wild",
        template="booking_authorized_user",
        context={"booking": booking},
        from_email=settings.BOOKINGS_EMAIL,
    )

    booking.authorized_user_email_sent_at = timezone.now()
    booking.save(update_fields=["authorized_user_email_sent_at"])


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_booking_authorized_provider_email(self, booking_id: str):
    booking = Booking.objects.get(id=booking_id)

    if booking.authorized_provider_email_sent_at:
        return

    merchant = getattr(booking.listing, "merchant", None)
    merchant_user = getattr(merchant, "user", None) if merchant else None
    provider_email = getattr(merchant_user, "email", None)

    if not provider_email:
        return

    send_email(
        to=provider_email,
        subject="New booking authorized – The Travel Wild",
        template="booking_authorized_provider",
        context={"booking": booking},
        from_email=settings.BOOKINGS_EMAIL,
    )

    booking.authorized_provider_email_sent_at = timezone.now()
    booking.save(update_fields=["authorized_provider_email_sent_at"])


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_booking_authorized_admin_email(self, booking_id: str):
    booking = Booking.objects.get(id=booking_id)

    if booking.authorized_admin_email_sent_at:
        return

    support_email = getattr(settings, "SUPPORT_EMAIL", None)
    if not support_email:
        return

    send_email(
        to=support_email,
        subject="New booking authorized – Internal notification",
        template="booking_authorized_admin",
        context={"booking": booking},
        from_email=settings.BOOKINGS_EMAIL,
    )

    booking.authorized_admin_email_sent_at = timezone.now()
    booking.save(update_fields=["authorized_admin_email_sent_at"])


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_premium_partner_activated_admin_email(self, premium_intent_id: str, activated_target: str):
    send_email(
        to=["partners@thetravelwild.com", "support@thetravelwild.com"],
        subject="Premium Partner activated",
        template="premium_partner_activated_admin",
        context={
            "premium_intent_id": premium_intent_id,
            "activated_target": activated_target,
        },
        from_email=settings.BOOKINGS_EMAIL,
    )


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_premium_partner_pending_admin_email(self, premium_intent_id: str):
    send_email(
        to=["partners@thetravelwild.com", "support@thetravelwild.com"],
        subject="New Premium Partner Purchase (Pending Signup)",
        template="premium_partner_pending_admin",
        context={
            "premium_intent_id": premium_intent_id,
        },
        from_email=settings.BOOKINGS_EMAIL,
    )


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=10,
    retry_kwargs={"max_retries": 3},
)
def send_provider_documents_uploaded_email_task(*, provider_id: str):
    """
    Notifies PARTNERS when a provider uploads legal documents.
    Attaches the uploaded files to the email.
    """
    provider = ProviderProfile.objects.select_related("user").get(id=provider_id)

    partners_email = getattr(settings, "PARTNERS_EMAIL", None)
    if not partners_email:
        raise Exception("PARTNERS_EMAIL is not configured in settings")

    attachments = []

    if provider.legal_documents:
        attachments.append({
            "filename": provider.legal_documents.name.split("/")[-1],
            "file": provider.legal_documents.file,
        })

    send_email(
        to=[partners_email],
        subject="New school documents uploaded",
        template="provider_documents_uploaded",
        context={
            "provider": provider,
        },
        attachments=attachments,
        from_email=settings.BOOKINGS_EMAIL,
    )

@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=5,
    retry_kwargs={"max_retries": 5},
)
def send_instructor_documents_uploaded_email_task(*, instructor_id: str):
    """
    Notifies PARTNERS when an instructor uploads legal documents.
    """
    instructor = InstructorProfile.objects.select_related("user").get(id=instructor_id)

    partners_email = getattr(settings, "PARTNERS_EMAIL", None)
    if not partners_email:
        raise Exception("PARTNERS_EMAIL is not configured in settings")

    attachments = []

    if hasattr(instructor, "legal_documents") and instructor.legal_documents:
        attachments.append({
            "filename": instructor.legal_documents.name.split("/")[-1],
            "file": instructor.legal_documents.file,
        })

    send_email(
        to=[partners_email],
        subject="New instructor documents uploaded",
        template="instructor_documents_uploaded",
        context={
            "instructor": instructor,
        },
        attachments=attachments,
        from_email=settings.BOOKINGS_EMAIL,
    )