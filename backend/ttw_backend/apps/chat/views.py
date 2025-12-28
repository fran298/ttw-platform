from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from django.utils import timezone
from django.db.models import Max

# --- EMAIL IMPORTS ---
from django.core.mail import send_mail
from django.conf import settings
# ---------------------

# --- WEBSOCKET IMPORTS ---
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
# -------------------------

from apps.bookings.models import Booking
from .models import ChatRoom, Message
from .serializers import MessageSerializer, ChatRoomSerializer


def user_can_access_chat(user, booking):
    """
    Checks if the user is either the traveler or the listing owner.
    """
    # 1. Is it the Traveler?
    if booking.user == user:
        return True

    # 2. Is it the Provider (Listing Owner)?
    if booking.listing.owner == user:
        return True

    return False


class BookingChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_access_chat(request.user, booking):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        chat, created = ChatRoom.objects.get_or_create(booking=booking)
        serializer = ChatRoomSerializer(chat)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookingMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get_chat(self, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return None, Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        chat, _ = ChatRoom.objects.get_or_create(booking=booking)
        return chat, None

    def get(self, request, booking_id):
        chat, error = self.get_chat(booking_id)
        if error: return error

        if not user_can_access_chat(request.user, chat.booking):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        messages = chat.messages.order_by("created_at")
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, booking_id):
        chat, error = self.get_chat(booking_id)
        if error: return error

        booking = chat.booking
        
        # 1. Security Check
        if not user_can_access_chat(request.user, booking):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get("text", "").strip()
        if not text:
            return Response({"detail": "Message text is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. AUTOMATIC RECEIVER CALCULATION
        sender = request.user
        traveler = booking.user
        provider_user = booking.listing.owner 

        receiver = None

        if sender.id == traveler.id:
            receiver = provider_user # Traveler -> Provider
        elif sender.id == provider_user.id:
            receiver = traveler      # Provider -> Traveler
        
        if not receiver:
            print(f"⚠️ Warning: Could not determine receiver for msg from {sender.email}")

        # 3. Save to Database
        message = Message.objects.create(
            chat=chat,
            sender=sender,
            receiver=receiver,
            text=text,
        )

        serializer = MessageSerializer(message)

        # 4. Broadcast to WebSocket
        try:
            channel_layer = get_channel_layer()
            room_group_name = f"chat_{booking_id}"

            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "chat_message",
                    "message": message.text,
                    "sender_id": str(message.sender.id),
                    "created_at": message.created_at.isoformat()
                }
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")

        # 5. SEND EMAIL NOTIFICATION (New Feature)
        if receiver and receiver.email:
            try:
                subject = f"New Message from {sender.email} - Booking #{str(booking.id)[:8]}"
                email_body = (
                    f"Hello,\n\n"
                    f"You have received a new message regarding booking {booking.listing.title}.\n\n"
                    f"From: {sender.email}\n"
                    f"Message: \"{text}\"\n\n"
                    f"Please log in to your dashboard to reply."
                )
                
                send_mail(
                    subject,
                    email_body,
                    settings.DEFAULT_FROM_EMAIL,
                    [receiver.email],
                    fail_silently=True # Prevents crashing if email fails
                )
                print(f"📧 Email sent to {receiver.email}")
            except Exception as e:
                print(f"❌ Email sending failed: {e}")

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingMarkSeenView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_access_chat(request.user, booking):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        chat, _ = ChatRoom.objects.get_or_create(booking=booking)

        from .models import MessageSeen

        messages = chat.messages.exclude(sender=request.user)

        for msg in messages:
            MessageSeen.objects.get_or_create(
                message=msg,
                user=request.user,
                defaults={"seen_at": timezone.now()}
            )

        return Response({"detail": "Messages marked as seen"}, status=status.HTTP_200_OK)


class ProviderChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role not in ['PROVIDER', 'INSTRUCTOR', 'ADMIN']:
             return Response({"detail": "Not a provider or instructor"}, status=status.HTTP_403_FORBIDDEN)

        rooms = ChatRoom.objects.filter(booking__listing__owner=user).annotate(
            last_message_time=Max("messages__created_at")
        ).order_by("-last_message_time")

        data = []
        for room in rooms:
            last_msg = room.messages.order_by("-created_at").first()
            booking = room.booking

            data.append({
                "booking_id": str(booking.id),
                "customer": booking.user.email,
                "title": booking.listing.title,
                "last_message": last_msg.text if last_msg else "",
                "timestamp": last_msg.created_at if last_msg else room.created_at,
                "unread_count": room.messages.exclude(sender=user).exclude(seen_records__user=user).count(),
            })

        return Response(data, status=status.HTTP_200_OK)