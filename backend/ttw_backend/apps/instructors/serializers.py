from rest_framework import serializers
from .models import InstructorProfile
from apps.locations.models import City
from apps.users.serializers import UserSerializer
from apps.listings.models import Sport


# Public-facing instructor serializer.
# SAFE: no emails, no user object, no commission, no internal flags.
class InstructorPublicSafeSerializer(serializers.ModelSerializer):
    """
    Public-facing instructor serializer.
    SAFE: no emails, no user object, no commission, no internal flags.
    """

    avatar = serializers.SerializerMethodField()
    city_name = serializers.CharField(source="city.name", read_only=True)
    country_name = serializers.CharField(source="city.country.name", read_only=True)
    sports = serializers.SlugRelatedField(
        many=True,
        slug_field="slug",
        read_only=True
    )

    class Meta:
        model = InstructorProfile
        fields = (
            "id",
            "display_name",
            "bio",
            "avatar",
            "city_name",
            "country_name",
            "sports",
            "languages",
            "cover_image",
            "gallery",
        )

    def get_avatar(self, obj):
        img = getattr(obj, "profile_image", None)
        if img:
            if isinstance(img, dict):
                return img.get("secure_url") or img.get("url")
            return img

        user = getattr(obj, "user", None)
        if user:
            user_img = getattr(user, "avatar", None)
            if user_img:
                if isinstance(user_img, dict):
                    return user_img.get("secure_url") or user_img.get("url")
                return user_img

        return None


class InstructorProfileSerializer(serializers.ModelSerializer):
    # Expose full user info
    user = UserSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()
    commission_rate = serializers.SerializerMethodField()
    def get_avatar(self, obj):
        """
        Normalized avatar for frontend consumption.
        Supports Cloudinary object or plain string.
        """
        # 1. Instructor profile image (if exists)
        img = getattr(obj, "profile_image", None)
        if img:
            if isinstance(img, dict):
                return img.get("secure_url") or img.get("url")
            return img

        # 2. Fallback to user avatar
        user = getattr(obj, "user", None)
        if user:
            user_img = getattr(user, "avatar", None)
            if user_img:
                if isinstance(user_img, dict):
                    return user_img.get("secure_url") or user_img.get("url")
                return user_img

        return None

    def get_commission_rate(self, obj):
        """
        Single source of truth for economic commission.
        Source of truth = MerchantProfile.commission_rate
        """
        merchant = getattr(obj, "merchant", None)
        if merchant and merchant.commission_rate is not None:
            return float(merchant.commission_rate)

        # Instructor may inherit commission from provider merchant
        provider = getattr(obj, "provider", None)
        if provider and getattr(provider, "merchant", None):
            if provider.merchant.commission_rate is not None:
                return float(provider.merchant.commission_rate)

        return None


    # Relations
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

    languages = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

    # Media fields
    cover_image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    gallery = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

    # Readable helpers
    city_name = serializers.CharField(source='city.name', read_only=True)
    country_name = serializers.CharField(source='city.country.name', read_only=True)

    class Meta:
        model = InstructorProfile
        fields = "__all__"
        read_only_fields = ("id", "user")


    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user

        city = validated_data.pop("city", None)
        sports = validated_data.pop("sports", [])

        instructor, _ = InstructorProfile.objects.update_or_create(
            user=user,
            defaults={**validated_data, "city": city}
        )

        if sports:
            instructor.sports.set(sports)

        return instructor

    def update(self, instance, validated_data):
        sports = validated_data.pop("sports", None)
        city = validated_data.pop("city", None)

        if city is not None:
            instance.city = city

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if sports is not None:
            instance.sports.set(sports)

        instance.save()
        return instance


class InstructorDocumentsSerializer(serializers.ModelSerializer):
    """
    Used ONLY to submit / update instructor verification documents.
    Triggers compliance workflow.
    """

    class Meta:
        model = InstructorProfile
        fields = ("legal_documents",)

    def update(self, instance, validated_data):
        user = instance.user

        instance.legal_documents = validated_data.get(
            "legal_documents", instance.legal_documents
        )
        instance.verification_status = "PENDING"
        instance.save(update_fields=["legal_documents", "verification_status"])

        # Mark user as documents submitted
        if user:
            user.is_documents_submitted = True
            user.is_approved = False
            user.save(update_fields=["is_documents_submitted", "is_approved"])

        return instance


# Admin-only serializer for finance & admin dashboard
class AdminInstructorSerializer(serializers.ModelSerializer):
    """
    Admin-only serializer.
    Exposes commission data for finance & admin dashboard.
    """
    commission = serializers.SerializerMethodField()

    class Meta:
        model = InstructorProfile
        fields = (
            "id",
            "display_name",
            "commission",
        )

    def get_commission(self, obj):
        merchant = getattr(obj, "merchant", None)
        if merchant and merchant.commission_rate is not None:
            return merchant.commission_rate

        provider = getattr(obj, "provider", None)
        if provider and getattr(provider, "merchant", None):
            return provider.merchant.commission_rate

        return None