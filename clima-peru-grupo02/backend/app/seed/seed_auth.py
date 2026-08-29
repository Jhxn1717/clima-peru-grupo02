"""
Seed de autenticación: roles, permisos y super administrador inicial.
Se ejecuta en el lifespan de la aplicación.
"""
from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.auth import Permission, Role, User
from app.services.auth_service import hash_password

# ─── Permisos del sistema ─────────────────────────────────────────────────────
PERMISSIONS_DATA = [
    # Usuarios
    {"name": "users:view",   "display_name": "Ver usuarios",     "category": "usuarios"},
    {"name": "users:create", "display_name": "Crear usuarios",   "category": "usuarios"},
    {"name": "users:edit",   "display_name": "Editar usuarios",  "category": "usuarios"},
    {"name": "users:delete", "display_name": "Eliminar usuarios","category": "usuarios"},
    # Reportes
    {"name": "reports:view",   "display_name": "Ver reportes",     "category": "reportes"},
    {"name": "reports:create", "display_name": "Crear reportes",   "category": "reportes"},
    {"name": "reports:edit",   "display_name": "Editar reportes",  "category": "reportes"},
    {"name": "reports:delete", "display_name": "Eliminar reportes","category": "reportes"},
    # Roles y permisos
    {"name": "roles:view",        "display_name": "Ver roles",            "category": "sistema"},
    {"name": "roles:manage",      "display_name": "Gestionar roles",      "category": "sistema"},
    {"name": "permissions:view",  "display_name": "Ver permisos",         "category": "sistema"},
    {"name": "permissions:manage","display_name": "Gestionar permisos",   "category": "sistema"},
    # Auditoría
    {"name": "audit:view",   "display_name": "Ver auditoría",    "category": "sistema"},
    # Sistema
    {"name": "system:config","display_name": "Configurar sistema","category": "sistema"},
]

# ─── Roles del sistema ────────────────────────────────────────────────────────
# Formato: (name, display_name, description, is_system, is_super_admin, perms[])
ROLES_DATA = [
    (
        "super_admin",
        "Super Administrador",
        "Acceso total al sistema. No puede eliminarse ni modificarse.",
        True, True,
        # Super admin ignora permisos, pero se le asignan todos por claridad
        [p["name"] for p in PERMISSIONS_DATA],
    ),
    (
        "admin",
        "Administrador",
        "Gestión completa de usuarios, roles y reportes.",
        True, False,
        [
            "users:view", "users:create", "users:edit", "users:delete",
            "reports:view", "reports:create", "reports:edit", "reports:delete",
            "roles:view", "roles:manage",
            "permissions:view",
            "audit:view",
        ],
    ),
    (
        "supervisor",
        "Supervisor",
        "Puede ver y editar usuarios y reportes, sin eliminar.",
        True, False,
        [
            "users:view", "users:edit",
            "reports:view", "reports:create", "reports:edit",
            "audit:view",
        ],
    ),
    (
        "user",
        "Usuario",
        "Acceso básico: solo visualización de reportes.",
        True, False,
        ["reports:view"],
    ),
]

# ─── Super administrador inicial ──────────────────────────────────────────────
SUPER_ADMIN_EMAIL = "superadmin@meteoperu.com"
SUPER_ADMIN_PASSWORD = "Admin1234!"
SUPER_ADMIN_NAME = "Super Administrador"


def seed_auth(db: Session) -> None:
    """Siembra roles, permisos y super admin si no existen."""

    # 1. Crear/obtener permisos
    perm_map: dict[str, Permission] = {}
    for p_data in PERMISSIONS_DATA:
        perm = db.query(Permission).filter(Permission.name == p_data["name"]).first()
        if not perm:
            perm = Permission(
                name=p_data["name"],
                display_name=p_data["display_name"],
                category=p_data["category"],
            )
            db.add(perm)
            db.flush()
        perm_map[perm.name] = perm

    # 2. Crear/obtener roles con sus permisos
    role_map: dict[str, Role] = {}
    for r_name, r_display, r_desc, r_system, r_super, r_perms in ROLES_DATA:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(
                name=r_name,
                display_name=r_display,
                description=r_desc,
                is_system=r_system,
                is_super_admin=r_super,
            )
            db.add(role)
            db.flush()

        # Asignar permisos
        role.permissions = [perm_map[n] for n in r_perms if n in perm_map]
        role_map[r_name] = role

    db.commit()

    # 3. Crear super administrador inicial si no existe
    existing = db.query(User).filter(User.email == SUPER_ADMIN_EMAIL).first()
    if not existing:
        super_admin = User(
            full_name=SUPER_ADMIN_NAME,
            email=SUPER_ADMIN_EMAIL,
            hashed_password=hash_password(SUPER_ADMIN_PASSWORD),
            is_active=True,
            is_verified=True,
        )
        if "super_admin" in role_map:
            super_admin.roles = [role_map["super_admin"]]
        db.add(super_admin)
        db.commit()
        print(
            f"✔ Super Admin creado: {SUPER_ADMIN_EMAIL} / {SUPER_ADMIN_PASSWORD} "
            "(cambia esta contraseña en producción)"
        )
    else:
        print("✔ Auth seed: roles y permisos verificados.")
