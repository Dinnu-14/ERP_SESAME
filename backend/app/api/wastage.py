from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.wastage import WastageRecord, WastageStatus, WastageType
from app.models.inventory import MovementType
from app.models.user import User, UserRole
from app.schemas.wastage import WastageCreate, WastageOut
from app.services.inventory_service import update_stock
from app.api.deps import get_current_user

router = APIRouter(prefix="/wastage", tags=["Wastage & Loss Management"])

@router.get("", response_model=List[WastageOut])
def list_wastage(
    location_id: Optional[int] = None,
    status: Optional[WastageStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WastageRecord)
    if location_id:
        query = query.filter(WastageRecord.location_id == location_id)
    if status:
        query = query.filter(WastageRecord.status == status)
    return query.order_by(WastageRecord.date.desc()).all()

@router.post("", response_model=WastageOut)
def record_wastage(
    waste_in: WastageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    waste_num = f"WST-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    waste = WastageRecord(
        waste_number=waste_num,
        location_id=waste_in.location_id,
        product_id=waste_in.product_id,
        batch_id=waste_in.batch_id,
        quantity=waste_in.quantity,
        wastage_type=waste_in.wastage_type,
        estimated_cost=waste_in.estimated_cost,
        reason=waste_in.reason,
        disposal_method=waste_in.disposal_method,
        is_recoverable=waste_in.is_recoverable,
        status=WastageStatus.PENDING,
        recorded_by_id=current_user.id
    )
    db.add(waste)
    db.commit()
    db.refresh(waste)
    return waste

@router.post("/{waste_id}/approve", response_model=WastageOut)
def approve_wastage(
    waste_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER, UserRole.QUALITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to approve wastage")

    waste = db.query(WastageRecord).filter(WastageRecord.id == waste_id).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Wastage record not found")
    if waste.status != WastageStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot approve record in status {waste.status}")

    # Deduct damaged/waste stock from inventory upon approval
    update_stock(
        db=db,
        location_id=waste.location_id,
        product_id=waste.product_id,
        quantity_delta=-waste.quantity,
        movement_type=MovementType.WASTAGE_SCRAP,
        reference_type="WASTAGE",
        reference_id=waste.waste_number,
        batch_id=waste.batch_id,
        unit_cost=waste.estimated_cost,
        notes=f"Approved wastage: {waste.reason}",
        user_id=current_user.id
    )

    waste.status = WastageStatus.APPROVED
    waste.approved_by_id = current_user.id
    waste.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(waste)
    return waste
