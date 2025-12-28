from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProviderViewSet, ConversationViewSet, AdminProviderViewSet

router = DefaultRouter()
router.register(r'admin/providers', AdminProviderViewSet, basename='admin-providers')
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'', ProviderViewSet, basename='providers')

urlpatterns = [
    path('', include(router.urls)),
]