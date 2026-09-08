import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User, EmailVerificationCode
from app.services.auth_service import hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_users():
    # Limpia usuarios y códigos creados por tests de auth
    db = SessionLocal()
    try:
        for user in db.query(User).filter(User.email.like("test%@example.com")).all():
            db.delete(user)
        for rec in db.query(EmailVerificationCode).filter(EmailVerificationCode.email.like("test%@example.com")).all():
            db.delete(rec)
        db.commit()
    finally:
        db.close()
    yield


@patch("app.routers.auth.send_verification_code")
@patch("app.routers.auth.auth_service.generate_verification_code", return_value="654321")
def test_full_otp_verify_login_flow(mock_code, mock_send):
    email = "test@example.com"
    code = "654321"

    # 1. Enviar código -> 200
    r = client.post("/api/auth/send-code", json={"email": email})
    assert r.status_code == 200

    # 2. Verificar código inexistente -> 400
    r = client.post("/api/auth/verify-code", json={"email": email, "code": "000000"})
    assert r.status_code == 400

    # 3. Verificar código correcto -> 200, crea cuenta automáticamente
    r = client.post("/api/auth/verify-code", json={"email": email, "code": code})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["is_verified"] is True
    assert data["user"]["email"] == email
    assert data["access_token"]

    token = data["access_token"]

    # 4. /me con token -> 200
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email

    # 5. /me sin token -> 401
    r = client.get("/api/auth/me")
    assert r.status_code == 401

    # 6. Código ya usado (marcado) -> no se puede reutilizar
    r = client.post("/api/auth/verify-code", json={"email": email, "code": code})
    assert r.status_code == 400


def test_login_with_password():
    email = "testlogin@example.com"
    password = "secreto123"
    db = SessionLocal()
    try:
        db.add(User(
            full_name="Test Login",
            email=email,
            hashed_password=hash_password(password),
            is_verified=True,
            role="user",
        ))
        db.commit()
    finally:
        db.close()

    # Login correcto -> 200
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    assert r.json()["access_token"]
    assert r.json()["user"]["email"] == email

    # Contraseña incorrecta -> 401
    r = client.post("/api/auth/login", json={"email": email, "password": "incorrecta"})
    assert r.status_code == 401

    # Usuario inexistente -> 401
    r = client.post("/api/auth/login", json={"email": "nadie@example.com", "password": password})
    assert r.status_code == 401


def test_send_code_validation_errors():
    # Email inválido -> 422
    r = client.post("/api/auth/send-code", json={"email": "noesunemail"})
    assert r.status_code == 422

    # Código con formato inválido -> 422
    r = client.post("/api/auth/verify-code", json={"email": "test@example.com", "code": "12"})
    assert r.status_code == 422