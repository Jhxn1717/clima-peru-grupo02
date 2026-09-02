import hashlib
import hmac
import random
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, EmailVerificationCode

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int, email: str) -> str:
    expires = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expires}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )
    return user


def generate_verification_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def _hash_code_hmac(code: str) -> str:
    digest = hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), code.encode("utf-8"), hashlib.sha256)
    return digest.hexdigest()


def store_verification_code(db: Session, email: str, code: str) -> EmailVerificationCode:
    # Invalidar códigos previos sin usar del mismo correo
    db.query(EmailVerificationCode).filter(
        EmailVerificationCode.email == email,
        EmailVerificationCode.used == False,  # noqa: E712
    ).update({"used": True})
    expires_at = datetime.now(tz=timezone.utc) + timedelta(
        minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES
    )
    record = EmailVerificationCode(
        email=email,
        code_hash=_hash_code_hmac(code),
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def validate_verification_code(db: Session, email: str, code: str) -> bool:
    """Valida el código más reciente activo para el correo y lo marca como usado."""
    record = (
        db.query(EmailVerificationCode)
        .filter(
            EmailVerificationCode.email == email,
            EmailVerificationCode.used == False,  # noqa: E712
        )
        .order_by(EmailVerificationCode.created_at.desc())
        .first()
    )
    if not record:
        return False
    now = datetime.now(tz=timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        return False
    if not hmac.compare_digest(_hash_code_hmac(code), record.code_hash):
        return False
    record.used = True
    db.commit()
    return True


def new_secret_key() -> str:
    return secrets.token_urlsafe(48)
