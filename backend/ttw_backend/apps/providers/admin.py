from django.contrib import admin
from .models import ProviderProfile, MerchantProfile

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company_name",
        "user_email",
        "verification_status",
        "auto_accept_bookings",
        "created_at",
    )

    list_filter = (
        "verification_status",
        "auto_accept_bookings",
        "created_at",
    )

    search_fields = (
        "company_name",
        "user__email",
    )

    readonly_fields = (
        "id",
        "created_at",
        "user",
    )

    raw_id_fields = ("user",)

    ordering = ("-created_at",)

    @admin.display(description="User email", ordering="user__email")
    def user_email(self, obj):
        return obj.user.email if obj.user_id else "-"

@admin.register(MerchantProfile)
class MerchantProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'type',
        'stripe_connect_id',
        'commission_rate',
        'created_at'
    )
    list_filter = (
        'type',
        'created_at'
    )
    search_fields = (
        'user__email',
        'stripe_connect_id'
    )
    readonly_fields = (
        'id',
        'created_at'
    )