from rest_framework import serializers
from .models import Booking
from apps.listings.serializers import ListingSerializer
from apps.users.serializers import UserSerializer
from django.utils import timezone

# 1. READ SERIALIZER (Rich Data for Dashboard)
class BookingSerializer(serializers.ModelSerializer):
    # Nested Objects for Display
    listing = ListingSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    traveler = UserSerializer(source="user", read_only=True)
    
    # Computed Field for Frontend Logic
    is_past = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'traveler', 'listing', 'status', 
            'start_date', 'end_date', 'guests',
            'total_price', 'currency', 
            'created_at', 'is_past',
            'listing_snapshot', # Important for historical accuracy
            'provider_name', 'instructor_name',
            'city_name',
            'country_name',
            'estimated_platform_fee',
            'estimated_provider_amount',
            'adjusted_total_price',
            'platform_fee',
            'provider_amount',
            'completion_percentage',
            'paid_at',
            'service_fee',
            'provider_payout',
        ]
        read_only_fields = ['total_price', 'service_fee', 'provider_payout', 'status']

    def get_is_past(self, obj):
        return obj.start_date < timezone.now().date()

    def get_provider_name(self, obj):
        owner = getattr(obj.listing, "owner", None)
        if not owner:
            return None

        if hasattr(owner, "provider_profile") and getattr(owner.provider_profile, "company_name", None):
            return owner.provider_profile.company_name

        return owner.email

    def get_instructor_name(self, obj):
        owner = getattr(obj.listing, "owner", None)
        if owner and owner.role == "INSTRUCTOR":
            return owner.email
        return None

    def get_city_name(self, obj):
        if obj.listing and getattr(obj.listing, "city", None):
            return obj.listing.city.name
        return None

    def get_country_name(self, obj):
        if obj.listing and getattr(obj.listing, "city", None) and getattr(obj.listing.city, "country", None):
            return obj.listing.city.country.name
        return None


# 2. WRITE SERIALIZER (Minimal Input for Checkout)
class CreateBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'listing', 'start_date', 'end_date', 'guests'
        ]
    
    def validate(self, data):
        """
        Expert Validation:
        1. Check availability (Overlap logic)
        2. Prevent booking past dates
        """
        if data['start_date'] < timezone.now().date():
            raise serializers.ValidationError("Cannot book dates in the past.")

        # Add Availability Check Here (Optional for MVP, Critical for Prod)
        # existing = Booking.objects.filter(listing=data['listing'], start_date=data['start_date'])
        # if existing.exists(): raise serializers.ValidationError("Date unavailable")


        return data

# 3. ADMIN SERIALIZER (Dashboard Owner / Platform)
class AdminBookingSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    listing_title = serializers.CharField(source="listing.title", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user_email",
            "listing_title",
            "status",
            "total_price",
            "estimated_platform_fee",
            "estimated_provider_amount",
            "adjusted_total_price",
            "platform_fee",
            "provider_amount",
            "paid_at",
            "created_at",
            "service_fee",
            "provider_payout",
        ]