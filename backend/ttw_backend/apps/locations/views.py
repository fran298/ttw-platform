from rest_framework.generics import ListAPIView
from .models import City
from .serializers import CitySerializer

class CitySearchView(ListAPIView):
    serializer_class = CitySerializer

    def get_queryset(self):
        q = self.request.query_params.get("q", "")
        return City.objects.filter(name__icontains=q).select_related("country")[:20]