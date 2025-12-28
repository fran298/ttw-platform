import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.chat.models import ChatRoom, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # This room_id is actually the BOOKING ID passed from the frontend URL
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"

        # Join the group so views.py can broadcast to us
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"✅ WebSocket Connected to group: {self.room_group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # This handles messages sent FROM the frontend via WebSocket (optional)
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get("message")
        sender = self.scope["user"]

        if not sender.is_authenticated:
            return 

        # Save to DB using the Helper
        saved_message = await self.save_message(self.room_id, sender, message_text)
        
        if not saved_message:
            return

        # Broadcast the new message to everyone in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": saved_message['text'],
                "sender_id": saved_message['sender_id'],
                "created_at": saved_message['created_at'],
            },
        )

    # This handles messages broadcast FROM views.py
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender_id": event["sender_id"],
            "created_at": event["created_at"]
        }))

    # --- Database Helper ---
    @database_sync_to_async
    def save_message(self, booking_id, sender, text):
        try:
            # FIX: Look up ChatRoom by BOOKING ID, not ChatRoom ID
            room = ChatRoom.objects.get(booking__id=booking_id)
            
            msg = Message.objects.create(
                chat=room,
                sender=sender,
                text=text,
            )
            return {
                "text": msg.text,
                "sender_id": str(msg.sender.id),
                "created_at": msg.created_at.isoformat()
            }
        except Exception as e:
            print(f"❌ Error saving message: {e}")
            return None