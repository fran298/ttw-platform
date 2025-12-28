from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.authentication import SessionAuthentication

from apps.providers.models import MerchantProfile

from .models import ProviderProfile, ProviderNotification, Conversation, Message
from .serializers import (
    ProviderPublicSerializer,  # legacy / deprecated
    ProviderPublicSafeSerializer,
    ProviderDashboardSerializer,
    ProviderMeSerializer,
    NotificationSerializer,
    ConversationSerializer,
    MessageSerializer,
    AdminProviderSerializer
)
from apps.providers.serializers import ProviderDocumentsSerializer
from apps.core.tasks import send_provider_documents_uploaded_email_task

class ProviderViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        """
        Prevent duplicate ProviderProfile creation.
        A User can only have ONE ProviderProfile.
        """
        if hasattr(request.user, "provider_profile"):
            return Response(
                {"detail": "Provider profile already exists for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    queryset = ProviderProfile.objects.select_related(
        'user',
        'city',
        'city__country'
    ).all()

    def get_queryset(self):
        qs = super().get_queryset()

        # Marketplace: only approved providers should be public
        if self.action in ["list", "retrieve"]:
            qs = qs.filter(
                verification_status=ProviderProfile.VerificationStatus.APPROVED
            )

        return qs

    def get_serializer_class(self):
        # PUBLIC SAFE endpoints
        if self.action in ["list", "retrieve"]:
            return ProviderPublicSafeSerializer

        # Creation flow (legacy, keep for compatibility)
        if self.action == "create":
            return ProviderPublicSerializer

        # Authenticated self profile
        if self.action == "me":
            return ProviderMeSerializer

        # Default: dashboard / internal usage
        return ProviderDashboardSerializer

    def perform_create(self, serializer):
        # Let the serializer handle all validated fields.
        # The user is already available via request in the serializer context.
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        """
        Dashboard endpoint.
        Must expose REAL economic & Stripe state.
        """
        profile = getattr(request.user, 'provider_profile', None)
        if not profile:
            return Response(
                {"error": "You are not a provider"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProviderMeSerializer(
            profile,
            context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def notifications(self, request):
        """ Get recent alerts for the provider """
        profile = getattr(request.user, 'provider_profile', None)
        if not profile:
            return Response([])
        notes = ProviderNotification.objects.filter(provider=profile).order_by('-created_at')
        return Response(NotificationSerializer(notes, many=True).data)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated], url_path='me')
    def me(self, request):
        provider = ProviderProfile.objects.filter(user=request.user).first()
        if not provider:
            return Response(
                {"detail": "No provider linked to this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            serializer = ProviderMeSerializer(provider)
            return Response(serializer.data)

        serializer = ProviderMeSerializer(
            provider,
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
        url_path="me/documents"
    )
    def upload_documents(self, request):
        """
        Upload legal documents for provider verification.
        Triggers partner notification email.
        """
        provider = ProviderProfile.objects.filter(user=request.user).first()
        if not provider:
            return Response(
                {"detail": "No provider linked to this user"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProviderDocumentsSerializer(
            provider,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Notify partners asynchronously
        send_provider_documents_uploaded_email_task.delay(
            provider_id=str(provider.id)
        )

        return Response(
            {"detail": "Documents uploaded successfully and pending review"},
            status=status.HTTP_200_OK
        )

# --- CHAT VIEWSETS ---

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # If provider, return chats with users
        if hasattr(user, 'provider_profile'):
            return Conversation.objects.filter(provider=user.provider_profile)
        # If user, return chats with providers
        return Conversation.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        text = request.data.get('text')
        
        if not text:
            return Response({"error": "Empty message"}, status=400)

        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=text
        )
        
        # Update timestamp for sorting
        conversation.save()
        
        return Response(MessageSerializer(msg).data)

# ============================
# ADMIN VIEWSETS
# ============================

class AdminProviderViewSet(viewsets.ModelViewSet):
    """
    Admin-only endpoint for Providers (Schools).
    Used by Admin Dashboard > Partners.
    Exposes REAL commission data.
    """
    queryset = ProviderProfile.objects.select_related(
        "user",
        "city",
        "city__country",
    ).all()

    serializer_class = AdminProviderSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[permissions.IsAdminUser],
        url_path="commission"
    )
    def update_commission(self, request, pk=None):
        provider = self.get_object()
        commission = request.data.get("commission_rate")

        if commission is None:
            return Response(
                {"error": "commission_rate is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            commission = float(commission)
        except (TypeError, ValueError):
            return Response(
                {"error": "commission_rate must be a number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        merchant = getattr(provider, "merchant_profile", None)
        if not merchant:
            return Response(
                {"error": "Provider has no merchant linked"},
                status=status.HTTP_400_BAD_REQUEST
            )

        merchant.commission_rate = commission
        merchant.save(update_fields=["commission_rate"])

        return Response({
            "provider_id": provider.id,
            "merchant_id": merchant.id,
            "commission_rate": float(merchant.commission_rate)
        })