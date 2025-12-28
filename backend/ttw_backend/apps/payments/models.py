from django.db import models
from django.conf import settings
import uuid
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCEEDED = 'SUCCEEDED', 'Succeeded'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    class Type(models.TextChoices):
        PAYMENT = 'PAYMENT', 'User Payment'
        PAYOUT = 'PAYOUT', 'Provider Payout'
        REFUND = 'REFUND', 'Refund'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='transactions')
    
    stripe_id = models.CharField(max_length=255, unique=True) # PaymentIntent ID or Transfer ID
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    type = models.CharField(max_length=20, choices=Type.choices)
    
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.amount} ({self.status})"

class MerchantPayout(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'

    class Method(models.TextChoices):
        MANUAL = 'MANUAL', 'Manual Bank Transfer'
        STRIPE = 'STRIPE', 'Stripe Transfer'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='merchant_payouts'
    )
    # --- Financial snapshot (immutable after finalize) ---
    total_charged = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Final amount charged to the customer after completion"
    )

    platform_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Final TTW commission for this payout"
    )
    # Generic relation to support ProviderProfile or InstructorProfile
    merchant_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='payout_merchants',
        null=True,
        blank=True
    )
    merchant_object_id = models.UUIDField(null=True, blank=True)
    merchant = GenericForeignKey('merchant_content_type', 'merchant_object_id')

    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.STRIPE
    )

    stripe_transfer_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Stripe Transfer ID created after capture"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payout {self.amount_due} {self.currency} → {self.merchant}"

class PremiumSignupIntent(models.Model):
    """
    Represents a paid (or pending) Premium subscription
    BEFORE a user account is created.
    Used to safely continue onboarding after Stripe checkout.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        CONSUMED = "CONSUMED", "Consumed"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Stripe identifiers
    checkout_session_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    subscription_id = models.CharField(max_length=255, null=True, blank=True)
    payment_intent_id = models.CharField(max_length=255, null=True, blank=True)

    # Who this premium is intended for
    role = models.CharField(
        max_length=20,
        choices=[
            ("PROVIDER", "Provider"),
            ("INSTRUCTOR", "Instructor"),
        ],
    )

    email = models.EmailField(help_text="Email used during Stripe checkout")

    # Lifecycle
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Metadata / audit
    stripe_event_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Stripe webhook event that confirmed payment"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    consumed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"PremiumSignupIntent {self.id} ({self.role}) - {self.status}"