# reviews/serializers.py
from rest_framework import serializers
from .models import Review
from apps.users.models import User


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    reviewer_email = serializers.EmailField(
        source="reviewer.email", read_only=True
    )

    class Meta:
        model = Review
        fields = [
            "id",
            "reviewer_name",
            "reviewer_email",
            "rating",
            "comment",
            "created_at",
        ]

    def get_reviewer_name(self, obj):
        user = obj.reviewer
        return (
            getattr(user, "display_name", None)
            or getattr(user, "full_name", None)
            or user.email
        )


class CreateReviewSerializer(serializers.ModelSerializer):
    provider = serializers.PrimaryKeyRelatedField(
        queryset=Review._meta.get_field("provider").remote_field.model.objects.all(),
        required=False,
        allow_null=True,
    )
    instructor = serializers.PrimaryKeyRelatedField(
        queryset=Review._meta.get_field("instructor").remote_field.model.objects.all(),
        required=False,
        allow_null=True,
    )
    listing = serializers.PrimaryKeyRelatedField(
        queryset=Review._meta.get_field("listing").remote_field.model.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Review
        fields = [
            "provider",
            "instructor",
            "listing",
            "rating",
            "comment",
        ]

    def validate(self, data):
        user = self.context["request"].user

        # Only travelers can create reviews
        if user.role != User.Roles.USER:
            raise serializers.ValidationError(
                "Only travelers can leave reviews."
            )

        targets = [
            data.get("provider"),
            data.get("instructor"),
            data.get("listing"),
        ]

        if sum(t is not None for t in targets) != 1:
            raise serializers.ValidationError(
                "You must provide exactly one target: provider, instructor or listing."
            )

        from .models import Review

        provider = data.get("provider")
        instructor = data.get("instructor")
        listing = data.get("listing")

        if provider and Review.objects.filter(reviewer=user, provider=provider).exists():
            raise serializers.ValidationError(
                "You have already reviewed this provider."
            )

        if instructor and Review.objects.filter(reviewer=user, instructor=instructor).exists():
            raise serializers.ValidationError(
                "You have already reviewed this instructor."
            )

        if listing and Review.objects.filter(reviewer=user, listing=listing).exists():
            raise serializers.ValidationError(
                "You have already reviewed this listing."
            )

        return data