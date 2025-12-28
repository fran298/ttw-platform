from django.urls import path
from .views import (
    BookingChatView,
    BookingMessagesView,
    BookingMarkSeenView,
    ProviderChatListView,
)

urlpatterns = [
    path("bookings/<uuid:booking_id>/", BookingChatView.as_view(), name="booking-chat"),
    path("bookings/<uuid:booking_id>/messages/", BookingMessagesView.as_view(), name="booking-messages"),
    path("bookings/<uuid:booking_id>/seen/", BookingMarkSeenView.as_view(), name="booking-mark-seen"),
    path("provider/", ProviderChatListView.as_view(), name="provider-chat"),
]