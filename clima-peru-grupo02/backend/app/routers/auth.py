"""
Router de autenticación: registro, login, logout, recuperación de contraseña,
perfil del usuario autenticado.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    LoginRequest, RegisterRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    TokenResponse, UserResponse, MessageResponse,
    UserUpdate, UserChangePassword,
)
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.routers.auth_deps import (
    get_current_active_user, get_client_ip, get_user_agent,
)
from app.models.auth import User

router = APIRouter(prefix="/auth", tags=["Autenticación"])


# ─── Registro ─────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        user = AuthService.register(payload, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    ip = get_client_ip(request)
    AuditService.log_register(db, new_user=user, ip_address=ip)

    from app.services.auth_service import _build_token_response
    return _build_token_response(user)


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    ua = get_user_agent(request)
    try:
        token_response, user = AuthService.login(payload, db, ip_address=ip)
    except ValueError as e:
        AuditService.log_login_failed(
            db, email=payload.email,
            reason=str(e), ip_address=ip, user_agent=ua,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    AuditService.log_login(db, user=user, ip_address=ip, user_agent=ua)
    return token_response


# ─── Logout (registro de auditoría) ──────────────────────────────────────────
@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    AuditService.log_logout(db, user=current_user, ip_address=ip)
    return MessageResponse(message="Sesión cerrada correctamente.")


# ─── Perfil propio ────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    return AuthService.build_user_response(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    changes: dict = {}
    if payload.full_name is not None and payload.full_name != current_user.full_name:
        changes["full_name"] = {"from": current_user.full_name, "to": payload.full_name}
        current_user.full_name = payload.full_name
    if payload.email is not None and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ese correo ya está en uso.",
            )
        changes["email"] = {"from": current_user.email, "to": payload.email}
        current_user.email = payload.email
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    if changes:
        db.commit()
        db.refresh(current_user)
        AuditService.log_user_updated(
            db, target_user=current_user,
            updated_by=current_user, changes=changes,
            ip_address=get_client_ip(request),
        )
    return AuthService.build_user_response(current_user)


# ─── Cambio de contraseña ─────────────────────────────────────────────────────
@router.post("/me/change-password", response_model=MessageResponse)
async def change_password(
    payload: UserChangePassword,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        AuthService.change_password(
            current_user, payload.current_password, payload.new_password, db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    AuditService.log_password_changed(
        db, user=current_user,
        ip_address=get_client_ip(request),
    )
    return MessageResponse(message="Contraseña actualizada correctamente.")


# ─── Recuperación de contraseña ───────────────────────────────────────────────
@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    token = AuthService.request_password_reset(payload.email, db)
    ip = get_client_ip(request)
    AuditService.log_password_reset_requested(db, email=payload.email, ip_address=ip)

    # En producción se enviaría por email. Para desarrollo devolvemos el token.
    if token:
        return MessageResponse(
            message=f"Enlace de recuperación generado. Token (solo dev): {token}"
        )
    # Respuesta neutral para no revelar si el email existe
    return MessageResponse(
        message="Si ese correo existe, recibirás las instrucciones de recuperación."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    success = AuthService.reset_password(payload.token, payload.new_password, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado.",
        )
    return MessageResponse(message="Contraseña restablecida correctamente. Ya puedes iniciar sesión.")
