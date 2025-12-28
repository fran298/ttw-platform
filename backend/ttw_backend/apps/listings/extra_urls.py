from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet, SportViewSet

router = DefaultRouter()

# ⚠️ IMPORTANTE: Sports primero
router.register(r'sports', SportViewSet, basename='sports')
router.register(r'listings', ListingViewSet, basename='listings')

urlpatterns = [
    path('', include(router.urls)),
]