from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE
    organization_id: Optional[int] = None
    location_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    organization_id: Optional[int] = None
    location_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
