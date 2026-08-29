"""
Router del panel de administración: estadísticas globales del sistema.
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.auth import User, Role, Permission, AuditLog
from app.schemas.auth import (
    AdminDashboardResponse, UsersByRoleItem, ActivityItem,
)
from app.routers.auth_deps import require_any_admin

router = APIRouter(prefix="/admin/dashboard", tags=["Panel de Administración"])


@router.get("", response_model=AdminDashboardResponse)
async def get_dashboard(
    _: User = Depends(require_any_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    one_day_ago = now - timedelta(hours=24)

    # Conteos de usuarios
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    inactive_users = total_users - active_users
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0

    # Nuevos usuarios últimos 7 días
    new_users_last_7 = (
        db.query(func.count(User.id))
        .filter(User.created_at >= seven_days_ago)
        .scalar() or 0
    )

    # Usuarios por rol
    roles = db.query(Role).all()
    users_by_role: list[UsersByRoleItem] = []
    for role in roles:
        count = len(role.users)
        users_by_role.append(UsersByRoleItem(
            role_name=role.name,
            display_name=role.display_name,
            count=count,
        ))

    # Totales
    total_roles = db.query(func.count(Role.id)).scalar() or 0
    total_permissions = db.query(func.count(Permission.id)).scalar() or 0

    # Actividad reciente (últimas 20 entradas)
    recent_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
        .all()
    )
    recent_activity = [
        ActivityItem(
            id=log.id,
            user_name=log.user_name,
            user_email=log.user_email,
            action=log.action,
            category=log.category,
            status=log.status,
            created_at=log.created_at,
        )
        for log in recent_logs
    ]

    # Total de registros de auditoría
    total_audit = db.query(func.count(AuditLog.id)).scalar() or 0

    # Intentos de login fallidos en las últimas 24h
    failed_logins = (
        db.query(func.count(AuditLog.id))
        .filter(
            AuditLog.action == "login_failed",
            AuditLog.created_at >= one_day_ago,
        )
        .scalar() or 0
    )

    return AdminDashboardResponse(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        verified_users=verified_users,
        new_users_last_7_days=new_users_last_7,
        users_by_role=users_by_role,
        total_roles=total_roles,
        total_permissions=total_permissions,
        recent_activity=recent_activity,
        total_audit_logs=total_audit,
        failed_logins_last_24h=failed_logins,
    )
