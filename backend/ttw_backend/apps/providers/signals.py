from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.providers.models import ProviderProfile, MerchantProfile
from apps.instructors.models import InstructorProfile


@receiver(post_save, sender=ProviderProfile)
def create_provider_merchant(sender, instance, created, **kwargs):
    """
    Automatically create a MerchantProfile for a Provider when the ProviderProfile is created.
    """
    if created and instance.merchant is None:
        merchant = MerchantProfile.objects.create(
            user=instance.user,
            type=MerchantProfile.MerchantType.PROVIDER,
        )
        instance.merchant = merchant
        instance.save()


@receiver(post_save, sender=InstructorProfile)
def create_instructor_merchant(sender, instance, created, **kwargs):
    """
    Automatically create a MerchantProfile for an Instructor when the InstructorProfile is created.
    """
    if created and instance.merchant is None:
        merchant = MerchantProfile.objects.create(
            user=instance.user,
            type=MerchantProfile.MerchantType.INSTRUCTOR,
        )
        instance.merchant = merchant
        instance.save()
