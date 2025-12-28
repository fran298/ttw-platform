from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, time
from apps.providers.models import ProviderProfile
from apps.bookings.models import Booking
from django.db.models import Prefetch

from .models import Session, Attendee
from .serializers import (
    SessionCreateSerializer,
    SessionUpdateSerializer,
    SessionOutSerializer,
    AttendeeSerializer,
    AttendeeUpdateSerializer,
)


# ============================================================
#   GET SESSIONS FOR PROVIDER ON SPECIFIC DATE
#   /provider/<provider_id>/sessions?date=YYYY-MM-DD
# ============================================================

class ProviderSessionsView(APIView):
    def get(self, request, provider_id):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"error": "Missing ?date=YYYY-MM-DD"}, status=400)

        try:
            day = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

        # 1) Fetch provider-created sessions
        sessions = list(
            Session.objects.filter(provider__id=provider_id, date=day)
            .select_related("provider")
            .prefetch_related("attendees")
            .order_by("time")
        )

        # Build a lookup table by time for matching bookings
        session_by_time = {s.time: s for s in sessions}

        # 2) Fetch bookings for that provider and date
        bookings = Booking.objects.filter(
            listing__merchant__provider__id=provider_id,
            start_date=day,
            status=Booking.Status.CONFIRMED
        ).select_related("user", "listing", "listing__sport")

        # 3) Convert bookings → attendees or auto-generate sessions
        for booking in bookings:
            # Extract or default time (HH:MM)
            # If listing has no explicit time, default to 09:00
            time_str = "09:00"
            if hasattr(booking.listing, "start_time") and booking.listing.start_time:
                time_str = booking.listing.start_time.strftime("%H:%M")

            # Find or create session for that booking
            session = session_by_time.get(time_str)
            if not session:
                session = Session.objects.create(
                    provider_id=provider_id,
                    date=day,
                    time=time_str,
                    title=booking.listing_snapshot.get("title", "Booking Session"),
                    instructor=booking.listing_snapshot.get("provider_name", ""),
                    max=booking.guests,
                    auto_generated=True,
                )
                session_by_time[time_str] = session
                sessions.append(session)

            # Ensure attendees exist (avoid duplicates)
            if not Attendee.objects.filter(session=session, name=booking.user.email).exists():
                Attendee.objects.create(
                    session=session,
                    name=booking.user.email,
                    age=0,
                    level="Unknown",
                    source="TTW",
                    waiver=False,
                    notes="Imported from booking",
                )

        # 4) Refresh sessions with updated attendees
        sessions = (
            Session.objects.filter(provider__id=provider_id, date=day)
            .select_related("provider")
            .prefetch_related("attendees")
            .order_by("time")
        )

        serializer = SessionOutSerializer(sessions, many=True)
        return Response(serializer.data)


# ============================================================
#   GET WEEKLY CALENDAR (PROFESSIONAL VERSION)
#   /provider/<provider_id>/week?date=YYYY-MM-DD
# ============================================================

from datetime import timedelta

