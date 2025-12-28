from rest_framework import serializers
from .models import Session, Attendee
from apps.bookings.models import Booking


# ============================
#       ATTENDEE SERIALIZERS
# ============================

class AttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendee
        fields = [
            "id",
            "session",
            "name",
            "age",
            "level",
            "source",
            "waiver",
            "notes",
        ]


class AttendeeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendee
        fields = ["name", "age", "level", "waiver", "notes"]
        extra_kwargs = {field: {"required": False} for field in fields}


# ============================
#       BOOKING SERIALIZER
# ============================

class BookingMiniSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "guests",
            "status",
            "start_date",
        ]

    def get_user(self, obj):
        return obj.user.email if obj.user else None


# ============================
#       SESSION SERIALIZERS
# ============================

class SessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            "date",
            "time",
            "duration",
            "title",
            "instructor",
            "max",
        ]


class SessionUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["date", "time", "duration", "title", "instructor", "max"]
        extra_kwargs = {field: {"required": False} for field in fields}


class SessionOutSerializer(serializers.ModelSerializer):
    attendees = AttendeeSerializer(many=True)
    bookings = BookingMiniSerializer(many=True, read_only=True)

    provider = serializers.SerializerMethodField()

    students = serializers.SerializerMethodField()
    pendingWaivers = serializers.SerializerMethodField()
    sources = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "id",
            "provider",
            "date",
            "time",
            "duration",
            "title",
            "instructor",
            "max",
            "attendees",
            "bookings",
            "students",
            "pendingWaivers",
            "sources",
            "color",
        ]

    # ===== FRONTEND CALCULATED FIELDS =====

    def get_students(self, obj):
        return obj.attendees.count()

    def get_pendingWaivers(self, obj):
        return obj.attendees.filter(waiver=False).count()

    def get_sources(self, obj):
        attendees = obj.attendees.all()
        return {
            "ttw": attendees.filter(source="TTW").count(),
            "direct": attendees.filter(source__in=["DIRECT", "Walk-in"]).count(),
        }

    def get_color(self, obj):
        # You can customize this later if you want dynamic colors.
        return "bg-blue-100 border-blue-200 text-blue-800"

    def get_provider(self, obj):
        return obj.provider.id if obj.provider else None
