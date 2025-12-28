from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from apps.listings.views import ListingViewSet
from apps.bookings.views import BookingViewSet
from apps.providers.views import ProviderViewSet
from apps.users.views import UserViewSet
from apps.instructors.views import InstructorViewSet 
from apps.payments.views import CreateCheckoutSessionView
from apps.payments.stripe_webhooks import stripe_webhook

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listings')
router.register(r'bookings', BookingViewSet, basename='bookings')
router.register(r'providers', ProviderViewSet, basename='providers')
router.register(r'instructors', InstructorViewSet, basename='instructors')
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    path("admin/", admin.site.urls),

    # API principal por router
    path("api/", include(router.urls)),

    # Autenticación (login, refresh, etc.)
    path("api/auth/", include("apps.users.extra_urls")),

    # Pagos
    path("api/payments/checkout/", CreateCheckoutSessionView.as_view(), name="checkout"),
    path("api/payments/webhook/", stripe_webhook, name="stripe_webhook"),
    path("api/payments/", include("apps.payments.extra_urls")),

    # Extra endpoints de otros módulos
    path("api/", include("apps.listings.extra_urls")),
    path("api/providers/", include("apps.providers.extra_urls")),

    # ✅ SOLO este include para travelers y custom users
    path("api/users/", include("apps.users.extra_urls")),

    path("api/cities/", include("apps.locations.extra_urls")),

    path("api/chat/", include("apps.chat.extra_urls")),
    path("api/calendar/", include("apps.calendar.extra_urls")),
    path("api/", include("apps.destinations.extra_urls")),
    path("api/reviews/", include("apps.reviews.extra_urls")),
    path('api/bookings/', include('apps.bookings.extra_urls')),
    path("api/instructors/", include("apps.instructors.extra_urls")),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)