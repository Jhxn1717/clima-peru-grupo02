from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResendCodeRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_verified: bool
    role: str
    perm_dashboard: bool = True
    perm_map: bool = True
    perm_compare: bool = True
    perm_analysis: bool = True
    perm_alerts: bool = True
    perm_rankings: bool = True
    perm_csv: bool = True

    model_config = {"from_attributes": True}


class UpdateUserRoleRequest(BaseModel):
    role: str


class UpdateUserPermissionsRequest(BaseModel):
    perm_dashboard: bool
    perm_map: bool
    perm_compare: bool
    perm_analysis: bool
    perm_alerts: bool
    perm_rankings: bool
    perm_csv: bool
    role: str | None = None


class UpdateUserProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str | None = Field(default=None, min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
