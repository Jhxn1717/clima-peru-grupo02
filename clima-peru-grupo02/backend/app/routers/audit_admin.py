"""
Router de auditoría: consulta paginada del historial de eventos.
"""
from __future__ import annotations
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.auth import AuditLog, User
from app.schemas.auth import AuditLogListResponse, AuditLogResponse
from app.routers.auth_deps import require_permission

router = APIRouter(prefix="/admin/audit", tags=["Auditoría"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = Query(None, description="Buscar por usuario o acción"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    _: User = Depends(require_permission("audit:view")),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                AuditLog.user_email.ilike(term),
                AuditLog.user_name.ilike(term),
                AuditLog.action.ilike(term),
                AuditLog.target_display.ilike(term),
            )
        )
    if category:
        q = q.filter(AuditLog.category == category)
    if status:
        q = q.filter(AuditLog.status == status)
    if action:
        q = q.filter(AuditLog.action == action)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)

    total = q.count()
    total_pages = max(1, math.ceil(total / page_size))
    logs = (
        q.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
