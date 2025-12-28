from django.contrib import admin
from .models import Booking, AdminNotification

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'listing', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'listing__title', 'id')
    readonly_fields = ('service_fee', 'provider_payout', 'listing_snapshot')

@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = (
        "type",
        "booking",
        "is_read",
        "created_at",
    )

    list_filter = (
        "type",
        "is_read",
        "created_at",
    )

    search_fields = (
        "booking__id",
        "message",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "type",
        "title",
        "message",
        "booking",
        "created_at",
    )

    actions = ["mark_as_read"]

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    mark_as_read.short_description = "Mark selected notifications as read"