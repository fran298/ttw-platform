from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.models import User
from .models import InstructorProfile
from apps.providers.models import MerchantProfile


@receiver(post_save, sender=User)
def create_instructor_profile(sender, instance, created, **kwargs):
    """
    Ensure an InstructorProfile exists when a User with role=INSTRUCTOR is created.
    """
    if created and instance.role == User.Roles.INSTRUCTOR:
        InstructorProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=InstructorProfile)
def create_instructor_merchant(sender, instance, created, **kwargs):
    """
    Automatically assign a MerchantProfile when an InstructorProfile is created.
    """
    if created and instance.merchant is None:
        merchant = MerchantProfile.objects.create(
            user=instance.user,
            type=MerchantProfile.MerchantType.INSTRUCTOR,
        )
        instance.merchant = merchant
        instance.save()