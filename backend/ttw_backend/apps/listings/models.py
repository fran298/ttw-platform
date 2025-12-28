from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from apps.locations.models import City
import uuid

# --- 1. GLOBAL & LOGISTICS ENUMS ---
class SpotAccessType(models.TextChoices):
    EASY = 'EASY', 'Easy (Car / Walk)'
    HIKE = 'HIKE', 'Hike Required'
    FOUR_BY_FOUR = '4x4', '4x4 Vehicle Required'
    BOAT_ONLY = 'BOAT_ONLY', 'Boat Access Only'


class AccommodationStyle(models.TextChoices):
    HOTEL = 'HOTEL', 'Hotel'
    HOSTEL = 'HOSTEL', 'Hostel'
    BOAT = 'BOAT', 'Boat / Liveaboard'
    CAMPING = 'CAMPING', 'Camping'
    HUT = 'HUT', 'Mountain Hut'
    NONE = 'NONE', 'None'


class FoodPolicy(models.TextChoices):
    ALL_INCLUSIVE = 'ALL_INCLUSIVE', 'All Inclusive'
    FULL_BOARD = 'FULL_BOARD', 'Full Board'
    HALF_BOARD = 'HALF_BOARD', 'Half Board'
    BREAKFAST = 'BREAKFAST', 'Breakfast Only'
    SELF_CATERING = 'SELF_CATERING', 'Self Catering'


class TripCategory(models.TextChoices):
    ADVENTURE = 'ADVENTURE', 'Adventure'
    EXPEDITION = 'EXPEDITION', 'Expedition'
    LUXURY = 'LUXURY', 'Luxury'
    TECHNICAL = 'TECHNICAL', 'Technical'


class RiskLevel(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    EXTREME = 'EXTREME', 'Extreme'


# --- 2. EXPERIENCE ENUMS ---
class MediaPackage(models.TextChoices):
    NONE = 'NONE', 'Not Available'
    INCLUDED = 'INCLUDED', 'Included in Price'
    HANDCAM_EXTRA = 'HANDCAM_EXTRA', 'Handcam (Extra Cost)'
    OUTSIDE_CAM_EXTRA = 'OUTSIDE_CAM_EXTRA', 'Outside Cameraman (Extra Cost)'


class SpectatorPolicy(models.TextChoices):
    FREE = 'FREE', 'Allowed (Free)'
    PAID = 'PAID', 'Allowed (Extra Cost)'
    NOT_ALLOWED = 'NOT_ALLOWED', 'Not Allowed'


class ChickenOutPolicy(models.TextChoices):
    NO_REFUND = 'NO_REFUND', 'No Refund'
    PARTIAL_REFUND = 'PARTIAL_REFUND', 'Partial Refund'
    FULL_REFUND = 'FULL_REFUND', 'Full Refund'


# --- 3. RENTAL ENUMS ---
class GearCondition(models.TextChoices):
    NEW = 'NEW', 'New (Unused)'
    EXCELLENT = 'EXCELLENT', 'Excellent'
    FAIR = 'FAIR', 'Fair / Used'


class Sport(models.Model):
    slug = models.SlugField(primary_key=True, blank=True)
    name = models.CharField(max_length=50)
    category = models.CharField(
        max_length=20,
        choices=[('WATER','Water'), ('LAND','Land'), ('SNOW','Snow'), ('AIR','Air')],
        default='WATER'
    )
    image = models.URLField(blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Listing(models.Model):

    class ListingType(models.TextChoices):
        SESSION = "SESSION", "Session"
        COURSE = "COURSE", "Course"
        EXPERIENCE = "EXPERIENCE", "Experience"
        RENT = "RENT", "Rent"
        TRIP = "TRIP", "Trip"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    merchant = models.ForeignKey(
        'providers.MerchantProfile',
        on_delete=models.CASCADE,
        related_name='listings',
        null=True,
        blank=True
    )
    owner = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='listings')

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255, blank=True)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=ListingType.choices)

    sport = models.ForeignKey(Sport, on_delete=models.PROTECT, related_name='listings')
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name='listings', null=True, blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=5, default="EUR")
    universal_level = models.CharField(max_length=50)
    technical_grade = models.CharField(max_length=50, blank=True)
    physical_intensity = models.IntegerField(default=1)

    images = models.JSONField(default=list)

    # 🔥 MASTER CONTRACT — ALIGNED WITH REACT 🔥
    details = models.JSONField(default=dict, blank=True)
    """
    GLOBAL:
    - languages: [string]
    - meetingPoint: string
    - googleMapsLink: string
    - accessType: EASY | HIKE | 4x4 | BOAT_ONLY
    - mustKnowSwimming: bool
    - badWeatherAlternative: string
    - seasonMonths: number[]

    EXPERIENCE:
    - experienceAltitude: string
    - experienceDepth: string
    - totalDurationLabel: string
    - actionDurationLabel: string
    - mediaPackage: NONE | INCLUDED | HANDCAM_EXTRA | OUTSIDE_CAM_EXTRA
    - mediaDelivery: string
    - spectatorPolicy: FREE | PAID | NOT_ALLOWED
    - spectatorViewAvailable: bool
    - arrivalBufferMinutes: number
    - zeroAlcoholPolicy: bool
    - noFlyAfterDive: bool
    - excludePregnancy: bool
    - excludeEpilepsy: bool
    - excludeHeartConditions: bool
    - chickenOutPolicy: NO_REFUND | PARTIAL_REFUND | FULL_REFUND

    TRIP:
    - tripCategory: ADVENTURE | EXPEDITION | LUXURY | TECHNICAL
    - riskLevel: LOW | MEDIUM | HIGH | EXTREME
    - mandatoryEquipment: string
    - recommendedEquipment: string
    - expectedConditions:
        - tempMin: number
        - tempMax: number
        - altitudeMax: number
        - note: string
    - physicalEffort:
        - hoursPerDay: number
        - backpackWeight: number
        - consecutiveDays: number
        - note: string
    - participationPolicyExtra: string
    """

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    review_count = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            city_part = self.city.name if self.city else "activity"
            base_slug = slugify(f"{self.title}-{city_part}")
            self.slug = f"{base_slug}-{str(uuid.uuid4())[:6]}"

        if not self.merchant:
            provider = getattr(self.owner, "provider_profile", None)
            instructor = getattr(self.owner, "instructor_profile", None)
            merchant_profile = getattr(self.owner, "merchant_profile", None)

            if provider and getattr(provider, "merchant", None):
                self.merchant = provider.merchant
            elif instructor and getattr(instructor, "merchant", None):
                self.merchant = instructor.merchant
            elif merchant_profile:
                self.merchant = merchant_profile

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.type})"