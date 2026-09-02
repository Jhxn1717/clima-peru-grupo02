import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User, EmailVerificationCode

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
def test_full_register_verify_login_flow(mock_send):
    email = "test@example.com"
    name = "Usuario Test"
    password = "secreto123"

    # 1. Registro -> envía código
    r = client.post("/api/auth/register", json={"full_name": name, "email": email, "password": password})
    assert r.status_code == 201
    mock_send.assert_called_once()
    sent_code = mock_send.call_args.args[1]

    # 2. Login antes de verificar -> prohibido
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 403

    # 3. Verificar con código incorrecto -> 400
    r = client.post("/api/auth/verify", json={"email": email, "code": "000000"})
    assert r.status_code == 400

    # 4. Verificar con código correcto -> token + usuario verificado
    r = client.post("/api/auth/verify", json={"email": email, "code": sent_code})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["is_verified"] is True
    assert data["user"]["email"] == email
    assert data["access_token"]

    token = data["access_token"]

    # 5. /me con token -> 200
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email

    # 6. /me sin token -> 401
    r = client.get("/api/auth/me")
    assert r.status_code == 401

    # 7. Login ahora sí funciona
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    assert r.json()["access_token"]

    # 8. Login con contraseña incorrecta -> 401
    r = client.post("/api/auth/login", json={"email": email, "password": "incorrecta"})
    assert r.status_code == 401


def test_register_duplicate_email():
    payload = {"full_name": "Usuario Test", "email": "testdupe@example.com", "password": "secreto123"}
    with patch("app.routers.auth.send_verification_code"):
        r1 = client.post("/api/auth/register", json=payload)
        assert r1.status_code == 201
        r2 = client.post("/api/auth/register", json=payload)
        assert r2.status_code == 409


def test_register_validation_errors():
    r = client.post("/api/auth/register", json={"full_name": "", "email": "noesunemail", "password": "123"})
    assert r.status_code == 422
