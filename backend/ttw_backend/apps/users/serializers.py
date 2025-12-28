from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

# User base serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # FIX: Added 'cover_image', 'first_name', 'last_name' so they can be edited
        fields = (
            "id", "email", "first_name", "last_name", 
            "role", "avatar", "cover_image", "bio", "phone"
        )


# Register serializer
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)
    premium_intent_id = serializers.UUIDField(required=False, write_only=True)

    # Role is OPTIONAL: defaults to USER
    role = serializers.ChoiceField(
        choices=User.Roles.choices,
        required=False
    )

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name", "role", "premium_intent_id")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    def validate_role(self, value):
        # Explicitly allow only known roles
        if value not in [
            User.Roles.USER,
            User.Roles.INSTRUCTOR,
            User.Roles.PROVIDER,
        ]:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        from apps.payments.models import PremiumSignupIntent
        from django.utils import timezone

        password = validated_data.pop("password")
        premium_intent_id = validated_data.pop("premium_intent_id", None)

        validated_data.setdefault("role", User.Roles.USER)
        # Initial onboarding state
        validated_data["is_profile_complete"] = False
        validated_data["is_documents_submitted"] = False
        validated_data["is_approved"] = False

        premium_intent = None

        # --- OPTIONAL PREMIUM VALIDATION ---
        if premium_intent_id:
            try:
                premium_intent = PremiumSignupIntent.objects.select_for_update().get(
                    id=premium_intent_id,
                    status=PremiumSignupIntent.Status.PAID,
                )
            except PremiumSignupIntent.DoesNotExist:
                raise serializers.ValidationError({
                    "premium_intent_id": "Invalid or already used premium intent"
                })

            if premium_intent.email.lower() != validated_data.get("email").lower():
                raise serializers.ValidationError({
                    "premium_intent_id": "Premium intent email does not match"
                })

        # --- CREATE USER ---
        user = User(**validated_data)
        user.set_password(password)

        # Basic profile is complete at signup (name + email)
        user.is_profile_complete = True

        if premium_intent:
            user.is_premium_partner = True

        user.save()

        # Providers / instructors require documents and approval
        if user.role in [User.Roles.PROVIDER, User.Roles.INSTRUCTOR]:
            user.is_verified = False
            user.is_documents_submitted = False
            user.is_approved = False
            user.save(update_fields=[
                "is_verified",
                "is_documents_submitted",
                "is_approved",
                "is_profile_complete",
            ])

        # --- CONSUME PREMIUM INTENT ---
        if premium_intent:
            premium_intent.status = PremiumSignupIntent.Status.CONSUMED
            premium_intent.consumed_at = timezone.now()
            premium_intent.save(update_fields=["status", "consumed_at"])

        return user


# Login serializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        # Authenticate using email as username
        user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")

        data["user"] = user
        return data
