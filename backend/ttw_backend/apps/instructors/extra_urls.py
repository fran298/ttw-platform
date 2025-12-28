from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstructorViewSet, AdminInstructorViewSet

router = DefaultRouter()
router.register(r'', InstructorViewSet, basename='instructors')
router.register(r'admin', AdminInstructorViewSet, basename='admin-instructors')

urlpatterns = [
    path('', include(router.urls)),

]