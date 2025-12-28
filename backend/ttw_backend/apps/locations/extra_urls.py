from django.urls import path
from .views import CitySearchView

urlpatterns = [
    path("search/", CitySearchView.as_view(), name="city-search"),
]