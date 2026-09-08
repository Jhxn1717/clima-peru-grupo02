import base64
import json
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthRequest,
    SendCodeRequest,
    VerifyCodeRequest,
    UserRegister,
    EmailVerificationRequest,
    ResendCodeRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    MessageResponse,
)
from app.services import auth_service
from app.services.email_service import send_verification_code

router = APIRouter(prefix="/auth", tags=["Autenticación"])
VERIFICATION_NOT_SENT = False


def _dispatch_code(email: str, code: str) -> None:
    """Envía el código por correo; si no hay SMTP configurado, lo muestra en consola."""
    global VERIFICATION_NOT_SENT
    try:
        send_verification_code(email, code)
        VERIFICATION_NOT_SENT = False
    except Exception as exc:  # noqa: BLE001
        VERIFICATION_NOT_SENT = True
        print(f"\n==================================================")
        print(f"  CÓDIGO DE VALIDACIÓN METEOPERÚ PARA {email}: {code}")
        print(f"==================================================\n")
        print(f"[EMAIL-INFO] Si configuras SMTP en .env, este código se enviará directamente a su bandeja de entrada.")


def _to_user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def _build_token_response(user: User) -> TokenResponse:
    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_to_user_response(user))


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Inicia sesión con Google usando ID Token verificado con google-auth."""
    if not payload.credential:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de Google (credential) es requerido",
        )

    try:
        # Validar el token con google-auth contra GOOGLE_CLIENT_ID
        client_id = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        idinfo = google_id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            client_id
        )
    except ValueError as err:
        print(f"[AUTH-GOOGLE-ERROR] Token inválido o expirado: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido o expirado: {err}",
        )
    except Exception as err:
        print(f"[AUTH-GOOGLE-ERROR] Error de verificación: {err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validando autenticación con Google: {err}",
        )

    # Validar que el email esté verificado por Google
    if not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico de Google no está verificado",
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener el correo electrónico de la cuenta de Google",
        )

    full_name = idinfo.get("name")
    avatar_url = idinfo.get("picture")

    normalized_email = email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        # Crear cuenta automáticamente si no existe en la base de datos
        display_name = full_name.strip() if full_name else normalized_email.split("@")[0].capitalize()
        user = User(
            full_name=display_name,
            email=normalized_email,
            avatar_url=avatar_url,
            hashed_password=auth_service.hash_password(secrets.token_urlsafe(24)),
            is_verified=True,
            role="user",
            perm_dashboard=True,
            perm_map=True,
            perm_compare=True,
            perm_analysis=True,
            perm_alerts=True,
            perm_rankings=True,
            perm_csv=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[AUTH-GOOGLE] Nueva cuenta creada automáticamente: {normalized_email}")
    else:
        # Vincular cuenta existente sin duplicar registros
        updated = False
        if not user.is_verified:
            user.is_verified = True
            updated = True
        if avatar_url and getattr(user, "avatar_url", None) != avatar_url:
            user.avatar_url = avatar_url
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
        print(f"[AUTH-GOOGLE] Cuenta vinculada con éxito: {normalized_email}")

    return _build_token_response(user)


@router.post("/send-code", response_model=MessageResponse)
def send_code(payload: SendCodeRequest, db: Session = Depends(get_db)):
    """Envía un código numérico de 6 dígitos al correo del usuario."""
    email = payload.email.lower().strip()
    code = auth_service.generate_verification_code()
    auth_service.store_verification_code(db, email, code)
    _dispatch_code(email, code)
    return MessageResponse(message=f"Código de validación enviado a {email}")


@router.post("/verify-code", response_model=TokenResponse)
def verify_code(payload: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Valida el código de 6 dígitos. Si la cuenta no existe, la crea automáticamente."""
    email = payload.email.lower().strip()
    is_valid = auth_service.validate_verification_code(db, email, payload.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de validación incorrecto o expirado",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Crear cuenta automáticamente sin necesidad de registro previo
        default_name = email.split("@")[0].replace(".", " ").capitalize()
        user = User(
            full_name=default_name,
            email=email,
            hashed_password=auth_service.hash_password(secrets.token_urlsafe(24)),
            is_verified=True,
            role="user",
            perm_dashboard=True,
            perm_map=True,
            perm_compare=True,
            perm_analysis=True,
            perm_alerts=True,
            perm_rankings=True,
            perm_csv=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[AUTH-OTP] Nueva cuenta creada automáticamente por código: {email}")
    else:
        if not user.is_verified:
            user.is_verified = True
            db.commit()
            db.refresh(user)

    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Inicio de sesión con contraseña (ideal para administradores)."""
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not auth_service.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not user.is_verified:
        user.is_verified = True
        db.commit()
        db.refresh(user)
    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(auth_service.get_current_user)):
    return _to_user_response(user)

