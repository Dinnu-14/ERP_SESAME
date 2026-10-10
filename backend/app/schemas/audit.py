from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.audit import NotificationType

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    location_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
