from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Destination
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile
from apps.listings.models import Listing


def ensure_destination_for_city(city_name: str, country: str | None = None):
    """
    Ensure a Destination exists for a given city.
    Creates it if missing. Uses slug as unique key.
    """
    if not city_name:
        return

    slug = slugify(city_name)

    destination, created = Destination.objects.get_or_create(
        slug=slug,
        defaults={
            "name": city_name,
            "country": country or "",
            "is_active": True,
        },
    )

    return destination


@receiver(post_save, sender=ProviderProfile)
def create_destination_from_provider(sender, instance, **kwargs):
    city = getattr(instance.city, "name", None) if instance.city else None
    country = getattr(instance.city.country, "name", None) if instance.city and instance.city.country else None

    ensure_destination_for_city(city, country)


@receiver(post_save, sender=InstructorProfile)
def create_destination_from_instructor(sender, instance, **kwargs):
    city = getattr(instance.city, "name", None) if hasattr(instance, "city") and instance.city else None
    country = getattr(instance.city.country, "name", None) if hasattr(instance, "city") and instance.city and instance.city.country else None

    ensure_destination_for_city(city, country)


@receiver(post_save, sender=Listing)
def create_destination_from_listing(sender, instance, **kwargs):
    # Listing no longer has `location`; city is the single source of truth
    if not instance.city:
        return

    city_name = instance.city.name
    country_name = instance.city.country.name if instance.city.country else None

    ensure_destination_for_city(city_name, country_name)
