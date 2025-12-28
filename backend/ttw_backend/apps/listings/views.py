from rest_framework import viewsets, filters, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count

from .models import Listing, Sport
from .serializers import ListingSerializer, ListingCreateSerializer, SportSerializer

class SportViewSet(viewsets.ModelViewSet):
    """ 
    Taxonomy Management.
    - Public: List/Retrieve
    - Admin: Create/Update/Delete
    """
    queryset = Sport.objects.annotate(listing_count=Count('listings'))
    serializer_class = SportSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ListingViewSet(viewsets.ModelViewSet):
    """ 
    Main Listing API. 
    Supports filtering by Sport, Location, Price, Type.
    """
    def get_permissions(self):
        # 🔓 Público (marketplace)
        if self.action in ['list', 'retrieve', 'featured']:
            return [permissions.AllowAny()]

        # 🔒 Gestión privada
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'upload_image']:
            return [permissions.IsAuthenticated()]

        return [permissions.AllowAny()]

    queryset = Listing.objects.select_related('city', 'city__country', 'sport', 'owner', 'merchant')
    serializer_class = ListingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    filterset_fields = {
        'type': ['exact'],
        'sport__slug': ['exact'],
        'city__country__name': ['iexact'], 
        'city__name': ['iexact'], 
        'price': ['lte', 'gte'],
    }
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'rating', 'created_at']

    def get_queryset(self):
        user = self.request.user

        # 🔓 CONTEXTO PÚBLICO (marketplace)
        if self.action in ['list', 'retrieve', 'featured']:
            qs = Listing.objects.select_related(
                'city', 'city__country', 'sport', 'owner', 'merchant'
            ).filter(status='ACTIVE')

            provider_id = self.request.query_params.get("provider")
            instructor_id = self.request.query_params.get("instructor")

            # ✅ Listings de una escuela (Provider) por MERCHANT
            if provider_id:
                from apps.providers.models import ProviderProfile
                provider = ProviderProfile.objects.select_related("merchant").filter(id=provider_id).first()
                if provider and provider.merchant:
                    return qs.filter(merchant=provider.merchant)
                return qs.none()

            # ✅ Listings de un instructor (freelancer) por MERCHANT
            if instructor_id:
                from apps.instructors.models import InstructorProfile
                instructor = InstructorProfile.objects.select_related("merchant").filter(id=instructor_id).first()
                if instructor and instructor.merchant:
                    return qs.filter(merchant=instructor.merchant)
                return qs.none()

            return qs

        # 🔒 CONTEXTO PRIVADO (dashboard)
        if not user.is_authenticated:
            return Listing.objects.none()

        # Admin puede ver todo
        if user.is_staff:
            return Listing.objects.select_related(
                'city', 'city__country', 'sport', 'owner', 'merchant'
            )

        from apps.providers.models import MerchantProfile

        merchant = None

        # Provider
        if hasattr(user, "providerprofile") and user.providerprofile:
            merchant = user.providerprofile.merchant

        # Instructor
        if merchant is None and hasattr(user, "instructorprofile") and user.instructorprofile:
            merchant = user.instructorprofile.merchant

        # Fallback
        if merchant is None:
            merchant = MerchantProfile.objects.filter(user=user).first()

        if merchant is None:
            return Listing.objects.none()

        return Listing.objects.select_related(
            'city', 'city__country', 'sport', 'owner', 'merchant'
        ).filter(owner=user)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ListingCreateSerializer
        return ListingSerializer

    def perform_create(self, serializer):
        user = self.request.user
        merchant = None

        # 1️⃣ Provider
        try:
            merchant = user.providerprofile.merchant
        except Exception:
            pass

        # 2️⃣ Instructor
        if merchant is None:
            try:
                merchant = user.instructorprofile.merchant
            except Exception:
                pass

        # 3️⃣ Merchant directo por user (fallback)
        if merchant is None:
            from apps.providers.models import MerchantProfile
            merchant = MerchantProfile.objects.filter(user=user).first()

        # 4️⃣ Crear merchant SI NO EXISTE (último recurso, no fallar)
        if merchant is None:
            from apps.providers.models import MerchantProfile
            merchant = MerchantProfile.objects.create(
                user=user,
                type="PROVIDER"
            )

            # Enlazarlo al profile existente
            try:
                user.providerprofile.merchant = merchant
                user.providerprofile.save(update_fields=["merchant"])
            except Exception:
                pass

            try:
                user.instructorprofile.merchant = merchant
                user.instructorprofile.save(update_fields=["merchant"])
            except Exception:
                pass

        serializer.save(owner=user, merchant=merchant)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """ Top 8 rated listings for Home Page """
        featured = self.get_queryset().order_by('-rating')[:8]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        listing = self.get_object()

        from apps.providers.models import MerchantProfile

        merchant = None

        if hasattr(request.user, "providerprofile") and request.user.providerprofile:
            merchant = request.user.providerprofile.merchant

        if merchant is None and hasattr(request.user, "instructorprofile") and request.user.instructorprofile:
            merchant = request.user.instructorprofile.merchant

        if merchant is None:
            merchant = MerchantProfile.objects.filter(user=request.user).first()

        if listing.owner != request.user:
            return Response({"error": "Not authorized"}, status=403)

        listing.delete()
        return Response({"message": "Listing deleted"}, status=200)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request):
        from cloudinary.uploader import upload
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=400)
        result = upload(file)
        return Response({"url": result.get("secure_url")})
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='my'
    )
    def my_listings(self, request):
        """
        🔒 Listings privados del merchant logueado (Dashboard)
        """
        user = request.user

        # Admin
        if user.is_staff:
            queryset = Listing.objects.all()
        else:
            from apps.providers.models import MerchantProfile

            merchant = None

            if hasattr(user, "providerprofile") and user.providerprofile:
                merchant = user.providerprofile.merchant

            if merchant is None and hasattr(user, "instructorprofile") and user.instructorprofile:
                merchant = user.instructorprofile.merchant

            if merchant is None:
                merchant = MerchantProfile.objects.filter(user=user).first()

            if merchant is None:
                return Response([], status=200)

            queryset = Listing.objects.filter(owner=user)

        serializer = ListingSerializer(
            queryset.select_related('city', 'city__country', 'sport', 'owner', 'merchant'),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)