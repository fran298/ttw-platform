from django.db import models
from django.utils.text import slugify


class Destination(models.Model):
    """
    Canonical destination representing a unique city.
    Used as the source of truth for destination pages, cards and SEO.
    """

    name = models.CharField(
        max_length=255,
        help_text="Canonical city name (e.g. San Carlos de Bariloche)"
    )

    slug = models.SlugField(
        max_length=255,
        unique=True,
        help_text="Unique slug generated from name (used in URLs)"
    )

    country = models.CharField(
        max_length=100,
        help_text="Country name (e.g. Argentina)"
    )

    continent = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Continent (e.g. South America)"
    )

    hero_image = models.URLField(
        blank=True,
        help_text="Cloudinary URL for destination hero image"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Controls visibility of the destination in the frontend"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Destination"
        verbose_name_plural = "Destinations"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}, {self.country}"
