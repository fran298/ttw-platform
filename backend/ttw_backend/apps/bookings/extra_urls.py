from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, AdminBookingViewSet

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='bookings')
router.register(r'admin/bookings', AdminBookingViewSet, basename='admin-bookings')

urlpatterns = [
    path('', include(router.urls)),
]