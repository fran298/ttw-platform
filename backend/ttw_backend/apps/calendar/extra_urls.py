from django.urls import path

from .views import (
    ProviderSessionsView,
    CreateSessionView,
    UpdateSessionView,
    AddWalkInView,
    UpdateAttendeeView,
    DeleteAttendeeView,
    ProviderWeeklyCalendarView,
)

urlpatterns = [
    path("provider/<int:provider_id>/sessions", ProviderSessionsView.as_view(), name="calendar-get-sessions"),
    path("provider/<int:provider_id>/sessions/create", CreateSessionView.as_view(), name="calendar-create-session"),
    path("sessions/<int:session_id>/update", UpdateSessionView.as_view(), name="calendar-update-session"),
    path("sessions/<int:session_id>/attendees/walk-in", AddWalkInView.as_view(), name="calendar-add-walkin"),
    path("attendees/<int:attendee_id>/update", UpdateAttendeeView.as_view(), name="calendar-update-attendee"),
    path("attendees/<int:attendee_id>/delete", DeleteAttendeeView.as_view(), name="calendar-delete-attendee"),
    path("<uuid:provider_id>/week", ProviderWeeklyCalendarView.as_view()),

]