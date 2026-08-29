"""
Schemas Pydantic para autenticación y RBAC.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _strong_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("La contraseña debe contener al menos una mayúscula.")
    if not re.search(r"[0-9]", v):
        raise ValueError("La contraseña debe contener al menos un número.")
    return v


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH  ────────────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {"str_strip_whitespace": True}


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

    model_config = {"str_strip_whitespace": True}

    @field_validator("full_name")
    @classmethod
    def name_min_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    model_config = {"str_strip_whitespace": True}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos


class TokenData(BaseModel):
    user_id: int
    email: str
    roles: List[str] = []


# ═══════════════════════════════════════════════════════════════════════════════
# PERMISSIONS  ─────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class PermissionBase(BaseModel):
    name: str
    display_name: str
    category: str = "general"
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════════════
# ROLES  ───────────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    id: int
    is_system: bool
    is_super_admin: bool
    permissions: List[PermissionResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_count: Optional[int] = None

    model_config = {"from_attributes": True}


class RoleSimple(BaseModel):
    """Versión compacta del rol para embeber en respuestas de usuario."""
    id: int
    name: str
    display_name: str
    is_super_admin: bool

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════════════════════
# USERS  ───────────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class UserBase(BaseModel):
    full_name: str
    email: EmailStr

    model_config = {"str_strip_whitespace": True}


class UserCreate(UserBase):
    """Solo para admins creando usuarios manualmente."""
    password: str
    role_ids: List[int] = []
    is_active: bool = True

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)


class UserUpdate(BaseModel):
    """Actualización parcial de un usuario."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None
    avatar_url: Optional[str] = None

    model_config = {"str_strip_whitespace": True}


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)

    @model_validator(mode="after")
    def passwords_match(self) -> "UserChangePassword":
        if self.new_password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    last_login_ip: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    roles: List[RoleSimple] = []
    permissions: List[str] = []  # nombres de permisos aplanados

    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    """Versión compacta para listados."""
    id: int
    full_name: str
    email: str
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    roles: List[RoleSimple] = []

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: List[UserSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOG  ───────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    category: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    target_display: Optional[str] = None
    details: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN DASHBOARD  ─────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class UsersByRoleItem(BaseModel):
    role_name: str
    display_name: str
    count: int


class ActivityItem(BaseModel):
    id: int
    user_name: Optional[str]
    user_email: Optional[str]
    action: str
    category: str
    status: str
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    new_users_last_7_days: int
    users_by_role: List[UsersByRoleItem]
    total_roles: int
    total_permissions: int
    recent_activity: List[ActivityItem]
    total_audit_logs: int
    failed_logins_last_24h: int


# ─── Respuestas genéricas ─────────────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
    success: bool = True
