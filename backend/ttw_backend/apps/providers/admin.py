from django.contrib import admin
from .models import ProviderProfile, MerchantProfile

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'company_name',
        'user',
        'verification_status',
        'auto_accept_bookings',
        'created_at'
    )
    list_filter = (
        'verification_status',
        'auto_accept_bookings',
        'created_at'
    )
    search_fields = (
        'company_name',
        'user__email'
    )
    readonly_fields = (
        'id',
        'created_at'
    )

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