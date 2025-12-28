from django.contrib import admin
from django.utils import timezone
from .models import Transaction, MerchantPayout


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'booking',
        'type',
        'amount',
        'currency',
        'status',
        'stripe_id',
        'created_at'
    )
    list_filter = ('type', 'status', 'currency', 'created_at')
    search_fields = ('id', 'stripe_id', 'booking__id')
    ordering = ('-created_at',)


@admin.register(MerchantPayout)
class MerchantPayoutAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'booking_id_display',
        'listing_title',
        'merchant',
        'amount_due',
        'platform_fee',
        'currency',
        'status',
        'method',
        'created_at',
        'paid_at'
    )
    list_filter = ('status', 'method', 'currency', 'created_at')
    search_fields = ('id', 'booking__id', 'merchant__name')
    ordering = ('-created_at',)

    actions = ['mark_as_paid']

    def mark_as_paid(self, request, queryset):
        """
        Mark payouts as PAID.
        This represents that the platform has executed the payout
        (manual transfer or Stripe Connect transfer).
        """
        updated = 0

        for payout in queryset.select_for_update():
            if payout.status != MerchantPayout.Status.PENDING:
                continue

            payout.status = MerchantPayout.Status.PAID
            payout.paid_at = timezone.now()
            payout.save(update_fields=["status", "paid_at"])
            updated += 1

        self.message_user(
            request,
            f"{updated} payout(s) successfully marked as PAID."
        )
    mark_as_paid.short_description = "Mark selected payouts as PAID (manual payout)"

    def booking_id_display(self, obj):
        return obj.booking.id
    booking_id_display.short_description = "Booking ID"

    def listing_title(self, obj):
        return obj.booking.listing.title if obj.booking and obj.booking.listing else "—"
    listing_title.short_description = "Listing"