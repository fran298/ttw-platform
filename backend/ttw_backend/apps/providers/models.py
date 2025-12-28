from django.db import models
from django.conf import settings
import uuid
from apps.locations.models import City

from apps.listings.models import Sport

# --- NEW: MERCHANT PROFILE ---
class MerchantProfile(models.Model):
    class MerchantType(models.TextChoices):
        PROVIDER = 'PROVIDER', 'Provider'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='merchant_profile'
    )
    type = models.CharField(max_length=20, choices=MerchantType.choices)
    stripe_connect_id = models.CharField(max_length=255, blank=True, null=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)
    legal_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    logo = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} ({self.type})"

class ProviderProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.OneToOneField(
        'MerchantProfile',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='provider'
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_profile'
    )

    # DEPRECATED: Stripe Connect ID now lives in MerchantProfile
    stripe_connect_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="DEPRECATED — Stripe Connect ID now lives in MerchantProfile"
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )

    # Subscription status (affects commission %)
    is_subscribed = models.BooleanField(
        default=False,
        help_text="If True → commission_rate becomes 15%. If False → 25%."
    )

    # Commission percentage (NOT decimal fraction). Example: 15 or 25
    commission_rate = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=25.0,  # Default 25%
        help_text="Commission percentage (15 for subscribed providers, 25 for normal providers)"
    )

    # Business Info
    company_name = models.CharField(max_length=100)
    # Profile image (previously logo)
    profile_image = models.URLField(blank=True, null=True)

    # Cover image for provider profile
    cover_image = models.URLField(blank=True, null=True)

    # Gallery of images (list of URLs)
    gallery = models.JSONField(default=list, blank=True)

    description = models.TextField(blank=True)

    # Extra Business Info from Signup
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    id_number = models.CharField(max_length=50, blank=True, null=True)

    banner_image = models.URLField(blank=True, null=True)


    tax_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Legal name for invoices and payouts"
    )
    
    # Documents (Private)
    legal_documents = models.FileField(upload_to='providers/docs/', blank=True, null=True)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    instagram = models.URLField(blank=True)

    # Sports (from signup selection)
    sports = models.ManyToManyField(
        Sport,
        related_name="providers",
        blank=True
    )

    # Location (Linked to Geo App)
    city = models.ForeignKey(City, on_delete=models.SET_NULL, null=True, blank=True, related_name='providers')
    address = models.CharField(max_length=255, blank=True)
    
    # Settings
    auto_accept_bookings = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

    def apply_subscription_commission(self):
        """
        Premium (subscribed) providers → 15%
        Normal providers → 25%
        """
        self.commission_rate = 15.0 if self.is_subscribed else 25.0

# --- NEW: NOTIFICATIONS SYSTEM ---
class ProviderNotification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    # Link to trigger (e.g. Booking ID)
    action_link = models.CharField(max_length=200, blank=True) 
    
    created_at = models.DateTimeField(auto_now_add=True)

# --- NEW: CHAT SYSTEM (Simple) ---
class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='conversations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # For sorting recent chats

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=ProviderProfile)
def ensure_merchant_profile(sender, instance, created, **kwargs):
    """
    Automatically create a MerchantProfile for every ProviderProfile created.
    Ensures merchant relation always exists.
    """
    if created and not instance.merchant:
        instance.apply_subscription_commission()
        instance.save(update_fields=["commission_rate"])

        merchant = MerchantProfile.objects.create(
            user=instance.user,
            type=MerchantProfile.MerchantType.PROVIDER,
            commission_rate=instance.commission_rate,
            legal_name=instance.company_name,
            phone=instance.phone,
            logo=None,
        )
        instance.merchant = merchant
        instance.save(update_fields=["merchant"])

    if instance.merchant:
        instance.apply_subscription_commission()
        if instance.merchant.commission_rate != instance.commission_rate:
            instance.merchant.commission_rate = instance.commission_rate
            instance.merchant.save(update_fields=["commission_rate"])

    # --- Stripe Connect migration safety ---
    # If legacy stripe_connect_id exists on ProviderProfile,
    # ensure it is copied to MerchantProfile (source of truth)
    if instance.stripe_connect_id and instance.merchant:
        if not instance.merchant.stripe_connect_id:
            instance.merchant.stripe_connect_id = instance.stripe_connect_id
            instance.merchant.save(update_fields=["stripe_connect_id"])

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_merchant_for_instructor(sender, instance, created, **kwargs):
    """
    Automatically create a MerchantProfile for instructors (Freelancers) if their
    InstructorProfile exists but they lack a merchant account.
    Triggered when a User is saved, ensuring instructor_profile is already created.
    """
    instructor = getattr(instance, "instructor_profile", None)
    merchant = getattr(instance, "merchant_profile", None)

    # Only proceed if user has an instructor profile
    if instructor and not merchant:
        merchant = MerchantProfile.objects.create(
            user=instance,
            type=MerchantProfile.MerchantType.INSTRUCTOR,
            commission_rate=instructor.commission_rate,
            legal_name=instance.email,
            phone=getattr(instructor, "phone", None),
            logo=getattr(instructor, "profile_image", None),
        )
        instructor.merchant = merchant
        instructor.save(update_fields=["merchant"])

    # Sync commission rate if instructor already had a merchant
    if instructor and merchant and merchant.commission_rate != instructor.commission_rate:
        merchant.commission_rate = instructor.commission_rate
        merchant.save(update_fields=["commission_rate"])