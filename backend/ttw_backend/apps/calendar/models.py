from django.db import models
from apps.providers.models import ProviderProfile


class Session(models.Model):
    provider = models.ForeignKey(
    ProviderProfile,
    on_delete=models.CASCADE,
    related_name="sessions",
    null=True,
    blank=True,
    )

    date = models.DateField()
    time = models.TimeField()
    duration = models.CharField(max_length=20)

    title = models.CharField(max_length=255)
    instructor = models.CharField(max_length=255, blank=True, null=True)
    max = models.IntegerField(default=4)
    auto_generated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.date} {self.time})"


class Attendee(models.Model):
    session = models.ForeignKey(Session, related_name="attendees", on_delete=models.CASCADE)

    name = models.CharField(max_length=255)
    age = models.IntegerField(default=0)
    level = models.CharField(max_length=100, blank=True, default="")
    source = models.CharField(max_length=20, default="Walk-in")  # TTW, Direct, Walk-in
    waiver = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.name} ({self.session_id})"
