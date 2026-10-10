from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.production import ProductionBatch, ProductionBatchStatus
from app.models.user import User, UserRole
from app.schemas.production import (
    ProductionBatchCreate, ProductionBatchComplete, ProductionBatchOut, QualityCheckOut
)
from app.services.production_service import create_production_batch, complete_production_batch
from app.api.deps import get_current_user

router = APIRouter(prefix="/production", tags=["Production & Oil Extraction"])

@router.get("/batches", response_model=List[ProductionBatchOut])
def list_production_batches(
    location_id: Optional[int] = None,
    status: Optional[ProductionBatchStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductionBatch)
    if location_id:
        query = query.filter(ProductionBatch.location_id == location_id)
    if status:
        query = query.filter(ProductionBatch.status == status)
    return query.order_by(ProductionBatch.created_at.desc()).all()

@router.get("/batches/{batch_id}", response_model=ProductionBatchOut)
def get_production_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    batch = db.query(ProductionBatch).filter(ProductionBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Production batch not found")
    return batch

@router.post("/batches", response_model=ProductionBatchOut)
def start_production(
    batch_in: ProductionBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.PRODUCTION_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to start production batches")
    
    return create_production_batch(
        db=db,
        location_id=batch_in.location_id,
        seed_product_id=batch_in.seed_product_id,
        seed_batch_id=batch_in.seed_batch_id,
        seed_input_qty=batch_in.seed_input_qty,
        oil_product_id=batch_in.oil_product_id,
        cake_product_id=batch_in.cake_product_id,
        expected_oil_yield_pct=batch_in.expected_oil_yield_pct,
        operator_id=current_user.id,
        notes=batch_in.notes
    )

@router.post("/batches/{batch_id}/complete", response_model=ProductionBatchOut)
def complete_production(
    batch_id: int,
    complete_in: ProductionBatchComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.PRODUCTION_MANAGER, UserRole.QUALITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to complete production batches")

    qc_dict = complete_in.quality_check.model_dump() if complete_in.quality_check else None
    return complete_production_batch(
        db=db,
        batch_id=batch_id,
        oil_output_qty=complete_in.oil_output_qty,
        cake_output_qty=complete_in.cake_output_qty,
        recorded_loss_qty=complete_in.recorded_loss_qty,
        oil_batch_number=complete_in.oil_batch_number,
        cake_batch_number=complete_in.cake_batch_number,
        quality_check_data=qc_dict,
        supervisor_id=current_user.id,
        notes=complete_in.notes
    )
