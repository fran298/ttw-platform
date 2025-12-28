from rest_framework.routers import DefaultRouter
from .views import AdminTransactionViewSet, AdminMerchantPayoutViewSet
from django.urls import path
from .views import (
    CreateCheckoutSessionView,
    ProviderPayoutsView,
    CaptureAndPayoutBookingView,
    StripeConnectOnboardingView,
    StripeConnectStatusView,
    premium_partner_checkout,
    validate_premium_session,
)
from .stripe_webhooks import stripe_webhook
from .admin_views import AdminCaptureBookingPaymentView

urlpatterns = [
    path('create-session/', CreateCheckoutSessionView.as_view(), name='create_session'),
    path(
        "stripe/connect/",
        StripeConnectOnboardingView.as_view(),
        name="stripe-connect-onboarding",
    ),
    path(
        "stripe/status/",
        StripeConnectStatusView.as_view(),
        name="stripe-connect-status",
    ),
    path("premium/checkout/", premium_partner_checkout, name="premium_partner_checkout"),
    path("premium/validate/", validate_premium_session, name="premium_validate"),
    # Webhook usually mapped in main urls.py, but good to expose here too if needed
    path('webhook/', stripe_webhook, name='stripe_webhook'),
    path(
        "admin/bookings/<uuid:booking_id>/capture/",
        AdminCaptureBookingPaymentView.as_view(),
        name="admin-capture-booking-payment",
    ),
    path("checkout-session/", CreateCheckoutSessionView.as_view()),
    path("provider-payouts/", ProviderPayoutsView.as_view()),
    path("merchant-payouts/", ProviderPayoutsView.as_view()),
]

admin_router = DefaultRouter()
admin_router.register(
    r'admin/transactions',
    AdminTransactionViewSet,
    basename='admin-transactions'
)

admin_router.register(
    r'admin/payouts',
    AdminMerchantPayoutViewSet,
    basename='admin-merchant-payouts'
)

urlpatterns += admin_router.urls