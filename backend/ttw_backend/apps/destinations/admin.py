from django.contrib import admin
from .models import Destination


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "country",
        "continent",
        "is_active",
        "created_at",
    )

    list_filter = (
        "country",
        "continent",
        "is_active",
    )

    search_fields = (
        "name",
        "country",
    )

    prepopulated_fields = {
        "slug": ("name",)
    }

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    ordering = ("name",)
