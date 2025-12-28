from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.providers.models import ProviderProfile, MerchantProfile
from apps.instructors.models import InstructorProfile

# 1. Custom Manager (Essential for Email-only Auth)
class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


# 2. User Model
class User(AbstractUser):
    # Remove username field
    username = None

    # Use UUID for ID (Production Standard)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)

    class Roles(models.TextChoices):
        USER = 'USER', 'Traveler'
        PROVIDER = 'PROVIDER', 'School/Company'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor' # Freelancer
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.USER
    )

    is_premium = models.BooleanField(default=False)

    # --- PROFILE IMAGES ---
    avatar = models.URLField(blank=True, null=True)
    cover_image = models.URLField(blank=True, null=True) # <--- ADDED THIS FIELD
    
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Email Verification
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    # Onboarding / compliance
    is_profile_complete = models.BooleanField(
        default=False,
        help_text="Whether required onboarding fields are completed"
    )

    is_documents_submitted = models.BooleanField(
        default=False,
        help_text="Whether required legal documents were uploaded"
    )

    is_approved = models.BooleanField(
        default=False,
        help_text="Approved by ops / partners after document review"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Configuration
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email & Password are required by default

    # Link the Manager
    objects = CustomUserManager()

    def generate_verification_code(self):
        import random
        code = str(random.randint(100000, 999999))
        self.verification_code = code
        self.is_verified = False
        self.save(update_fields=["verification_code", "is_verified"])
        return code

    def get_commission_rate(self):
        return 15.0 if self.is_premium else 25.0

    def can_operate(self) -> bool:
        """
        Can accept bookings / appear publicly.
        """
        if self.role in [User.Roles.PROVIDER, User.Roles.INSTRUCTOR]:
            return self.is_verified and self.is_documents_submitted and self.is_approved
        return True

    def requires_documents(self) -> bool:
        return self.role in [User.Roles.PROVIDER, User.Roles.INSTRUCTOR]

    def __str__(self):
        return f"{self.email} ({self.role})"


@receiver(post_save, sender=User)
def auto_create_provider_profile(sender, instance, created, **kwargs):
    """
    Automatically create a ProviderProfile when a user registers with role PROVIDER.
    """
    if created and instance.role == User.Roles.PROVIDER:
        ProviderProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def auto_create_instructor_profile(sender, instance, created, **kwargs):
    """
    Automatically create an InstructorProfile when a user registers with role INSTRUCTOR.
    """
    if created and instance.role == User.Roles.INSTRUCTOR:
        InstructorProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def auto_create_merchant_profile(sender, instance, created, **kwargs):
    """
    Create MerchantProfile ONLY when a PROVIDER or INSTRUCTOR user is created.
    NEVER for normal users and NEVER on updates.
    """
    if not created:
        return

    if instance.role not in [User.Roles.PROVIDER, User.Roles.INSTRUCTOR]:
        return

    MerchantProfile.objects.get_or_create(
        user=instance,
        defaults={
            "type": instance.role,
            "commission_rate": 15.0 if instance.is_premium else 25.0,
        }
    )