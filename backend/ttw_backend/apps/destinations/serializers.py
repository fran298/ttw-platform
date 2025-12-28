from rest_framework import serializers
from .models import Destination


class DestinationSerializer(serializers.ModelSerializer):
    """
    Public, read-only serializer for Destinations.
    Used by frontend to render destination cards and landing pages.
    """

    class Meta:
        model = Destination
        fields = (
            "id",
            "name",
            "slug",
            "country",
            "continent",
            "hero_image",
        )
        read_only_fields = fields
