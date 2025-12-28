from rest_framework import serializers
from .models import ChatRoom, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.email", read_only=True)
    sender_role = serializers.SerializerMethodField() # <--- Added this helper
    seen_by = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "sender_name",
            "sender_role", # <--- Include it here
            "text",
            "created_at",
            "seen_by",
        )
        read_only_fields = (
            "id",
            "created_at",
            "sender",
            "sender_name",
            "sender_role",
            "seen_by",
        )

    def get_seen_by(self, obj):
        return [
            {"user": seen.user.id, "seen_at": seen.seen_at}
            for seen in obj.seen_records.all()
        ]

    def get_sender_role(self, obj):
        # Simple logic to tell frontend who sent this
        if hasattr(obj.sender, 'provider_profile'):
            return "PROVIDER"
        elif hasattr(obj.sender, 'instructor_profile'):
            return "INSTRUCTOR"
        return "USER"

class ChatRoomSerializer(serializers.ModelSerializer):
    booking_id = serializers.UUIDField(source="booking.id", read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatRoom
        fields = ("id", "booking_id", "created_at", "messages")