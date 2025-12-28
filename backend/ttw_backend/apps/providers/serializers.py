from rest_framework import serializers
from .models import ProviderProfile, ProviderNotification, Conversation, Message, MerchantProfile
from apps.users.serializers import UserSerializer
from apps.locations.models import City
from apps.listings.models import Sport


# ============================
# DOCUMENT SUBMISSION SERIALIZER
# ============================

class ProviderDocumentsSerializer(serializers.ModelSerializer):
    """
    Used ONLY to submit / update legal documents.
    Triggers compliance workflow.
    """
    class Meta:
        model = ProviderProfile
        fields = ("legal_documents",)

    def update(self, instance, validated_data):
        user = instance.user

        instance.legal_documents = validated_data.get(
            "legal_documents", instance.legal_documents
        )
        instance.verification_status = ProviderProfile.VerificationStatus.PENDING
        instance.save(update_fields=["legal_documents", "verification_status"])

        # Mark user as documents submitted
        if user:
            user.is_documents_submitted = True
            user.is_approved = False
            user.save(update_fields=["is_documents_submitted", "is_approved"])

        return instance

class MerchantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantProfile
        fields = '__all__'

# ⚠️ DEPRECATED — DO NOT USE FOR PUBLIC ENDPOINTS
# This serializer exposes internal fields and must be replaced
# by ProviderPublicSafeSerializer in all AllowAny views.
class ProviderPublicSerializer(serializers.ModelSerializer):
    """ Public data visible to travelers 
        ALSO used for creation fallback if misconfigured in ViewSet
    """
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        required=False,
        allow_null=True
    )
    sports = serializers.SlugRelatedField(
        many=True,
        slug_field='slug',
        queryset=Sport.objects.all(),
        required=False
    )
    city_name = serializers.CharField(source='city.name', read_only=True)
    country_name = serializers.CharField(source='city.country.name', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'company_name', 'profile_image', 'cover_image', 'description',
            'city', 'city_name', 'country_name',
            'verification_status', 'instagram',
            'address', 'auto_accept_bookings',
            'sports'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        sports = validated_data.pop('sports', None)
        city = validated_data.pop('city', None)

        provider, _ = ProviderProfile.objects.update_or_create(
            user=user,
            defaults={
                **validated_data,
                "city": city
            }
        )
        if sports is not None:
            provider.sports.set(sports)
        return provider

class ProviderDashboardSerializer(serializers.ModelSerializer):
    """ Private data for the Provider Dashboard """
    email = serializers.EmailField(source='user.email', read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        required=False,
        allow_null=True
    )
    sports = serializers.SlugRelatedField(
        many=True,
        slug_field='slug',
        queryset=Sport.objects.all(),
        required=False
    )
    
    upcoming_bookings = serializers.SerializerMethodField()
    city_name = serializers.CharField(source='city.name', read_only=True)
    country_name = serializers.CharField(source='city.country.name', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = '__all__'
        read_only_fields = (
            'id',
            'user',
            'verification_status',
        )

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        sports = validated_data.pop('sports', None)
        city = validated_data.pop('city', None)

        provider, _ = ProviderProfile.objects.update_or_create(
            user=user,
            defaults={
                **validated_data,
                "city": city
            }
        )
        if sports is not None:
            provider.sports.set(sports)
        return provider

    def update(self, instance, validated_data):
        sports = validated_data.pop('sports', None)
        city = validated_data.get('city', None)

        if city is not None:
            instance.city = city

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if sports is not None:
            instance.sports.set(sports)

        return instance

    def get_upcoming_bookings(self, obj):
        from apps.bookings.models import Booking
        from datetime import date
        qs = Booking.objects.filter(
            listing__owner=obj.user,
            start_date__gte=date.today(),
            status="CONFIRMED"
        ).order_by("start_date")[:10]

        return [
            {
                "id": b.id,
                "title": b.listing_snapshot.get("title") if b.listing_snapshot else b.listing.title,
                "date": b.start_date,
                "guests": b.guests,
                "total_price": b.total_price,
            }
            for b in qs
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderNotification
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.email', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'text', 'created_at', 'sender', 'sender_name', 'is_read']

class ConversationSerializer(serializers.ModelSerializer):
    other_party = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_party', 'last_message', 'updated_at']

    def get_other_party(self, obj):
        return {
            "name": obj.user.email, 
            "id": obj.user.id
        }

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return MessageSerializer(last).data
        return None

# 🔥 ADDED THIS CLASS TO FIX IMPORT ERROR IN USERS/VIEWS.PY
class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    merchant = serializers.PrimaryKeyRelatedField(read_only=True)

    # Profile image field
    profile_image = serializers.ImageField(required=False, allow_null=True)

    # Cover image field
    cover_image = serializers.ImageField(required=False, allow_null=True)

    # Gallery of image URLs
    gallery = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    
    # Optional Helpers
    city_name = serializers.CharField(source='city.name', read_only=True)
    country_name = serializers.CharField(source='city.country.name', read_only=True)

    commission = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = '__all__'

    def get_commission(self, obj):
        """
        Expose commission ONLY to admin users.
        Public users must never see this field.
        """
        request = self.context.get("request")
        if request and request.user and request.user.is_staff:
            merchant = getattr(obj, "merchant", None)
            if merchant and merchant.commission_rate is not None:
                return float(merchant.commission_rate)
        return None
# SIMPLE serializer for /providers/me/
# Mirrors InstructorProfileSerializer behavior.
# No computed fields. No payouts. No joins.
class ProviderMeSerializer(serializers.ModelSerializer):
    """
    SIMPLE serializer for /providers/me/
    Mirrors InstructorProfileSerializer behavior.
    No computed fields. No payouts. No joins.
    """
    user = UserSerializer(read_only=True)

    commission_rate = serializers.SerializerMethodField()
    is_stripe_connected = serializers.SerializerMethodField()

    sports = serializers.SlugRelatedField(
        many=True,
        slug_field="slug",
        queryset=Sport.objects.all()
    )

    phone = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    website = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "company_name",
            "description",
            "profile_image",
            "cover_image",
            "phone",
            "website",
            "address",
            "sports",
            "user",
            "commission_rate",
            "is_stripe_connected",
            "city",
        )

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        sports = validated_data.pop("sports", [])
        city = validated_data.pop("city", None)
        provider, _ = ProviderProfile.objects.update_or_create(
            user=user,
            defaults={**validated_data, "city": city},
        )
        if sports:
            provider.sports.set(sports)
        return provider

    def update(self, instance, validated_data):
        sports = validated_data.pop("sports", None)
        city = validated_data.pop("city", None)
        if city is not None:
            instance.city = city
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if sports is not None:
            instance.sports.set(sports)
        return instance

    def get_commission_rate(self, obj):
        """
        Single source of truth for Provider commission.
        Source of truth = MerchantProfile.commission_rate
        """
        merchant = getattr(obj, "merchant", None)
        if not merchant:
            return None
        return float(merchant.commission_rate) if merchant.commission_rate is not None else None

    def get_is_stripe_connected(self, obj):
        """
        Stripe connection status for dashboard.
        Stripe account lives ONLY in MerchantProfile.
        """
        merchant = getattr(obj, "merchant", None)
        if not merchant:
            return False
        return bool(merchant.stripe_connect_id)

# ============================
# ADMIN SERIALIZERS
# ============================

class AdminProviderSerializer(serializers.ModelSerializer):
    """
    Serializer used ONLY for Admin Dashboard.
    Exposes real commission data (finance-safe).
    """

    email = serializers.EmailField(source="user.email", read_only=True)

    city_name = serializers.CharField(source="city.name", read_only=True)
    country_name = serializers.CharField(source="city.country.name", read_only=True)

    commission = serializers.SerializerMethodField()

    merchant_id = serializers.UUIDField(
        source="merchant.id",
        read_only=True
    )

    status = serializers.CharField(
        source="verification_status",
        read_only=True
    )

    type = serializers.SerializerMethodField()

    def get_type(self, obj):
        return "SCHOOL"

    class Meta:
        model = ProviderProfile
        fields = (
            "id",
            "company_name",
            "email",
            "type",
            "city_name",
            "country_name",
            "status",
            "merchant_id",
            "commission",
        )
    def get_commission(self, obj):
        """
        Commission is defined in MerchantProfile.
        Django Admin edits ProviderProfile, but the real source of truth
        is obj.merchant.commission_rate.
        """
        merchant = getattr(obj, "merchant", None)
        if not merchant or merchant.commission_rate is None:
            return None
        return float(merchant.commission_rate)

class ProviderPublicSafeSerializer(serializers.ModelSerializer):
    """
    PUBLIC SAFE serializer for marketplace / public profiles.
    MUST NOT expose any sensitive or operational data.
    """
    city_name = serializers.CharField(source="city.name", read_only=True)
    country_name = serializers.CharField(source="city.country.name", read_only=True)

    sports = serializers.SlugRelatedField(
        many=True,
        slug_field="slug",
        read_only=True
    )

    class Meta:
        model = ProviderProfile
        fields = [
            "id",
            "company_name",
            "description",
            "profile_image",
            "cover_image",
            "city_name",
            "country_name",
            "instagram",
            "sports",
        ]