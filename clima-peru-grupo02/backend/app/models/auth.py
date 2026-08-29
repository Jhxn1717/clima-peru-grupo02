"""
Modelos ORM para el sistema de autenticación y RBAC.
Tablas: permissions, roles, role_permissions, users, user_roles, audit_logs
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    ForeignKey, Table, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# ─── Tabla de unión Role ↔ Permission (many-to-many) ─────────────────────────
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

# ─── Tabla de unión User ↔ Role (many-to-many) ────────────────────────────────
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base):
    """Permiso atómico del sistema (ej. 'users:create', 'reports:delete')."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    # Etiqueta legible para la UI (ej. "Crear usuarios")
    display_name = Column(String(150), nullable=False)
    # Categoría de agrupación (ej. "usuarios", "reportes", "sistema")
    category = Column(String(80), nullable=False, default="general")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(Base):
    """Rol del sistema con un conjunto de permisos."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False, index=True)
    display_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    # Rol del sistema: no puede eliminarse (super_admin, admin, supervisor, user)
    is_system = Column(Boolean, default=False)
    # Solo 'super_admin' tiene este flag; omite validaciones de permiso
    is_super_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")


class User(Base):
    """Usuario registrado del sistema."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Avatar URL o iniciales (opcional)
    avatar_url = Column(String(500), nullable=True)

    # Token de recuperación de contraseña
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)

    # Bloqueo por intentos fallidos
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    # Metadatos de acceso
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    roles = relationship("Role", secondary=user_roles, back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    # ── Helpers ──────────────────────────────────────────────────────────────
    def has_permission(self, permission_name: str) -> bool:
        """Verifica si el usuario posee un permiso específico."""
        for role in self.roles:
            if role.is_super_admin:
                return True
            for perm in role.permissions:
                if perm.name == permission_name:
                    return True
        return False

    def has_any_permission(self, *permission_names: str) -> bool:
        return any(self.has_permission(p) for p in permission_names)

    def is_super_admin_user(self) -> bool:
        return any(r.is_super_admin for r in self.roles)

    def get_role_names(self) -> list[str]:
        return [r.name for r in self.roles]

    def get_all_permissions(self) -> set[str]:
        """Retorna el set de todos los nombres de permisos del usuario."""
        if self.is_super_admin_user():
            return {"*"}  # permiso wildcard para super admin
        perms: set[str] = set()
        for role in self.roles:
            for perm in role.permissions:
                perms.add(perm.name)
        return perms


class AuditLog(Base):
    """Registro de auditoría de eventos de seguridad y cambios."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    # Usuario que ejecutó la acción (None si fue sistema/anónimo)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)  # snapshot para historial
    user_name = Column(String(200), nullable=True)   # snapshot para historial

    # Tipo de acción (ej. "login", "logout", "user_created", "role_updated")
    action = Column(String(100), nullable=False, index=True)
    # Categoría de la acción (ej. "auth", "users", "roles", "permissions")
    category = Column(String(80), nullable=False, default="general")

    # Recurso afectado (ej. "user:42", "role:3")
    target_type = Column(String(80), nullable=True)
    target_id = Column(String(50), nullable=True)
    target_display = Column(String(255), nullable=True)

    # Detalles del cambio (JSON serializado)
    details = Column(Text, nullable=True)
    # Resultado de la acción
    status = Column(String(20), nullable=False, default="success")  # success | failure | warning

    # Datos de contexto
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="audit_logs")
