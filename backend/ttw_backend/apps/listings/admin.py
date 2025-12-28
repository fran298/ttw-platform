from django.contrib import admin
from .models import Listing, Sport

@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'listing_count')
    search_fields = ('name', 'category')
    list_filter = ('category',)
    prepopulated_fields = {'slug': ('name',)}
    
    def listing_count(self, obj):
        return obj.listings.count()
    listing_count.short_description = "Active Listings"

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    # FIX: Changed 'provider' to 'owner'
    list_display = ('title', 'type', 'sport', 'owner', 'merchant', 'price', 'status', 'is_verified')
    list_filter = ('type', 'status', 'is_verified', 'sport', 'created_at')
    search_fields = ('title', 'description', 'city__name', 'owner__email')
    readonly_fields = ('created_at', 'slug')
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'slug', 'type', 'sport', 'owner', 'merchant', 'status')
        }),
        ('Pricing & Details', {
            'fields': ('price', 'currency', 'description', 'details')
        }),
        ('Media', {
            'fields': ('images',)
        }),
        ('Stats', {
            'fields': ('rating', 'review_count', 'is_verified', 'created_at')
        })
    )