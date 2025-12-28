from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.authentication import SessionAuthentication

from .models import InstructorProfile
from .serializers import (
    InstructorProfileSerializer,
    InstructorPublicSafeSerializer,
    InstructorDocumentsSerializer,
    AdminInstructorSerializer,
)
from rest_framework import status
from apps.core.tasks import send_instructor_documents_uploaded_email_task
from apps.users.models import User

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user or request.user.role == 'ADMIN'

class InstructorViewSet(viewsets.ModelViewSet):
    queryset = InstructorProfile.objects.all()
    serializer_class = InstructorProfileSerializer

    def get_serializer_class(self):
        # PUBLIC endpoints (marketplace)
        if self.action in ["list", "retrieve"]:
            return InstructorPublicSafeSerializer

        # Instructor self profile
        if self.action == "me":
            return InstructorProfileSerializer

        # Default (authenticated usage)
        return InstructorProfileSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    # Search & Filtering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__email', 'bio', 'country_name']
    filterset_fields = {
        'experience_years': ['gte'],
        'verification_status': ['exact']
    }

    def get_queryset(self):
        qs = InstructorProfile.objects.all()

        # Public marketplace: only show approved instructors
        if self.action in ["list", "retrieve"]:
            qs = qs.filter(
                verification_status=InstructorProfile.VerificationStatus.APPROVED
            )

        return qs

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get or update the current user's instructor profile
        """
        profile = get_object_or_404(InstructorProfile, user=request.user)

        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        if request.method == 'PATCH':
            serializer = self.get_serializer(
                profile,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="me/documents",
    )
    def upload_documents(self, request):
        """
        Upload legal documents for instructor verification.
        Triggers partner notification email.
        """
        instructor = InstructorProfile.objects.filter(user=request.user).first()
        if not instructor:
            return Response(
                {"detail": "No instructor profile linked to this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InstructorDocumentsSerializer(
            instructor,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Notify partners asynchronously
        send_instructor_documents_uploaded_email_task.delay(
            instructor_id=str(instructor.id)
        )

        return Response(
            {"detail": "Documents uploaded successfully and pending review"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def from_users(self, request):
        """
        Returns all users with role = INSTRUCTOR (even if they don't have InstructorProfile)
        """
        instructors = User.objects.filter(role=User.Roles.INSTRUCTOR)

        data = []
        for u in instructors:
            data.append({
                "id": u.id,
                "email": u.email,
                "name": u.get_full_name() or u.email,
                "created_at": u.created_at,
                "role": u.role,
                "is_active": u.is_active,
            })

        return Response(data)

class AdminInstructorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only endpoint for Instructors.
    Used by Admin Dashboard > Partners.
    Exposes REAL commission data.
    """
    queryset = InstructorProfile.objects.select_related(
        "user",
        "merchant",
        "city",
        "city__country",
    ).all()

    serializer_class = AdminInstructorSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
