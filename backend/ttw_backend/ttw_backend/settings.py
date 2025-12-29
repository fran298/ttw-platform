import os
from pathlib import Path
from datetime import timedelta
import dj_database_url

from dotenv import load_dotenv
load_dotenv()

# ... (Keep existing imports and BASE_DIR) ...
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "unsafe-dev-secret-key")
DEBUG = os.environ.get("DEBUG", "False") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

INSTALLED_APPS = [
    'daphne', # <--- FIX 1: MUST BE AT THE VERY TOP to handle WebSockets
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'cloudinary_storage',
    'cloudinary',
    'channels', # <--- Ensure this is installed (pip install channels)

    'apps.users',
    'apps.providers',
    'apps.listings',
    'apps.bookings',
    'apps.payments',
    'apps.reviews',
    'apps.instructors',
    'apps.locations',
    'apps.chat',
    'apps.calendar',
    "apps.destinations.apps.DestinationsConfig",
    'django_celery_results',
    'apps.core',

]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ttw_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ttw_backend.wsgi.application'
ASGI_APPLICATION = 'ttw_backend.asgi.application' # This points to your new asgi.py

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600
    )
}

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# --- CORS CONFIGURATION ---
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "https://thetravelwild.com",
        "https://www.thetravelwild.com",
    ]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    'accept',
    'origin',
    'x-csrftoken',
]

 # --- CSRF TRUSTED ORIGINS (REQUIRED FOR PROD HTTPS) ---
CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost,http://127.0.0.1"
).split(",")

# --- EMAIL CONFIGURATION ---
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.sendgrid.net')
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = 'The Travel Wild <no-reply@ttw.com>'

# ... (Keep Password validators, I18n, Static files) ...
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'



STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_dummy_for_local")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# --- STRIPE PREMIUM PARTNER ---
# Product: prod_TNuPM5pSpLW4KL (DO NOT use directly in Checkout)
# Price: 499 EUR / year
STRIPE_PREMIUM_PRICE_ID = os.environ.get(
    "STRIPE_PREMIUM_PRICE_ID",
    "price_1SjP06JkKt2Ek7A8xkj7c50t"
    
)

# 50% OFF coupon for Premium Partner launch
# IMPORTANT: Coupon created via Stripe API (livemode)
STRIPE_PREMIUM_50_COUPON_ID = os.environ.get(
    "STRIPE_PREMIUM_50_COUPON_ID",
    "13Vf4kMD"
)

# --- FRONTEND URL (USED FOR STRIPE REDIRECTS) ---
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# --- CHANNELS CONFIGURATION ---
if DEBUG:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [os.environ.get("REDIS_URL")],
            },
        },
    }

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")

# --- CUSTOM EMAIL ADDRESSES (USED BY apps/core/emails.py) ---

EMAIL_FROM_NOREPLY = os.getenv(
    "EMAIL_FROM_NOREPLY",
    "The Travel Wild <noreply@thetravelwild.com>"
)

SUPPORT_EMAIL = os.getenv(
    "SUPPORT_EMAIL",
    "support@thetravelwild.com"
)

BOOKINGS_EMAIL = os.getenv(
    "BOOKINGS_EMAIL",
    "bookings@thetravelwild.com"
)

EMAIL_REPLY_TO = os.getenv(
    "EMAIL_REPLY_TO",
    "support@thetravelwild.com"
)

# Partner / Admin emails
PARTNERS_EMAIL = os.getenv("PARTNERS_EMAIL", SUPPORT_EMAIL)

# --- CELERY CONFIGURATION ---
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_BACKEND = "django-db"

# --- SECURITY SETTINGS ---
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True