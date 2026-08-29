"""
Router de gestión de roles y permisos (panel de administración).
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auth import Role, Permission, User
from app.schemas.auth import (
    RoleCreate, RoleUpdate, RoleResponse,
    PermissionCreate, PermissionResponse,
    MessageResponse,
)
from app.services.audit_service import AuditService
from app.routers.auth_deps import (
    require_permission, require_super_admin, get_client_ip,
)

router = APIRouter(tags=["Roles y Permisos"])

# ═══════════════════════════════════════════════════════════════════════════════
# ROLES
# ═══════════════════════════════════════════════════════════════════════════════

roles_router = APIRouter(prefix="/admin/roles")
perms_router = APIRouter(prefix="/admin/permissions")


@roles_router.get("", response_model=list[RoleResponse])
async def list_roles(
    _: User = Depends(require_permission("roles:view")),
    db: Session = Depends(get_db),
):
    roles = db.query(Role).order_by(Role.id).all()
    result = []
    for role in roles:
        count = len(role.users)
        r = RoleResponse.model_validate(role)
        r.user_count = count
        result.append(r)
    return result


@roles_router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    request: Request,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db),
):
    existing = db.query(Role).filter(Role.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un rol con el nombre '{payload.name}'.",
        )
    permissions = (
        db.query(Permission).filter(Permission.id.in_(payload.permission_ids)).all()
        if payload.permission_ids else []
    )
    role = Role(
        name=payload.name,
        display_name=payload.display_name,
        description=payload.description,
        is_system=False,
    )
    role.permissions = permissions
    db.add(role)
    db.commit()
    db.refresh(role)

    AuditService.log_role_created(
        db, role_name=role.name, role_id=role.id,
        created_by=current_user, ip_address=get_client_ip(request),
    )
    return RoleResponse.model_validate(role)


@roles_router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    _: User = Depends(require_permission("roles:view")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado.")
    r = RoleResponse.model_validate(role)
    r.user_count = len(role.users)
    return r


@roles_router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    payload: RoleUpdate,
    request: Request,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado.")
    if role.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El rol Super Administrador no puede modificarse.",
        )

    changes: dict = {}
    if payload.display_name is not None and payload.display_name != role.display_name:
        changes["display_name"] = {"from": role.display_name, "to": payload.display_name}
        role.display_name = payload.display_name
    if payload.description is not None and payload.description != role.description:
        changes["description"] = payload.description
        role.description = payload.description
    if payload.permission_ids is not None:
        old_perms = [p.name for p in role.permissions]
        new_permissions = db.query(Permission).filter(
            Permission.id.in_(payload.permission_ids)
        ).all()
        role.permissions = new_permissions
        new_perms = [p.name for p in new_permissions]
        added = list(set(new_perms) - set(old_perms))
        removed = list(set(old_perms) - set(new_perms))
        if added or removed:
            changes["permissions"] = {"added": added, "removed": removed}
            AuditService.log_permissions_updated(
                db, role_name=role.name, role_id=role.id,
                updated_by=current_user,
                added=added, removed=removed,
                ip_address=get_client_ip(request),
            )

    db.commit()
    db.refresh(role)
    if changes:
        AuditService.log_role_updated(
            db, role_name=role.name, role_id=role.id,
            updated_by=current_user, changes=changes,
            ip_address=get_client_ip(request),
        )
    r = RoleResponse.model_validate(role)
    r.user_count = len(role.users)
    return r


@roles_router.delete("/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: int,
    request: Request,
    current_user: User = Depends(require_permission("roles:manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado.")
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los roles del sistema no pueden eliminarse.",
        )

    AuditService.log_role_deleted(
        db, role_name=role.name, role_id=role.id,
        deleted_by=current_user, ip_address=get_client_ip(request),
    )
    db.delete(role)
    db.commit()
    return MessageResponse(message=f"Rol '{role.name}' eliminado correctamente.")


# ═══════════════════════════════════════════════════════════════════════════════
# PERMISSIONS
# ═══════════════════════════════════════════════════════════════════════════════

@perms_router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    _: User = Depends(require_permission("permissions:view")),
    db: Session = Depends(get_db),
):
    return db.query(Permission).order_by(Permission.category, Permission.name).all()


@perms_router.post("", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    payload: PermissionCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    existing = db.query(Permission).filter(Permission.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un permiso con el nombre '{payload.name}'.",
        )
    perm = Permission(**payload.model_dump())
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


# Incluir ambos sub-routers en uno exportable
router.include_router(roles_router)
router.include_router(perms_router)
