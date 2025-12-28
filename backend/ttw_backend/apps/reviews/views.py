# reviews/views.py
from rest_framework import viewsets, permissions
from django.db.models import Avg, Count
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer, CreateReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = (
            Review.objects
            .filter(is_visible=True)
            .select_related("reviewer", "provider", "instructor", "listing")
        )

        provider_id = self.request.query_params.get("provider")
        instructor_id = self.request.query_params.get("instructor")
        listing_id = self.request.query_params.get("listing")

        targets = [provider_id, instructor_id, listing_id]

        # Enforce exactly ONE target in read context
        if sum(t is not None for t in targets) != 1:
            return queryset.none()

        if provider_id:
            return queryset.filter(provider_id=provider_id)

        if instructor_id:
            return queryset.filter(instructor_id=instructor_id)

        if listing_id:
            return queryset.filter(listing_id=listing_id)

    def get_serializer_class(self):
        if self.action == "create":
            return CreateReviewSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)