import requests
from django.conf import settings

DEFAULT_FROM_NOREPLY = settings.EMAIL_FROM_NOREPLY
DEFAULT_REPLY_TO = getattr(settings, "EMAIL_REPLY_TO", None)


RESEND_URL = "https://api.resend.com/emails"


def base_email_template(content_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 16px;">
              <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
                
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <img 
                      src="https://res.cloudinary.com/dmvlubzor/image/upload/v1765793941/uyn9cdwhmfpggdf1eqyo.png"
                      alt="The Travel Wild"
                      style="height:48px;"
                    />
                  </td>
                </tr>

                <tr>
                  <td>
                    {content_html}
                  </td>
                </tr>

              </table>

              <div style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center;">
                © The Travel Wild — Wild adventures worldwide<br/>
                Support: <a href="mailto:{settings.SUPPORT_EMAIL}" style="color:#0f2a44;text-decoration:none;">{settings.SUPPORT_EMAIL}</a>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def verification_email_html(code: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Verify your email
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            Welcome to <strong>The Travel Wild</strong>.<br/>
            Use the following code to complete your verification.
          </p>

          <div style="
            display:inline-block;
            background:#f1f5f9;
            color:#0f2a44;
            font-size:32px;
            font-weight:700;
            letter-spacing:6px;
            padding:16px 28px;
            border-radius:12px;
            margin:24px 0;
          ">
            {code}
          </div>

          <p style="font-size:12px;color:#64748b;">
            This code will expire shortly. If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
    """)


def password_reset_email_html(code: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Reset your password
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            We received a request to reset your password for <strong>The Travel Wild</strong>.
          </p>

          <div style="
            display:inline-block;
            background:#f1f5f9;
            color:#0f2a44;
            font-size:32px;
            font-weight:700;
            letter-spacing:6px;
            padding:16px 28px;
            border-radius:12px;
            margin:24px 0;
          ">
            {code}
          </div>

          <p style="font-size:12px;color:#64748b;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
    """)


# Booking created user email HTML
def booking_created_user_email_html(listing_title: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Your booking request was received
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            Your reservation request for <strong>{listing_title}</strong> has been successfully sent.
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            📅 The exact schedule will be coordinated directly with the school or instructor
            through the <strong>in-platform chat</strong>.
          </p>

          <p style="font-size:13px;color:#64748b;margin-top:20px;">
            For your safety, all communication and payments must remain inside The Travel Wild.
            Any attempt to bypass the platform may result in account suspension.
          </p>
        </div>
    """)


# Booking created provider email HTML
def booking_created_provider_email_html(listing_title: str, user_email: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            New booking request
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            You have received a new booking request for <strong>{listing_title}</strong>.
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Please contact the guest (<strong>{user_email}</strong>) via the
            <strong>platform chat</strong> to agree on the exact schedule.
          </p>

          <p style="font-size:13px;color:#b91c1c;margin-top:20px;font-weight:600;">
            ⚠️ Important:
          </p>

          <p style="font-size:13px;color:#64748b;line-height:1.6;">
            Any attempt to move communication or payment outside The Travel Wild
            may be considered a breach of contract and could lead to account suspension
            and legal action in cases of fraud.
          </p>
        </div>
    """)


# --------------- NEW HTML BUILDERS ---------------
def booking_authorized_user_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    date = booking.start_date.strftime("%d %B %Y") if booking.start_date else "—"
    amount = f"{booking.total_price} {booking.currency}" if booking.total_price else "—"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Your booking is authorized
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Activity:</strong> {title}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Date:</strong> {date}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Amount authorized:</strong> {amount}
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            The provider will contact you via the platform chat to coordinate the exact time.
          </p>
        </div>
    """)

def booking_authorized_provider_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    date = booking.start_date.strftime("%d %B %Y") if booking.start_date else "—"
    guest_email = booking.user.email if booking.user else "—"
    payout = f"{booking.provider_payout} {booking.currency}" if booking.provider_payout else "—"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            New authorized booking
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Activity:</strong> {title}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Date:</strong> {date}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Guest:</strong> {guest_email}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Estimated payout:</strong> {payout}
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Please contact the guest via the platform chat to coordinate the details.
          </p>
        </div>
    """)

