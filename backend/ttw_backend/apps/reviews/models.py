# apps/reviews/models.py
from django.db import models
from django.db.models import Q
from django.conf import settings
import uuid


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_written"
    )

    # TARGETS REALES
    provider = models.ForeignKey(
        "providers.ProviderProfile",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    instructor = models.ForeignKey(
        "instructors.InstructorProfile",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    listing = models.ForeignKey(
        "listings.Listing",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    rating = models.IntegerField()
    comment = models.TextField()

    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # One review per user per provider
            models.UniqueConstraint(
                fields=["reviewer", "provider"],
                condition=Q(provider__isnull=False),
                name="unique_review_per_user_per_provider",
            ),
            # One review per user per instructor
            models.UniqueConstraint(
                fields=["reviewer", "instructor"],
                condition=Q(instructor__isnull=False),
                name="unique_review_per_user_per_instructor",
            ),
            # One review per user per listing
            models.UniqueConstraint(
                fields=["reviewer", "listing"],
                condition=Q(listing__isnull=False),
                name="unique_review_per_user_per_listing",
            ),
        ]

    def clean(self):
        targets = [
            self.provider,
            self.instructor,
            self.listing,
        ]
        if sum(t is not None for t in targets) != 1:
            raise ValueError(
                "Review must have exactly one target: provider, instructor or listing"
            )

    def __str__(self):
        return f"{self.rating}★ by {self.reviewer.email}"