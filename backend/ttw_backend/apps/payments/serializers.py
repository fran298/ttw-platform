from rest_framework import serializers
from .models import MerchantPayout, Transaction
from apps.bookings.models import Booking

class MerchantPayoutSerializer(serializers.ModelSerializer):
    booking_id = serializers.UUIDField(source="booking.id", read_only=True)
    listing_title = serializers.CharField(source="booking.listing.title", read_only=True)
    provider_display_name = serializers.SerializerMethodField()

    def get_provider_display_name(self, obj):
        merchant = obj.merchant

        if merchant is None:
            return "Unknown"

        # ProviderProfile / InstructorProfile
        user = getattr(merchant, "user", None)
        if user and getattr(user, "email", None):
            return user.get_full_name() or user.email

        # MerchantProfile legal name
        legal_name = getattr(merchant, "legal_name", None)
        if legal_name:
            return legal_name

        return str(merchant)


    class Meta:
        model = MerchantPayout
        fields = [
            "id",
            "booking_id",
            "listing_title",
            "provider_display_name",
            "platform_fee",
            "amount_due",
            "currency",
            "status",
            "method",
            "created_at",
            "paid_at",
        ]

class AdminTransactionSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source="booking.id", read_only=True)
    listing_title = serializers.CharField(
        source="booking.listing.title",
        read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "booking_id",
            "listing_title",
            "type",
            "amount",
            "currency",
            "status",
            "stripe_id",
            "created_at",
        ]
