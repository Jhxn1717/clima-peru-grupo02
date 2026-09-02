from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

# Secciones del sistema controladas por permisos por-usuario
SECTION_PERMISSIONS = [
    "dashboard",
    "map",
    "compare",
    "analysis",
    "alerts",
    "rankings",
    "csv",
]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String(20), default="user", nullable=False)  # 'admin' | 'user'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Permisos por sección (override del rol para cada usuario)
    perm_dashboard = Column(Boolean, default=True, nullable=False)
    perm_map = Column(Boolean, default=True, nullable=False)
    perm_compare = Column(Boolean, default=True, nullable=False)
    perm_analysis = Column(Boolean, default=True, nullable=False)
    perm_alerts = Column(Boolean, default=True, nullable=False)
    perm_rankings = Column(Boolean, default=True, nullable=False)
    perm_csv = Column(Boolean, default=True, nullable=False)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def has_permission(self, section: str) -> bool:
        if self.is_admin:
            return True
        return bool(getattr(self, f"perm_{section}", False))


class EmailVerificationCode(Base):
    __tablename__ = "email_verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
