from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
from django.utils import timezone

class Booking(models.Model):
    
    class Status(models.TextChoices):
        AUTHORIZED = "AUTHORIZED", "Payment Authorized"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.PROTECT, # Prevent deleting listing if active bookings exist
        related_name='bookings'
    )
    session = models.ForeignKey(
        'calendar.Session',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # Schedule
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    guests = models.PositiveIntegerField(default=1)
    
    # Financials
    currency = models.CharField(max_length=3, default='EUR')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Platform Revenue Logic
    service_fee = models.DecimalField(
        max_digits=10, decimal_places=2, 
        default=0, validators=[MinValueValidator(0)]
    )
    provider_payout = models.DecimalField(
        max_digits=10, decimal_places=2, 
        default=0, validators=[MinValueValidator(0)]
    )

    # Estimated financials (before finalization)
    estimated_platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated platform fee before finalization"
    )

    estimated_provider_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated provider payout before finalization"
    )

    # Final financials (after completion / capture)
    amount_captured = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Actual amount captured from the customer after completion"
    )

    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final platform commission based on captured amount"
    )

    provider_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final payout amount for provider based on captured amount"
    )

    # Activity completion / adjustment
    completion_percentage = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Declared completion percentage (0–100)"
    )

    adjusted_total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Final amount after partial completion or adjustment"
    )

    adjustment_reason = models.TextField(
        blank=True,
        help_text="Reason for partial completion or cancellation"
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the activity was finalized by the provider"
    )

    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the booking was cancelled or marked as 0% completed"
    )

    # Payment
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    payment_authorized_at = models.DateTimeField(null=True, blank=True)

    # Email idempotency
    authorized_user_email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When booking authorized email was sent to the user"
    )

    authorized_provider_email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When booking authorized email was sent to the provider"
    )

    authorized_admin_email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When booking authorized email was sent to admin/support"
    )

    final_emails_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When booking finalized emails were enqueued/sent"
    )

    paid_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.AUTHORIZED
    )

    # Data Snapshot (Crucial for History/Invoices if listing changes later)
    listing_snapshot = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user']),
            models.Index(fields=['listing']),
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.status}"

    def calculate_final_financials(self):
        """
        SINGLE SOURCE OF TRUTH for ALL financial calculations.
        Called when completion_percentage is set or updated.
        """
        from decimal import Decimal, ROUND_HALF_UP

        if self.completion_percentage is None:
            return

        # 1. Calculate adjusted total based on completion %
        completion_ratio = Decimal(self.completion_percentage) / Decimal("100")
        adjusted_total = (Decimal(self.total_price) * completion_ratio).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # 2. Determine commission rate
        commission_rate = Decimal("0.25")  # default

        owner = self.listing.owner

        if hasattr(owner, "provider_profile") and owner.provider_profile.is_subscribed:
            commission_rate = Decimal("0.15")
        elif hasattr(owner, "instructor_profile") and owner.instructor_profile.is_subscribed:
            commission_rate = Decimal("0.15")

        # 3. Calculate fees
        platform_fee = (adjusted_total * commission_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        provider_amount = (adjusted_total - platform_fee).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # 4. Persist values
        self.adjusted_total_price = adjusted_total
        self.platform_fee = platform_fee
        self.provider_amount = provider_amount
        self.service_fee = platform_fee
        self.provider_payout = provider_amount

    def save(self, *args, **kwargs):
        print("🔥 BOOKING SAVE EJECUTADO:", self.id)
        listing = self.listing

        # ----------------------------------------------------
        # 1) GENERAR SNAPSHOT SI NO EXISTE
        # ----------------------------------------------------
        if listing and (not self.listing_snapshot or "title" not in self.listing_snapshot):
            provider_name = None
            merchant = getattr(listing, "merchant", None)

            if merchant and hasattr(merchant, "provider") and merchant.provider:
                provider_name = merchant.provider.company_name
            elif merchant and hasattr(merchant, "instructor") and merchant.instructor:
                provider_name = merchant.instructor.user.email
            else:
                provider_name = listing.owner.email

            self.listing_snapshot = {
                "title": listing.title,
                "provider_name": provider_name,
                "image": listing.images[0] if listing.images else None,
                "sport": listing.sport.slug,
            }

        # ----------------------------------------------------
        # 2) CALCULAR FINANZAS SI ES NUEVO BOOKING
        # ----------------------------------------------------
        # Removed initial commission calculation block as per instructions

        # ----------------------------------------------------
        # 2.5) ESTIMATED FINANCIALS (AUTHORIZED ONLY)
        # ----------------------------------------------------
        if (
            self.status == Booking.Status.AUTHORIZED
            and self.estimated_provider_amount is None
            and self.total_price
        ):
            from decimal import Decimal, ROUND_HALF_UP

            commission_rate = Decimal("0.25")
            owner = self.listing.owner

            if hasattr(owner, "provider_profile") and owner.provider_profile.is_subscribed:
                commission_rate = Decimal("0.15")
            elif hasattr(owner, "instructor_profile") and owner.instructor_profile.is_subscribed:
                commission_rate = Decimal("0.15")

            estimated_fee = (Decimal(self.total_price) * commission_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            estimated_payout = (Decimal(self.total_price) - estimated_fee).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            self.estimated_platform_fee = estimated_fee
            self.estimated_provider_amount = estimated_payout

        # ----------------------------------------------------
        # 3) LIFECYCLE TIMESTAMPS
        # ----------------------------------------------------
        if self.status == Booking.Status.COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()

        if self.status == Booking.Status.CANCELLED and not self.cancelled_at:
            self.cancelled_at = timezone.now()

        # ----------------------------------------------------
        # 4) FINAL FINANCIAL CALCULATION (ENFORCED)
        # ----------------------------------------------------
        if self.completion_percentage is not None:
            self.calculate_final_financials()

        super().save(*args, **kwargs)


class AdminNotification(models.Model):
    """
    Internal notifications for admin / ops dashboard.
    Created on important lifecycle events (e.g. booking finalized).
    """

    class Type(models.TextChoices):
        BOOKING_FINALIZED = "BOOKING_FINALIZED", "Booking Finalized"
        BOOKING_PARTIAL = "BOOKING_PARTIAL", "Booking Partially Completed"
        BOOKING_CANCELLED = "BOOKING_CANCELLED", "Booking Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    type = models.CharField(
        max_length=50,
        choices=Type.choices
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="admin_notifications"
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"[ADMIN] {self.type} – Booking {self.booking_id}"