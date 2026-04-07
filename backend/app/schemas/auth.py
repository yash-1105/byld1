import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.db.enums import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    avatar_key: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshRequest(BaseModel):
    refresh_token: str
