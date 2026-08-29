"""
Dependencias FastAPI para autenticación y autorización RBAC.
Importar en cualquier router que necesite protección.
"""
from __future__ import annotations
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth import User
from app.services.auth_service import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def _get_token_data(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado. Inicia sesión para continuar.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_user(
    token: str = Depends(_get_token_data),
    db: Session = Depends(get_db),
) -> User:
    """Retorna el usuario autenticado a partir del JWT. 401 si inválido."""
    token_data = decode_access_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está desactivada.",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_permission(permission_name: str):
    """
    Dependencia de fábrica: exige que el usuario tenga el permiso dado.
    Uso: Depends(require_permission("users:create"))
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: '{permission_name}'.",
            )
        return current_user
    return _check


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_super_admin_user():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Super Administrador.",
        )
    return current_user


def require_any_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Permite acceso a super_admin o admin."""
    role_names = current_user.get_role_names()
    if not any(r in role_names for r in ("super_admin", "admin")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Administrador o superior.",
        )
    return current_user


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def get_user_agent(request: Request) -> str:
    return request.headers.get("User-Agent", "")
