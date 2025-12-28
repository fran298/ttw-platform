import uuid
from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    """
    One chat per booking: Traveler ↔ Merchant (school/instructor).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="chat_room",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat for booking {self.booking_id}"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    chat = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
        null=True,
        blank=True,
    )

    text = models.TextField()
    # Ejemplo futuro: file = models.FileField(...)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} in chat {self.chat_id}"

class MessageSeen(models.Model):
    """
    Tracks which user has seen which message.
    One row per (message, user).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="seen_records"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seen_messages"
    )

    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("message", "user")
        ordering = ["seen_at"]

    def __str__(self):
        return f"{self.user.email} saw {self.message_id} at {self.seen_at}"