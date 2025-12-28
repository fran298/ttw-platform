from django.contrib import admin
from .models import ChatRoom, Message

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("sender", "text", "created_at")
    ordering = ("created_at",)


class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "get_user_email", "get_merchant_email", "message_count", "created_at")
    readonly_fields = ("booking", "created_at")
    inlines = [MessageInline]
    ordering = ("-created_at",)

    def get_user_email(self, obj):
        return obj.booking.user.email
    get_user_email.short_description = "Traveler"

    def get_merchant_email(self, obj):
        merchant = getattr(obj.booking.listing, "merchant", None)
        if merchant and getattr(merchant, "user", None):
            return merchant.user.email
        return "No Merchant"
    get_merchant_email.short_description = "Merchant"

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = "Messages"


class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "chat", "sender", "short_text", "created_at")
    readonly_fields = ("chat", "sender", "text", "created_at")
    ordering = ("created_at",)

    def short_text(self, obj):
        if len(obj.text) > 40:
            return obj.text[:40] + "..."
        return obj.text


admin.site.register(ChatRoom, ChatRoomAdmin)
admin.site.register(Message, MessageAdmin)
