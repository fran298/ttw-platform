import stripe
from django.conf import settings
from django.urls import reverse

stripe.api_key = settings.STRIPE_SECRET_KEY

def create_stripe_express_account(email, country="US"):
    """Create a Stripe Connect Express account for a Provider or Instructor.
    Uses separate charges and transfers (platform charges, later transfers).
    """
    return stripe.Account.create(
        type="express",
        country=country,
        email=email,
        capabilities={
            "transfers": {"requested": True},
        },
    )

def create_account_link(account_id, refresh_url, return_url):
    """ Generate the link for the provider to onboard with Stripe """
    return stripe.AccountLink.create(
        account=account_id,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
    )

def create_checkout_session(booking, success_url, cancel_url):
    """ 
    Create a session for the Traveler to pay.
    Money is held (capture_method=manual) or just authorized.
    Here we capture automatically but hold payout separately.
    """
    
    # Calculate application fee (Commission)
    # booking.total_price is what user pays
    # booking.service_fee is your cut
    
    # Stripe requires amounts in cents
    amount_cents = int(booking.total_price * 100)
    fee_cents = int(booking.service_fee * 100)
    
    # TEST MODE — Merchant optional
    merchant = getattr(booking.listing, "merchant", None)
    merchant_name = None
    merchant_email = None

    if merchant:
        merchant_name = getattr(merchant, "legal_name", None)
        merchant_user = getattr(merchant, "user", None)
        merchant_email = getattr(merchant_user, "email", None)

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': booking.currency.lower(),
                'product_data': {
                    'name': booking.listing.title,
                    'description': f"Booking for {booking.guests} guests on {booking.start_date}",
                    'images': booking.listing.images[:1] if getattr(booking.listing, 'images', None) else [],
                },
                'unit_amount': int(float(booking.listing.price) * 100), # Base price per person
            },
            'quantity': booking.guests,
        }],
        customer_email=booking.user.email,
        mode='payment',
        payment_intent_data={
            "capture_method": "manual",
            "metadata": {
                "booking_id": str(booking.id),
                "type": "booking",
            },
        },
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={
            "booking_id": str(booking.id),
            "type": "booking",
            "merchant_name": merchant_name or "",
            "merchant_email": merchant_email or "",
        }
    )
    return session.url