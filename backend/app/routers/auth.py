import base64
import json
import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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
async def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Inicia sesión con Google. Si el usuario no existe, se crea automáticamente."""
    email = None
    full_name = None

    if payload.credential:
        # Intentar validar el token con Google
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}"
                )
                if res.status_code == 200:
                    data = res.json()
                    email = data.get("email")
                    full_name = data.get("name")
        except Exception as e:
            print(f"Aviso Google tokeninfo: {e}")

        # Fallback: decodificar payload JWT de Google directamente
        if not email:
            try:
                parts = payload.credential.split(".")
                if len(parts) >= 2:
                    padding = "=" * (4 - len(parts[1]) % 4)
                    decoded_bytes = base64.urlsafe_b64decode(parts[1] + padding)
                    data = json.loads(decoded_bytes.decode("utf-8"))
                    email = data.get("email")
                    full_name = data.get("name")
            except Exception as e:
                print(f"Aviso decodificando JWT Google: {e}")

    # Fallback si se pasaron email y nombre explícitos
    if not email and payload.email:
        email = payload.email
        full_name = payload.name

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener la identidad de la cuenta de Google",
        )

    normalized_email = email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        # Crear cuenta automáticamente
        display_name = full_name.strip() if full_name else normalized_email.split("@")[0].capitalize()
        user = User(
            full_name=display_name,
            email=normalized_email,
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
        if not user.is_verified:
            user.is_verified = True
            db.commit()
            db.refresh(user)

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

