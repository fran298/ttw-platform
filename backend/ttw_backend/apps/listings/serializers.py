from rest_framework import serializers
from .models import (
    Listing, Sport,
    SpotAccessType, AccommodationStyle,
    MediaPackage, SpectatorPolicy, ChickenOutPolicy, GearCondition,
    TripCategory, RiskLevel 
)
from apps.locations.serializers import CitySerializer 

class SportSerializer(serializers.ModelSerializer):
    listing_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Sport
        fields = '__all__'

class ListingSerializer(serializers.ModelSerializer):
    images = serializers.JSONField()
    city = CitySerializer(read_only=True)
    merchant = serializers.SerializerMethodField()
    host = serializers.SerializerMethodField()
    sport_name = serializers.CharField(source='sport.name', read_only=True)
    
    # We keep trip_meta for convenience, enables the frontend to access specific trip data easily
    trip_meta = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'slug', 'type', 'description',
            'price', 'currency', 'rating', 'review_count', 'is_verified',
            'images', 'sport', 'sport_name',
            'city',     
            'merchant',
            'host',
            'details', 'status', 
            'universal_level', 'technical_grade', 'physical_intensity',
            'trip_meta'
        ]

    def get_merchant(self, obj):
        merchant = getattr(obj, "merchant", None)
        if merchant is None:
            return None
        return {
            "id": str(merchant.id),
            "name": merchant.legal_name or merchant.user.email,
            "logo": merchant.logo.url if merchant.logo else None,
            "type": merchant.type 
        }

    def get_host(self, obj):
        """
        Canonical, public, navigable host for a Listing.
        Merchant is internal. Provider / Instructor are public.
        """

        merchant = getattr(obj, "merchant", None)
        if not merchant:
            return None

        # ===== SCHOOL / PROVIDER =====
        provider = getattr(merchant, "provider", None)
        if provider:
            return {
                "id": str(provider.id),
                "type": "SCHOOL",
                "name": provider.company_name,
                "profile_image": provider.profile_image,
                "verified": provider.verification_status == "APPROVED",
                "url": f"/providers/{provider.id}",
            }

        # ===== INSTRUCTOR =====
        instructor = getattr(merchant, "instructor", None)
        if instructor:
            return {
                "id": str(instructor.id),
                "type": "INSTRUCTOR",
                "name": instructor.display_name or instructor.user.email,
                "profile_image": instructor.profile_image,
                "verified": instructor.is_verified,
                "url": f"/instructors/{instructor.id}",
            }

        return None

    def get_trip_meta(self, obj):
        """
        Normalized read-only trip metadata.
        This ensures the Frontend always gets an object, even if DB is empty.
        """
        details = obj.details or {}

        # Safe extraction helper
        def get_nested(parent, key):
            return details.get(parent, {}).get(key)

        return {
            "tripCategory": details.get("tripCategory"),
            "riskLevel": details.get("riskLevel"),
            
            # Direct Access to these is useful for the Trip Cards
            "tempMin": get_nested("expectedConditions", "tempMin"),
            "tempMax": get_nested("expectedConditions", "tempMax"),
            "altitudeMax": get_nested("expectedConditions", "altitudeMax"),
            
            "hoursPerDay": get_nested("physicalEffort", "hoursPerDay"),
            "backpackWeight": get_nested("physicalEffort", "backpackWeight"),
            "consecutiveDays": get_nested("physicalEffort", "consecutiveDays"),
            
            "mandatoryEquipment": details.get("mandatoryEquipment"),
            "tripRouteType": details.get("tripRouteType"),
        }

class ListingCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Listing
        fields = [
            'id', 'title', 'description', 'type', 'sport',
            'city',
            'price', 'currency', 'universal_level', 'technical_grade', 'physical_intensity',
            'images', 'details', 'status'
        ]

    def validate_sport(self, sport):
        request = self.context.get("request")
        # Ensure your permission logic here is robust
        return sport

    def validate_details(self, details):
        """
        EXPERT VALIDATION: 
        Ensures nested objects are strictly formatted so the Landing Page never crashes.
        """
        listing_type = self.initial_data.get("type")

        if not isinstance(details, dict):
            raise serializers.ValidationError("Details must be a JSON object.")

        # 1. GLOBAL FIELDS
        cleaned = {}
        global_keys = [
            "languages", "meetingPoint", "googleMapsLink",
            "accessType", "mustKnowSwimming", "badWeatherAlternative",
            "seasonMonths", "weeklySchedule" # Needed for sessions even if switched later
        ]
        for k in global_keys:
            if k in details:
                cleaned[k] = details[k]

        # 2. TYPE SPECIFIC LOGIC
        
        # --- TRIP ONLY (The Critical Update) ---
        if listing_type == Listing.ListingType.TRIP:
            trip_keys = [
                "startDate", "endDate", "startLocation", "endLocation",
                "minGuests", "maxGuests", "staffRatio",
                "itinerary", "accommodationStyle", "foodPolicy",
                "transportIncluded", "gearProvided", "gearRequired",
                "skillPrerequisites",
                "tripCategory", "riskLevel",
                "mandatoryEquipment", "recommendedEquipment",
                "participationPolicyExtra",
                "tripRouteType", "tripBases", "tripMovementNote",
            ]
            
            # Copy flat keys
            for k in trip_keys:
                if k in details:
                    cleaned[k] = details[k]

            # --- CRITICAL FIX: Validate Nested Objects ---
            # Explicitly reconstruct these to ensure they exist in the DB JSON
            
            # Validate Expected Conditions
            raw_cond = details.get("expectedConditions", {})
            # If it comes in as a dict, save its fields safely
            if isinstance(raw_cond, dict):
                cleaned["expectedConditions"] = {
                    "tempMin": raw_cond.get("tempMin"),
                    "tempMax": raw_cond.get("tempMax"),
                    "altitudeMax": raw_cond.get("altitudeMax"),
                    "note": raw_cond.get("note", "")
                }
            else:
                # Ensure structure exists even if empty
                cleaned["expectedConditions"] = {"tempMin": None, "tempMax": None, "altitudeMax": None, "note": ""}

            # Validate Physical Effort
            raw_effort = details.get("physicalEffort", {})
            if isinstance(raw_effort, dict):
                cleaned["physicalEffort"] = {
                    "hoursPerDay": raw_effort.get("hoursPerDay"),
                    "backpackWeight": raw_effort.get("backpackWeight"),
                    "consecutiveDays": raw_effort.get("consecutiveDays"),
                    "note": raw_effort.get("note", "")
                }
            else:
                cleaned["physicalEffort"] = {"hoursPerDay": None, "backpackWeight": None, "consecutiveDays": None, "note": ""}

        # --- OTHER TYPES (Session, Experience, Rent, Course) ---
        elif listing_type in [Listing.ListingType.SESSION, Listing.ListingType.EXPERIENCE]:
            session_keys = [
                "durationHours", "schedulingType", "timeRangeStart", "timeRangeEnd",
                "isPrivate", "maxGroupSize", "gearIncluded", 
                "minAge", "maxWeight", "techRadio", "techVideo", "techDrone", "techBoat"
            ]
            for k in session_keys:
                if k in details: cleaned[k] = details[k]

            if listing_type == Listing.ListingType.EXPERIENCE:
                exp_keys = [
                    "experienceAltitude", "experienceDepth", 
                    "totalDurationLabel", "actionDurationLabel",
                    "mediaPackage", "mediaDelivery",
                    "spectatorPolicy", "spectatorViewAvailable",
                    "arrivalBufferMinutes", "zeroAlcoholPolicy", "noFlyAfterDive",
                    "excludePregnancy", "excludeEpilepsy", "excludeHeartConditions",
                    "chickenOutPolicy"
                ]
                for k in exp_keys:
                    if k in details: cleaned[k] = details[k]

        elif listing_type == Listing.ListingType.COURSE:
            course_keys = ["scope", "totalDays", "dailyHours", "gearIncluded", "certificationName", "techRadio", "techVideo", "techDrone", "techBoat"]
            for k in course_keys:
                if k in details: cleaned[k] = details[k]

        elif listing_type == Listing.ListingType.RENT:
            rent_keys = ["category", "billingPeriod", "depositAmount", "sizes", "brand", "modelYear", "condition", "rescueIncluded", "damageWaiver", "componentsIncluded"]
            for k in rent_keys:
                if k in details: cleaned[k] = details[k]

        return cleaned

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["owner"] = request.user
        return super().create(validated_data)