def booking_authorized_admin_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    date = booking.start_date.strftime("%d %B %Y") if booking.start_date else "—"
    customer = booking.user.email if booking.user else "—"
    total = f"{booking.total_price} {booking.currency}" if booking.total_price else "—"
    fee = f"{booking.service_fee} {booking.currency}" if booking.service_fee else "—"
    payout = f"{booking.provider_payout} {booking.currency}" if booking.provider_payout else "—"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Booking authorized
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Booking ID:</strong> {booking.id}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Activity:</strong> {title}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Date:</strong> {date}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Customer:</strong> {customer}
          </p>

          <hr style="margin:24px 0;"/>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Total charged:</strong> {total}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Platform fee:</strong> {fee}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Provider payout:</strong> {payout}
          </p>
        </div>
    """)


# --------------- FINALIZED BOOKING EMAILS ---------------
def booking_finalized_user_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    date = booking.start_date.strftime("%d %B %Y") if booking.start_date else "—"
    amount = f"{booking.adjusted_total_price or booking.total_price} {booking.currency}"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Your activity has been completed
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Activity:</strong> {title}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Date:</strong> {date}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Final amount charged:</strong> {amount}
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            Thank you for using The Travel Wild. We hope to see you again soon.
          </p>
        </div>
    """)


def booking_finalized_provider_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    date = booking.start_date.strftime("%d %B %Y") if booking.start_date else "—"
    payout = f"{booking.provider_payout} {booking.currency}"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Booking completed – payout confirmed
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Activity:</strong> {title}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Date:</strong> {date}
          </p>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>Final payout:</strong> {payout}
          </p>

          <p style="font-size:14px;color:#475569;line-height:1.6;">
            The payout has been processed according to the completed percentage.
          </p>
        </div>
    """)


def booking_finalized_admin_email_html(booking) -> str:
    snapshot = booking.listing_snapshot or {}

    title = snapshot.get("title") or "—"
    customer = booking.user.email if booking.user else "—"
    total = f"{booking.adjusted_total_price or booking.total_price} {booking.currency}"
    fee = f"{booking.service_fee} {booking.currency}"
    payout = f"{booking.provider_payout} {booking.currency}"

    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Booking finalized
          </h2>

          <p><strong>Booking ID:</strong> {booking.id}</p>
          <p><strong>Activity:</strong> {title}</p>
          <p><strong>Customer:</strong> {customer}</p>

          <hr style="margin:24px 0;"/>

          <p><strong>Final amount charged:</strong> {total}</p>
          <p><strong>Platform fee:</strong> {fee}</p>
          <p><strong>Provider payout:</strong> {payout}</p>
        </div>
    """)

# Admin notification templates for premium partner
def premium_partner_activated_admin_email_html(partner_name: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Premium Partner Activated
          </h2>
          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>{partner_name}</strong> has been activated as a Premium Partner.
          </p>
        </div>
    """)

def premium_partner_pending_admin_email_html(partner_name: str) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            Premium Partner Pending
          </h2>
          <p style="font-size:15px;color:#475569;line-height:1.6;">
            <strong>{partner_name}</strong> is pending Premium Partner activation.
          </p>
        </div>
    """)

