from rest_framework import serializers
from .models import City

class CitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name")

    class Meta:
        model = City
        fields = ("id", "name", "country_name")