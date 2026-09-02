from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
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
        print(f"\n[EMAIL-FALLBACK] Código de verificación para {email}: {code}\n")
        print(f"[EMAIL-ERROR] {exc}")


def _to_user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


def _build_token_response(user: User) -> TokenResponse:
    token = auth_service.create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=_to_user_response(user))


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta registrada con este correo",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=auth_service.hash_password(payload.password),
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Opcional: Generar código de verificación si hay SMTP disponible
    try:
        code = auth_service.generate_verification_code()
        auth_service.store_verification_code(db, normalized_email, code)
        _dispatch_code(normalized_email, code)
    except Exception:
        pass

    return MessageResponse(message="Registro exitoso. Tu cuenta ha sido creada y verificada.")


@router.post("/verify", response_model=TokenResponse)
def verify_email(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada. Regístrate primero.")

    user.is_verified = True
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


@router.post("/resend", response_model=MessageResponse)
def resend_code(payload: ResendCodeRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada.")

    code = auth_service.generate_verification_code()
    auth_service.store_verification_code(db, email, code)
    _dispatch_code(email, code)
    return MessageResponse(message="Se reenvió un nuevo código a tu correo.")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
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
