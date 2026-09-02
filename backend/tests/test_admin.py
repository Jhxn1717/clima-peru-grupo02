import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.services import auth_service

client = TestClient(app)

ADMIN_EMAIL = "arnoz1234@gmail.com"
ADMIN_PASSWORD = "clima12345"


def _login(email, password):
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    u = db.query(User).filter(User.email == email).first()
    db.close()
    if not u or not auth_service.verify_password(password, u.hashed_password):
        return None
    return auth_service.create_access_token(u.id, u.email)


@pytest.fixture()
def admin_token():
    # Asegurar que el admin existe y marcar role admin
    db = SessionLocal()
    u = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if u:
        u.role = "admin"
        u.is_verified = True
        db.commit()
        uid = u.id
    db.close()
    if not u:
        # Crear admin de prueba
        u = User(full_name="Admin", email=ADMIN_EMAIL, hashed_password=auth_service.hash_password(ADMIN_PASSWORD), is_verified=True, role="admin")
        db = SessionLocal()
        db.add(u)
        db.commit()
        db.refresh(u)
        uid = u.id
        db.close()
    return auth_service.create_access_token(uid, ADMIN_EMAIL)


@pytest.fixture()
def normal_user():
    email = "normal@example.com"
    db = SessionLocal()
    u = User(full_name="Normal", email=email, hashed_password=auth_service.hash_password("secreto123"), is_verified=True, role="user")
    db.add(u)
    db.commit()
    db.refresh(u)
    uid = u.id
    db.close()
    yield uid
    db = SessionLocal()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


def test_admin_list_users(admin_token):
    r = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(u["email"] == ADMIN_EMAIL for u in data)


def test_admin_change_role(admin_token, normal_user):
    r = client.patch(
        f"/api/admin/users/{normal_user}/role",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "admin"
    # revertir
    client.patch(
        f"/api/admin/users/{normal_user}/role",
        json={"role": "user"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )


def test_admin_toggle_permissions(admin_token, normal_user):
    r = client.patch(
        f"/api/admin/users/{normal_user}/permissions",
        json={"perm_dashboard": True, "perm_map": False, "perm_compare": True,
              "perm_analysis": True, "perm_alerts": True, "perm_rankings": True, "perm_csv": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["perm_map"] is False
    assert body["perm_csv"] is False
    assert body["perm_dashboard"] is True


def test_admin_cannot_degrade_self(admin_token):
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    uid = admin_user.id
    db.close()
    r = client.patch(
        f"/api/admin/users/{uid}/role",
        json={"role": "user"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 400


def test_non_admin_forbidden(admin_token, normal_user):
    # token de usuario normal
    token = auth_service.create_access_token(normal_user, "normal@example.com")
    r = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403

    r = client.patch(
        f"/api/admin/users/{normal_user}/permissions",
        json={"perm_dashboard": True, "perm_map": True, "perm_compare": True,
              "perm_analysis": True, "perm_alerts": True, "perm_rankings": True, "perm_csv": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_admin_requires_auth():
    r = client.get("/api/admin/users")
    assert r.status_code == 401
