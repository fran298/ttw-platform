from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import random

# Use Resend email utility for all outgoing emails (production-safe)
from apps.core.emails import send_email
from apps.core.emails import verification_email_html, password_reset_email_html
import random

# --- MODELS & SERIALIZERS ---
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

# Imports for Unified Profile Endpoint
from apps.providers.models import ProviderProfile
from apps.instructors.models import InstructorProfile
from apps.providers.serializers import ProviderProfileSerializer
from apps.instructors.serializers import InstructorProfileSerializer

# -----------------------------------------------------------
# USER MANAGEMENT (Read Only List)
# -----------------------------------------------------------
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='Traveler')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

# -----------------------------------------------------------
# AUTH VIEWS
# -----------------------------------------------------------

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create inactive user
        user = serializer.save()
        user.is_active = False # Cannot login yet
        # --- CREATE ROLE PROFILE (PENDING VERIFICATION) ---
        if user.role == User.Roles.PROVIDER:
            ProviderProfile.objects.get_or_create(
                user=user,
                defaults={"verification_status": "PENDING"}
            )
        elif user.role == User.Roles.INSTRUCTOR:
            InstructorProfile.objects.get_or_create(user=user)
        
        # Generate 6-digit code
        code = str(random.randint(100000, 999999))
        user.verification_code = code
        user.save()
        
        # Send verification email (PRODUCTION SAFE)
        send_email(
            to=user.email,
            subject="Verify your email",
            html=verification_email_html(code)
        )

        return Response({
            "message": "Verification code sent to email",
            "email": user.email
        })

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
            
        if user.verification_code == code:
            user.is_active = True
            user.is_verified = True
            user.verification_code = '' # Clear code
            user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
        else:
            return Response({"error": "Invalid code"}, status=400)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })

# -----------------------------------------------------------
# PASSWORD RESET VIEWS
# -----------------------------------------------------------

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not reveal if user exists
            return Response({"message": "If the email exists, a reset code was sent"}, status=200)

        # Generate 6-digit reset code
        code = str(random.randint(100000, 999999))
        user.verification_code = code
        user.save()

        # Send password reset email (PRODUCTION SAFE)
        send_email(
            to=user.email,
            subject="Reset your password",
            html=password_reset_email_html(code)
        )

        return Response({"message": "Reset code sent to email"}, status=200)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('newPassword')

        if not all([email, code, new_password]):
            return Response({"error": "Email, code and new password are required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid reset request"}, status=400)

        if user.verification_code != code:
            return Response({"error": "Invalid or expired code"}, status=400)

        user.set_password(new_password)
        user.verification_code = ''
        user.save()

        return Response({"message": "Password reset successful"}, status=200)

# -----------------------------------------------------------
# PROFILE VIEW (GET & PATCH)
# -----------------------------------------------------------

class ManageUserView(generics.RetrieveUpdateAPIView):
    """
    Handles reading (GET) and updating (PATCH) the authenticated user's profile.
    This fixes the 405 error.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Retrieve and return authenticated user"""
        return self.request.user

# -----------------------------------------------------------
# ADMIN / LIST VIEWS
# -----------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_travelers(request):
    """
    Returns all users with role = USER (Travelers reales)
    """
    travelers = User.objects.filter(role=User.Roles.USER)

    data = []
    for u in travelers:
        data.append({
            "id": u.id,
            "email": u.email,
            "name": u.get_full_name() or u.email,
            "date_joined": u.created_at, 
            "role": u.role,
            "is_active": u.is_active,
        })

    return Response(data, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_instructors(request):
    """
    Returns all users with role = 'Instructor' for Admin Dashboard
    """
    instructors = User.objects.filter(role__iexact="Instructor", is_active=True)

    data = []
    for u in instructors:
        data.append({
            "id": u.id,
            "email": u.email,
            "name": u.get_full_name() or u.username, 
            "date_joined": u.created_at,
            "role": u.role,
        })

    return Response(data, status=200)

# -----------------------------------------------------------
# UNIFIED PUBLIC PROFILE ENDPOINT (New)
# -----------------------------------------------------------

@api_view(['GET'])
@permission_classes([AllowAny]) 
def get_public_profile(request, pk):
    """
    Unified endpoint to fetch a profile by ID (School OR Instructor).
    Eliminates the need for the frontend to guess and get 404s.
    """
    # 1. Try Provider (School)
    try:
        provider = ProviderProfile.objects.get(pk=pk)
        serializer = ProviderProfileSerializer(provider)
        data = serializer.data
        data['type'] = 'SCHOOL' 
        return Response(data)
    except ProviderProfile.DoesNotExist:
        pass

    # 2. Try Instructor
    try:
        instructor = InstructorProfile.objects.get(pk=pk)
        serializer = InstructorProfileSerializer(instructor)
        data = serializer.data
        data['type'] = 'FREELANCER'
        return Response(data)
    except InstructorProfile.DoesNotExist:
        pass

    return Response({"error": "Profile not found"}, status=404)