class ProviderWeeklyCalendarView(APIView):
    """
    Returns all sessions (manual + auto-generated) for a provider
    for the week containing the given date. Also ensures bookings
    are attached to sessions and converted into attendees when needed.
    """

    def get(self, request, provider_id):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"error": "Missing ?date=YYYY-MM-DD"}, status=400)

        try:
            selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

        # Compute Monday start (week_start) and Sunday end (week_end)
        week_start = selected_date - timedelta(days=selected_date.weekday())
        week_end = week_start + timedelta(days=6)

        # 1) Load existing sessions for that provider in the week
        sessions_qs = (
            Session.objects.filter(
                provider__id=provider_id,
                date__range=[week_start, week_end],
            )
            .select_related("provider")
            .prefetch_related("attendees", "bookings")
            .order_by("date", "time")
        )
        sessions = list(sessions_qs)

        # Build lookup by (date, time) for quick matching
        session_lookup = {(s.date, s.time): s for s in sessions}

        # 2) Fetch confirmed bookings for that provider in the same week
        confirmed_bookings = (
            Booking.objects.filter(
                listing__merchant__provider__id=provider_id,
                start_date__range=[week_start, week_end],
                status=Booking.Status.CONFIRMED,
            )
            .select_related("user", "listing", "session")
        )

        for booking in confirmed_bookings:
            # If the booking is already linked to a session in this week, ensure
            # that session is included in our sessions list and continue.
            if booking.session_id:
                session = booking.session
                if (
                    session
                    and session.provider_id == provider_id
                    and week_start <= session.date <= week_end
                ):
                    key = (session.date, session.time)
                    if key not in session_lookup:
                        session_lookup[key] = session
                        sessions.append(session)

                    # Ensure attendee for this booking user exists
                    if booking.user and not Attendee.objects.filter(
                        session=session, name=booking.user.email
                    ).exists():
                        Attendee.objects.create(
                            session=session,
                            name=booking.user.email,
                            age=0,
                            level="Unknown",
                            source="TTW",
                            waiver=False,
                            notes="Imported from booking",
                        )
                    continue

            # If not linked yet, derive a time for the session
            # Try listing.start_time if present; otherwise default to 09:00
            if hasattr(booking.listing, "start_time") and booking.listing.start_time:
                session_time = booking.listing.start_time
            else:
                session_time = time(9, 0)

            key = (booking.start_date, session_time)

            # Find or create session for this booking
            session = session_lookup.get(key)
            if not session:
                session = Session.objects.create(
                    provider_id=provider_id,
                    date=booking.start_date,
                    time=session_time,
                    title=booking.listing_snapshot.get("title", "Booking Session"),
                    instructor=booking.listing_snapshot.get("provider_name", ""),
                    max=booking.guests or 4,
                    auto_generated=True,
                )
                session_lookup[key] = session
                sessions.append(session)

            # Attach booking to session if not already linked
            if booking.session_id != session.id:
                booking.session = session
                booking.save(update_fields=["session"])

            # Ensure attendee exists representing this booking
            if booking.user and not Attendee.objects.filter(
                session=session, name=booking.user.email
            ).exists():
                Attendee.objects.create(
                    session=session,
                    name=booking.user.email,
                    age=0,
                    level="Unknown",
                    source="TTW",
                    waiver=False,
                    notes="Imported from booking",
                )

        # 3) Reload sessions with up-to-date attendees and bookings
        refreshed_sessions = (
            Session.objects.filter(
                provider__id=provider_id,
                date__range=[week_start, week_end],
            )
            .select_related("provider")
            .prefetch_related("attendees", "bookings")
            .order_by("date", "time")
        )

        serializer = SessionOutSerializer(refreshed_sessions, many=True)
        return Response(serializer.data)



# ============================================================
#   CREATE SESSION
#   POST /provider/<provider_id>/sessions
# ============================================================

class CreateSessionView(APIView):
    def post(self, request, provider_id):
        serializer = SessionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        provider = get_object_or_404(ProviderProfile, id=provider_id)
        session = serializer.save(provider=provider)

        # Return formatted output for frontend
        out = SessionOutSerializer(session)
        return Response(out.data, status=201)



# ============================================================
#   UPDATE SESSION
#   PATCH /sessions/<session_id>
# ============================================================

class UpdateSessionView(APIView):
    def patch(self, request, session_id):
        session = get_object_or_404(Session, id=session_id)

        serializer = SessionUpdateSerializer(session, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        out = SessionOutSerializer(session)
        return Response(out.data)



# ============================================================
#   ADD WALK-IN ATTENDEE
#   POST /sessions/<session_id>/attendees/walk-in
# ============================================================

class AddWalkInView(APIView):
    def post(self, request, session_id):
        session = get_object_or_404(Session, id=session_id)

        attendee = Attendee.objects.create(
            session=session,
            name="Walk-in Guest",
            age=25,
            level="Unknown",
            source="Walk-in",
            waiver=False,
            notes="Added manually",
        )

        serializer = AttendeeSerializer(attendee)
        return Response(serializer.data, status=201)



# ============================================================
#   UPDATE ATTENDEE
#   PATCH /attendees/<attendee_id>
# ============================================================

class UpdateAttendeeView(APIView):
    def patch(self, request, attendee_id):
        attendee = get_object_or_404(Attendee, id=attendee_id)

        serializer = AttendeeUpdateSerializer(attendee, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        out = AttendeeSerializer(attendee)
        return Response(out.data)



# ============================================================
#   DELETE ATTENDEE (OPTIONAL)
#   DELETE /attendees/<attendee_id>
# ============================================================

class DeleteAttendeeView(APIView):
    def delete(self, request, attendee_id):
        attendee = Attendee.objects.filter(id=attendee_id).first()
        if not attendee:
            return Response({"error": "Attendee not found"}, status=404)

        attendee.delete()
        return Response({"success": True})