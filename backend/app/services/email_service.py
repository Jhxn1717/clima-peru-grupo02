import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings


def send_verification_code(to_email: str, code: str) -> None:
    """Envía un código de verificación por correo usando Gmail SMTP (STARTTLS)."""
    sender = settings.SMTP_FROM or settings.SMTP_USER
    subject = "Clima Perú — Tu código de verificación"
    body = f"""Hola,

Gracias por registrarte en el Sistema Meteorológico del Perú.

Tu código de verificación es:

    {code}

Este código expira en {settings.VERIFICATION_CODE_EXPIRE_MINUTES} minutos.
Si no solicitaste este registro, ignora este correo.

— Equipo METEO PERÚ
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender, to_email, msg.as_string())
    except Exception as exc:
        raise RuntimeError(f"No se pudo enviar el correo de verificación: {exc}")
