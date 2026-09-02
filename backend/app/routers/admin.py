from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, EmailVerificationCode
from app.schemas.auth import (
    UserResponse,
    UpdateUserRoleRequest,
    UpdateUserPermissionsRequest,
    UpdateUserProfileRequest,
    MessageResponse,
)
from app.services.auth_service import require_admin, hash_password

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Rol inválido. Use 'admin' o 'user'.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Evitar que un admin se autodegrade y quede el sistema sin admin
    if target.id == current_admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="No puedes cambiar tu propio rol de administrador.",
        )

    target.role = payload.role
    db.commit()
    db.refresh(target)
    return UserResponse.model_validate(target)


@router.patch("/users/{user_id}/permissions", response_model=UserResponse)
def update_user_permissions(
    user_id: int,
    payload: UpdateUserPermissionsRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Un admin siempre conserva acceso total; solo editar permisos a no-admin
    if target.is_admin:
        target.role = "admin" if target.is_admin else "user"
        db.commit()
        db.refresh(target)
        return UserResponse.model_validate(target)

    target.perm_dashboard = payload.perm_dashboard
    target.perm_map = payload.perm_map
    target.perm_compare = payload.perm_compare
    target.perm_analysis = payload.perm_analysis
    target.perm_alerts = payload.perm_alerts
    target.perm_rankings = payload.perm_rankings
    target.perm_csv = payload.perm_csv

    if payload.role in ("admin", "user"):
        # Promover a admin: concede todo; degradar un admin ya no es posible aquí
        target.role = payload.role

    db.commit()
    db.refresh(target)
    return UserResponse.model_validate(target)


@router.patch("/users/{user_id}/profile", response_model=UserResponse)
def update_user_profile(
    user_id: int,
    payload: UpdateUserProfileRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Email único: impedir duplicados con otro usuario
    if payload.email.lower() != target.email.lower():
        exists = (
            db.query(User)
            .filter(User.email.ilike(payload.email), User.id != target.id)
            .first()
        )
        if exists:
            raise HTTPException(
                status_code=400, detail="Ya existe un usuario con ese correo."
            )
        # Al cambiar el email, el usuario debe volver a verificar su cuenta
        target.email = payload.email
        target.is_verified = False

    target.full_name = payload.full_name

    # Si se provee una nueva contraseña, hashearla y guardarla
    if payload.password:
        target.hashed_password = hash_password(payload.password)

    db.commit()
    db.refresh(target)
    return UserResponse.model_validate(target)


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # No permitir eliminarse a sí mismo
    if target.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de administrador.",
        )

    # No permitir eliminar el último admin (evitar sistema sin administradores)
    if target.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="No se puede eliminar al último administrador del sistema.",
            )

    # Limpiar registros asociados (códigos de verificación por email)
    db.query(EmailVerificationCode).filter(
        EmailVerificationCode.email == target.email
    ).delete(synchronize_session=False)

    db.delete(target)
    db.commit()
    return MessageResponse(message="Usuario eliminado correctamente.")
