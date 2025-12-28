from django.contrib import admin
from .models import InstructorProfile


@admin.register(InstructorProfile)
class InstructorProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "display_name", "user", "city")

    search_fields = (
        "display_name",      # real instructor name (what frontend uses)
        "user__email",       # fallback
    )
    autocomplete_fields = ("city",)

    def save_model(self, request, obj, form, change):
        """
        Force Django to save the city selected in the dropdown
        instead of keeping the old corrupted FK value.
        """
        if "city" in form.cleaned_data:
            obj.city = form.cleaned_data.get("city")
        super().save_model(request, obj, form, change)