# --------------- PROVIDER/INSTRUCTOR DOCUMENTS UPLOADED EMAILS ---------------
def provider_documents_uploaded_email_html(provider) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            New provider documents uploaded
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            A provider has uploaded new verification documents.
          </p>

          <p><strong>Provider:</strong> {provider.user.get_full_name() or provider.user.email}</p>
          <p><strong>Email:</strong> {provider.user.email}</p>

          <p style="margin-top:20px;font-size:14px;color:#475569;">
            Please review the documents in the admin dashboard.
          </p>
        </div>
    """)


def instructor_documents_uploaded_email_html(instructor) -> str:
    return base_email_template(f"""
        <div style="text-align:center;">
          <h2 style="margin-top:0;font-size:24px;font-weight:700;color:#0f2a44;">
            New instructor documents uploaded
          </h2>

          <p style="font-size:15px;color:#475569;line-height:1.6;">
            An instructor has uploaded new verification documents.
          </p>

          <p><strong>Instructor:</strong> {instructor.user.get_full_name() or instructor.user.email}</p>
          <p><strong>Email:</strong> {instructor.user.email}</p>

          <p style="margin-top:20px;font-size:14px;color:#475569;">
            Please review the documents in the admin dashboard.
          </p>
        </div>
    """)

# --------------- TEMPLATE RENDERING ---------------
def _render_template(template: str, context: dict) -> str:
    """
    Maps template name to HTML builder and renders with context.
    """
    if not isinstance(context, dict):
        raise Exception("context must be a dict")
    if template == "booking_authorized_user":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_authorized_user' requires 'booking' in context")
        return booking_authorized_user_email_html(booking)
    elif template == "booking_authorized_provider":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_authorized_provider' requires 'booking' in context")
        return booking_authorized_provider_email_html(booking)
    elif template == "booking_authorized_admin":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_authorized_admin' requires 'booking' in context")
        return booking_authorized_admin_email_html(booking)
    elif template == "booking_finalized_user":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_finalized_user' requires 'booking' in context")
        return booking_finalized_user_email_html(booking)

    elif template == "booking_finalized_provider":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_finalized_provider' requires 'booking' in context")
        return booking_finalized_provider_email_html(booking)

    elif template == "booking_finalized_admin":
        booking = context.get("booking")
        if not booking:
            raise Exception("Template 'booking_finalized_admin' requires 'booking' in context")
        return booking_finalized_admin_email_html(booking)
    elif template == "premium_partner_activated_admin":
        partner_name = context.get("partner_name")
        if not partner_name:
            raise Exception("Template 'premium_partner_activated_admin' requires 'partner_name' in context")
        return premium_partner_activated_admin_email_html(partner_name)
    elif template == "premium_partner_pending_admin":
        partner_name = context.get("partner_name")
        if not partner_name:
            raise Exception("Template 'premium_partner_pending_admin' requires 'partner_name' in context")
        return premium_partner_pending_admin_email_html(partner_name)
    elif template == "provider_documents_uploaded":
        provider = context.get("provider")
        if not provider:
            raise Exception("Template 'provider_documents_uploaded' requires 'provider' in context")
        return provider_documents_uploaded_email_html(provider)
    elif template == "instructor_documents_uploaded":
        instructor = context.get("instructor")
        if not instructor:
            raise Exception("Template 'instructor_documents_uploaded' requires 'instructor' in context")
        return instructor_documents_uploaded_email_html(instructor)
    else:
        raise Exception(f"Unknown template: {template}")


def send_email(
    *,
    to: list[str] | str,
    subject: str,
    html: str | None = None,
    template: str | None = None,
    context: dict | None = None,
    from_email: str | None = None,
    reply_to: str | None = None,
    attachments: list | None = None,
):
    """
    Centralized Resend email sender.
    Supports both direct HTML and template+context usage.
    """
    # Validation for html/template usage
    if (html is None and template is None) or (html is not None and template is not None):
        raise Exception("You must provide exactly one of 'html' or 'template'")

    # Backward compatibility: if html is given, use it directly
    if html is not None:
        html_content = html
    else:
        # Template rendering
        if context is None:
            context = {}
        html_content = _render_template(template, context)

    # Accept both string and list for 'to'
    if isinstance(to, str):
        to_list = [to]
    elif isinstance(to, list):
        to_list = to
    else:
        raise Exception("'to' must be a string or list of strings")

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "from": from_email or DEFAULT_FROM_NOREPLY,
        "to": to_list,
        "subject": subject,
        "html": html_content,
    }

    final_reply_to = reply_to if reply_to is not None else DEFAULT_REPLY_TO
    if final_reply_to:
        payload["reply_to"] = final_reply_to

    if attachments:
        import base64
        payload["attachments"] = []
        for att in attachments:
            file_obj = att["file"]
            file_obj.seek(0)
            encoded = base64.b64encode(file_obj.read()).decode("utf-8")
            payload["attachments"].append({
                "filename": att["filename"],
                "content": encoded,
            })

    response = requests.post(
        RESEND_URL,
        headers=headers,
        json=payload,
        timeout=10,
    )

    if response.status_code >= 400:
        raise Exception(
            f"Resend error {response.status_code}: {response.text}"
        )

    return response.json()