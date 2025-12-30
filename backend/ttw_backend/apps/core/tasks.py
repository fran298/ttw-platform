from celery import shared_task
from apps.core.emails import send_email
from apps.bookings.models import Booking
import time
from django.conf import settings
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile



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