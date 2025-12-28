from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Destination
from .serializers import DestinationSerializer


class DestinationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only ViewSet for Destinations.
    Used by frontend to list destinations and fetch by slug.
    """

    serializer_class = DestinationSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Destination.objects.filter(is_active=True)
