from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditLog, Notification
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut, NotificationOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs & Notifications"])

@router.get("/logs", response_model=List[AuditLogOut])
def list_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id.is_(None))
    ).order_by(Notification.created_at.desc()).limit(50).all()

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}
