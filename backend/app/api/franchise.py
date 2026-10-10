from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.franchise import (
    FranchiseExtraction, FranchiseSale, ReplenishmentRequest, ReplenishmentRequestItem,
    ReplenishmentStatus
)
from app.models.user import User, UserRole
from app.schemas.franchise import (
    FranchiseExtractionCreate, FranchiseExtractionOut,
    FranchiseSaleCreate, FranchiseSaleOut,
    ReplenishmentRequestCreate, ReplenishmentRequestOut
)
from app.services.franchise_service import record_franchise_extraction, record_franchise_sale
from app.api.deps import get_current_user, verify_location_access

router = APIRouter(prefix="/franchise", tags=["SUFALA Franchise Management"])

# --- Process A: Seed Extractions ---
@router.get("/extractions", response_model=List[FranchiseExtractionOut])
def list_extractions(
    location_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FranchiseExtraction)
    if location_id:
        verify_location_access(current_user, location_id)
        query = query.filter(FranchiseExtraction.location_id == location_id)
    elif current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(FranchiseExtraction.location_id == current_user.location_id)
    return query.order_by(FranchiseExtraction.created_at.desc()).all()

@router.post("/extractions", response_model=FranchiseExtractionOut)
def create_extraction(
    ext_in: FranchiseExtractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_location_access(current_user, ext_in.location_id)
    return record_franchise_extraction(
        db=db,
        location_id=ext_in.location_id,
        ownership=ext_in.ownership,
        seed_product_id=ext_in.seed_product_id,
        seed_input_qty=ext_in.seed_input_qty,
        oil_output_qty=ext_in.oil_output_qty,
        cake_output_qty=ext_in.cake_output_qty,
        waste_qty=ext_in.waste_qty,
        seed_batch_id=ext_in.seed_batch_id,
        customer_name=ext_in.customer_name,
        customer_phone=ext_in.customer_phone,
        service_charge=ext_in.service_charge,
        is_service_paid=ext_in.is_service_paid,
        operator_id=current_user.id,
        notes=ext_in.notes
    )

# --- Process B: Product Retail Sales ---
@router.get("/sales", response_model=List[FranchiseSaleOut])
def list_sales(
    location_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FranchiseSale)
    if location_id:
        verify_location_access(current_user, location_id)
        query = query.filter(FranchiseSale.location_id == location_id)
    elif current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(FranchiseSale.location_id == current_user.location_id)
    return query.order_by(FranchiseSale.sale_date.desc()).all()

@router.post("/sales", response_model=FranchiseSaleOut)
def create_sale(
    sale_in: FranchiseSaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_location_access(current_user, sale_in.location_id)
    items_data = [item.model_dump() for item in sale_in.items]
    return record_franchise_sale(
        db=db,
        location_id=sale_in.location_id,
        items_data=items_data,
        customer_name=sale_in.customer_name,
        customer_phone=sale_in.customer_phone,
        payment_method=sale_in.payment_method,
        discount_amount=sale_in.discount_amount,
        tax_amount=sale_in.tax_amount,
        cashier_id=current_user.id,
        notes=sale_in.notes
    )

# --- Replenishment Requests ---
@router.get("/replenishments", response_model=List[ReplenishmentRequestOut])
def list_replenishments(
    location_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ReplenishmentRequest)
    if location_id:
        query = query.filter(ReplenishmentRequest.location_id == location_id)
    elif current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(ReplenishmentRequest.location_id == current_user.location_id)
    return query.order_by(ReplenishmentRequest.created_at.desc()).all()

@router.post("/replenishments", response_model=ReplenishmentRequestOut)
def create_replenishment(
    req_in: ReplenishmentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req_num = f"REP-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    req = ReplenishmentRequest(
        request_number=req_num,
        location_id=req_in.location_id,
        status=ReplenishmentStatus.REQUESTED,
        notes=req_in.notes,
        requested_by_id=current_user.id
    )
    db.add(req)
    db.flush()

    for item in req_in.items:
        r_item = ReplenishmentRequestItem(
            request_id=req.id,
            product_id=item.product_id,
            requested_quantity=item.requested_quantity,
            approved_quantity=item.requested_quantity
        )
        db.add(r_item)

    db.commit()
    db.refresh(req)
    return req
