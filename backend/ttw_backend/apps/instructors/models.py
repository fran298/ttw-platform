from django.db import models
from django.conf import settings
# Ensure these apps exist and models are defined
from apps.locations.models import City
from apps.listings.models import Sport
from apps.providers.models import MerchantProfile

from django.db.models.signals import post_save
from django.dispatch import receiver

class InstructorProfile(models.Model):
    """
    Freelance Instructor Profile.
    Distinct from a 'School' (ProviderProfile) because it focuses on the individual.
    """
    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="instructor_profile"
    )

    # Public display name (used in public profiles instead of email)
    display_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Public name shown on instructor profile"
    )

    # Professional Info
    bio = models.TextField(blank=True)
    phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Contact phone number for the instructor"
    )
    experience_years = models.IntegerField(default=0)
    certifications = models.TextField(blank=True, help_text="List of certs (IKO, PADI)")
    
    # We use a URL field for simplicity in this MVP, or ImageField with Cloudinary
    profile_image = models.URLField(blank=True, null=True)

    # Cover image for instructor profile
    cover_image = models.URLField(blank=True, null=True)

    # Gallery of additional images (stored as a list of URLs)
    gallery = models.JSONField(default=list, blank=True)

    languages = models.JSONField(default=list) # ["en", "es"]
    
    # Location
    city = models.ForeignKey(
        City,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instructors",
        db_constraint=True,
    )
    sports = models.ManyToManyField(
        Sport,
        blank=True,
        related_name="instructors"
    )
    # Denormalized for faster search
    country_name = models.CharField(max_length=100, blank=True)
    
    currency = models.CharField(max_length=3, default="EUR")

    # Stripe (DEPRECATED — source of truth now lives in MerchantProfile)
    stripe_connect_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="DEPRECATED — Stripe Connect ID now lives in MerchantProfile"
    )
    # Merchant link (needed for payouts via Stripe)
    merchant = models.OneToOneField(
        MerchantProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="instructor"
    )

    # Commission settings
    is_subscribed = models.BooleanField(
        default=False,
        help_text="If True → instructor receives lower commission rate (15%)."
    )

    commission_rate = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=25.0,
        help_text="Commission percentage (15 for subscribed instructors, 25 for default)."
    )

    tax_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Legal name for invoices and payouts"
    )
    
    # Verification
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    legal_documents = models.FileField(
        upload_to="instructors/documents/",
        null=True,
        blank=True,
        help_text="Legal or certification documents uploaded for verification"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def city_name(self):
        return self.city.name if self.city else None

    def save(self, *args, **kwargs):
        # Auto-fill country_name from related city if available
        if self.city and not self.country_name:
            if hasattr(self.city, "country") and self.city.country:
                self.country_name = self.city.country.name
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display_name or self.user.email


@receiver(post_save, sender=InstructorProfile)
def sync_instructor_stripe_to_merchant(sender, instance, **kwargs):
    """
    Temporary migration safety:
    If legacy stripe_connect_id exists on InstructorProfile,
    ensure it is copied to MerchantProfile (source of truth).
    """
    if instance.stripe_connect_id and instance.merchant:
        if not instance.merchant.stripe_connect_id:
            instance.merchant.stripe_connect_id = instance.stripe_connect_id
            instance.merchant.save(update_fields=["stripe_connect_id"])