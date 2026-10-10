from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sop import (
    SOP, SOPVersion, SOPChecklistStep, SOPAcknowledgment, SOPStatus, SOPCategory
)
from app.models.user import User, UserRole
from app.schemas.sop import (
    SOPCreate, SOPOut, SOPVersionCreate, SOPVersionOut,
    SOPAcknowledgmentCreate, SOPAcknowledgmentOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/sops", tags=["Standard Operating Procedures (SOP)"])

@router.get("", response_model=List[SOPOut])
def list_sops(
    category: Optional[SOPCategory] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SOP)
    if category:
        query = query.filter(SOP.category == category)
    return query.all()

@router.post("", response_model=SOPOut)
def create_sop(
    sop_in: SOPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.QUALITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to create SOPs")

    sop = SOP(
        code=sop_in.code,
        title=sop_in.title,
        category=sop_in.category,
        department=sop_in.department,
        description=sop_in.description,
        created_by_id=current_user.id
    )
    db.add(sop)
    db.flush()

    if sop_in.initial_version:
        ver = SOPVersion(
            sop_id=sop.id,
            version_number=sop_in.initial_version.version_number,
            content=sop_in.initial_version.content,
            change_summary=sop_in.initial_version.change_summary or "Initial version",
            status=SOPStatus.PUBLISHED,
            effective_date=datetime.utcnow(),
            approved_by_id=current_user.id,
            approved_at=datetime.utcnow()
        )
        db.add(ver)
        db.flush()

        for step in sop_in.initial_version.checklists:
            chk = SOPChecklistStep(
                version_id=ver.id,
                step_number=step.step_number,
                title=step.title,
                instruction=step.instruction,
                is_critical=step.is_critical
            )
            db.add(chk)

    db.commit()
    db.refresh(sop)
    return sop

@router.post("/{sop_id}/acknowledge", response_model=SOPAcknowledgmentOut)
def acknowledge_sop(
    sop_id: int,
    ack_in: SOPAcknowledgmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ack = SOPAcknowledgment(
        sop_id=sop_id,
        version_id=ack_in.version_id,
        employee_id=ack_in.employee_id,
        digital_signature=ack_in.digital_signature,
        acknowledged_at=datetime.utcnow()
    )
    db.add(ack)
    db.commit()
    db.refresh(ack)
    return ack
