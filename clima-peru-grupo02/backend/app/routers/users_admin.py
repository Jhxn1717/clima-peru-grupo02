"""
Router de gestión de usuarios (panel de administración).
Requiere permisos RBAC para cada operación.
"""
from __future__ import annotations
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.auth import User, Role
from app.schemas.auth import (
    UserCreate, UserUpdate, UserResponse,
    UserSummary, UserListResponse, MessageResponse,
)
from app.services.auth_service import AuthService, hash_password
from app.services.audit_service import AuditService
from app.routers.auth_deps import (
    get_current_active_user,
    require_permission,
    get_client_ip,
)

router = APIRouter(prefix="/admin/users", tags=["Gestión de Usuarios"])


def _build_summary(user: User) -> UserSummary:
    return UserSummary(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_active=user.is_active,
        is_verified=user.is_verified,
        last_login=user.last_login,
        created_at=user.created_at,
        roles=user.roles,
    )


# ─── Listar usuarios ──────────────────────────────────────────────────────────
@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    search: Optional[str] = Query(None),
    role_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    _: User = Depends(require_permission("users:view")),
    db: Session = Depends(get_db),
):
    q = db.query(User)

    if search:
        term = f"%{search}%"
        q = q.filter(or_(User.full_name.ilike(term), User.email.ilike(term)))

    if is_active is not None:
        q = q.filter(User.is_active == is_active)

    if role_id:
        q = q.join(User.roles).filter(Role.id == role_id)

    total = q.count()
    total_pages = max(1, math.ceil(total / page_size))
    users = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return UserListResponse(
        items=[_build_summary(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ─── Crear usuario ────────────────────────────────────────────────────────────
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(require_permission("users:create")),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta con ese correo.",
        )

    roles = db.query(Role).filter(Role.id.in_(payload.role_ids)).all() if payload.role_ids else []
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=payload.is_active,
        is_verified=True,
    )
    new_user.roles = roles
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log_user_created(
        db, new_user=new_user, created_by=current_user,
        ip_address=get_client_ip(request),
    )
    return AuthService.build_user_response(new_user)


# ─── Obtener usuario por ID ───────────────────────────────────────────────────
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    _: User = Depends(require_permission("users:view")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return AuthService.build_user_response(user)


# ─── Actualizar usuario ───────────────────────────────────────────────────────
@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(require_permission("users:edit")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    changes: dict = {}

    if payload.full_name is not None and payload.full_name != user.full_name:
        changes["full_name"] = {"from": user.full_name, "to": payload.full_name}
        user.full_name = payload.full_name

    if payload.email is not None and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing and existing.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ese correo ya está en uso.",
            )
        changes["email"] = {"from": user.email, "to": payload.email}
        user.email = payload.email

    if payload.is_active is not None and payload.is_active != user.is_active:
        changes["is_active"] = {"from": user.is_active, "to": payload.is_active}
        user.is_active = payload.is_active

    if payload.role_ids is not None:
        old_roles = user.get_role_names()
        roles = db.query(Role).filter(Role.id.in_(payload.role_ids)).all()
        user.roles = roles
        new_roles = user.get_role_names()
        if set(old_roles) != set(new_roles):
            changes["roles"] = {"from": old_roles, "to": new_roles}

    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(user)

    if changes:
        AuditService.log_user_updated(
            db, target_user=user, updated_by=current_user,
            changes=changes, ip_address=get_client_ip(request),
        )
    return AuthService.build_user_response(user)


# ─── Activar / desactivar usuario ────────────────────────────────────────────
@router.patch("/{user_id}/toggle-status", response_model=MessageResponse)
async def toggle_user_status(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_permission("users:edit")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta.",
        )

    user.is_active = not user.is_active
    db.commit()
    AuditService.log_user_status_changed(
        db, target_user=user, changed_by=current_user,
        new_status=user.is_active, ip_address=get_client_ip(request),
    )
    state = "activado" if user.is_active else "desactivado"
    return MessageResponse(message=f"Usuario {state} correctamente.")


# ─── Eliminar usuario ─────────────────────────────────────────────────────────
@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_permission("users:delete")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta.",
        )

    AuditService.log_user_deleted(
        db, target_user=user, deleted_by=current_user,
        ip_address=get_client_ip(request),
    )
    db.delete(user)
    db.commit()
    return MessageResponse(message="Usuario eliminado correctamente.")


# ─── Asignar roles ────────────────────────────────────────────────────────────
@router.post("/{user_id}/roles", response_model=UserResponse)
async def assign_roles(
    user_id: int,
    role_ids: list[int],
    request: Request,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    user.roles = roles
    db.commit()
    db.refresh(user)

    AuditService.log_role_assigned(
        db, target_user=user,
        role_names=user.get_role_names(),
        assigned_by=current_user,
        ip_address=get_client_ip(request),
    )
    return AuthService.build_user_response(user)
