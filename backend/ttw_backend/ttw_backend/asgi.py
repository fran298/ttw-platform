import os
import django
from django.core.asgi import get_asgi_application

# 1. Init Django Settings first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ttw_backend.settings')
django.setup()

# 2. Import Channels AFTER django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.chat.routing import websocket_urlpatterns

# 3. Define the Application
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})