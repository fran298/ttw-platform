from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    VerifyEmailView,
    LoginView,
    ManageUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    list_travelers,
    list_instructors
)

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="user_register"),
    path("verify/", VerifyEmailView.as_view(), name="user_verify"),
    path("login/", LoginView.as_view(), name="user_login"),

    # Password reset
    path("password-reset/request", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset/confirm", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    
    # Tokens
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Profile (GET to read, PATCH to update)
    # This replaces 'current_user' and 'update_profile'
    path('me/', ManageUserView.as_view(), name='me'), 

    # Lists (Admin/Public)
    path("travelers/", list_travelers, name="list_travelers"),
    path("instructors-list/", list_instructors, name="list_instructors"),
]