from rest_framework_simplejwt.views import TokenRefreshView

class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh endpoint for JWT tokens.
    Required so the frontend can renew expired access tokens.
    """
    pass
