import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ttw_backend.settings')
django.setup()

from apps.users.models import User
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile
from apps.locations.models import City, Country, Continent
from apps.listings.models import Listing, Sport

def run():
    print("🌱 Seeding Data...")

    # 1. Create Users
    traveler, _ = User.objects.get_or_create(email="traveler@ttw.com", defaults={'role': 'USER'})
    traveler.set_password("password123")
    traveler.save()

    school_user, _ = User.objects.get_or_create(email="school@ttw.com", defaults={'role': 'PROVIDER'})
    school_user.set_password("password123")
    school_user.save()
    
    instructor_user, _ = User.objects.get_or_create(email="sarah@ttw.com", defaults={'role': 'INSTRUCTOR'})
    instructor_user.set_password("password123")
    instructor_user.save()
    
    admin_user, _ = User.objects.get_or_create(email="admin@ttw.com", defaults={'role': 'ADMIN', 'is_staff': True, 'is_superuser': True})
    admin_user.set_password("password123")
    admin_user.save()

    # 2. Create Geo Data
    continent, _ = Continent.objects.get_or_create(name="Europe", slug="europe")
    country, _ = Country.objects.get_or_create(name="Spain", slug="spain", continent=continent)
    city, _ = City.objects.get_or_create(name="Tarifa", slug="tarifa", country=country)

    # 3. Create Profiles
    school_profile, _ = ProviderProfile.objects.get_or_create(
        user=school_user,
        defaults={
            "company_name": "Tarifa Kite Center",
            "verification_status": "APPROVED",
            "city": city,
            "description": "Best school in Tarifa since 2010!",
            "logo": "https://api.dicebear.com/7.x/initials/svg?seed=TKS"
        }
    )
    
    instructor_profile, _ = InstructorProfile.objects.get_or_create(
        user=instructor_user,
        defaults={
            "bio": "Certified IKO Instructor with 10 years exp.",
            "city": city,
            "hourly_rate": 80.00,
            "is_verified": True,
            "profile_image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
        }
    )

    # 4. Create Sports
    sport, _ = Sport.objects.get_or_create(
        slug="kitesurf", 
        defaults={"name": "Kitesurf", "category": "WATER"}
    )

    # 5. Create Listings
    # FIX: Using 'owner' (The User) instead of 'provider' (The Profile)
    Listing.objects.get_or_create(
        title="Beginner Kitesurf Course (3 Days)",
        owner=school_user, 
        defaults={
            "type": "ACTIVITY",
            "sport": sport,
            "city": city,
            "price": 350.00,
            "currency": "EUR",
            "images": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
            "description": "Complete beginner course. From zero to hero.",
            "details": {"duration": "3 Days", "difficulty": "Beginner"},
            "status": "ACTIVE"
        }
    )
    
    Listing.objects.get_or_create(
        title="Private Coaching with Sarah",
        owner=instructor_user, 
        defaults={
            "type": "ACTIVITY",
            "sport": sport,
            "city": city,
            "price": 100.00,
            "currency": "EUR",
            "images": ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97"],
            "description": "Advanced tricks and strapless riding.",
            "details": {"duration": "1h", "difficulty": "Advanced"},
            "status": "ACTIVE"
        }
    )
    
    print("✅ Data Seeded Successfully!")

if __name__ == '__main__':
    run()