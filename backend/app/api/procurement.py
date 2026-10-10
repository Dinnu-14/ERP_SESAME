from typing import List, Optional
from decimal import Decimal
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.procurement import (
    Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, GoodsReceiptItem,
    POStatus, InspectionStatus
)
from app.models.inventory import MovementType, Batch
from app.models.user import User, UserRole
from app.schemas.procurement import (
    SupplierCreate, SupplierOut,
    PurchaseOrderCreate, PurchaseOrderOut,
    GoodsReceiptCreate, GoodsReceiptOut
)
from app.services.inventory_service import update_stock
from app.api.deps import get_current_user

router = APIRouter(prefix="/procurement", tags=["Procurement & Raw Materials"])

# --- Suppliers ---
@router.get("/suppliers", response_model=List[SupplierOut])
def list_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Supplier).filter(Supplier.is_active == True).all()

@router.post("/suppliers", response_model=SupplierOut)
def create_supplier(
    sup_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    supplier = Supplier(**sup_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

# --- Purchase Orders ---
@router.get("/purchase-orders", response_model=List[PurchaseOrderOut])
def list_purchase_orders(
    status: Optional[POStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    return query.order_by(PurchaseOrder.created_at.desc()).all()

@router.post("/purchase-orders", response_model=PurchaseOrderOut)
def create_purchase_order(
    po_in: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    po_number = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    total = Decimal("0.00")

    po = PurchaseOrder(
        po_number=po_number,
        supplier_id=po_in.supplier_id,
        destination_location_id=po_in.destination_location_id,
        expected_delivery_date=po_in.expected_delivery_date,
        status=POStatus.APPROVED,
        payment_terms=po_in.payment_terms,
        notes=po_in.notes,
        created_by_id=current_user.id
    )
    db.add(po)
    db.flush()

    for item in po_in.items:
        line_total = item.quantity * item.unit_price * (1 + item.tax_percent / 100)
        total += line_total
        po_item = PurchaseOrderItem(
            po_id=po.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_percent=item.tax_percent,
            total_amount=line_total
        )
        db.add(po_item)

    po.total_amount = total
    db.commit()
    db.refresh(po)
    return po

# --- Goods Receipt Notes (GRN) ---
@router.get("/goods-receipts", response_model=List[GoodsReceiptOut])
def list_goods_receipts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(GoodsReceipt).order_by(GoodsReceipt.created_at.desc()).all()

@router.post("/goods-receipts", response_model=GoodsReceiptOut)
def create_goods_receipt(
    grn_in: GoodsReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    grn_number = f"GRN-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"
    total_val = Decimal("0.00")

    grn = GoodsReceipt(
        grn_number=grn_number,
        po_id=grn_in.po_id,
        supplier_id=grn_in.supplier_id,
        location_id=grn_in.location_id,
        supplier_invoice_no=grn_in.supplier_invoice_no,
        inspection_status=InspectionStatus.ACCEPTED,
        notes=grn_in.notes,
        received_by_id=current_user.id
    )
    db.add(grn)
    db.flush()

    for item in grn_in.items:
        line_val = item.accepted_quantity * item.unit_price
        total_val += line_val

        # Create or update Batch for accepted raw materials
        batch = Batch(
            batch_number=item.batch_number,
            product_id=item.product_id,
            location_id=grn_in.location_id,
            initial_quantity=item.accepted_quantity,
            current_quantity=item.accepted_quantity,
            cost_per_unit=item.unit_price,
            status="ACTIVE",
            notes=f"Received via GRN {grn_number}"
        )
        db.add(batch)
        db.flush()

        grn_item = GoodsReceiptItem(
            grn_id=grn.id,
            product_id=item.product_id,
            batch_number=item.batch_number,
            received_quantity=item.received_quantity,
            accepted_quantity=item.accepted_quantity,
            rejected_quantity=item.rejected_quantity,
            unit_price=item.unit_price,
            moisture_pct=item.moisture_pct,
            foreign_matter_pct=item.foreign_matter_pct,
            rejection_reason=item.rejection_reason
        )
        db.add(grn_item)

        # Update stock ledger with received raw seeds/goods
        if item.accepted_quantity > 0:
            update_stock(
                db=db,
                location_id=grn_in.location_id,
                product_id=item.product_id,
                quantity_delta=item.accepted_quantity,
                movement_type=MovementType.PURCHASE_RECEIPT,
                reference_type="GOODS_RECEIPT",
                reference_id=grn_number,
                batch_id=batch.id,
                unit_cost=item.unit_price,
                notes=f"GRN receipt from supplier ID {grn_in.supplier_id}",
                user_id=current_user.id
            )

    grn.total_received_amount = total_val
    if grn_in.po_id:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == grn_in.po_id).first()
        if po:
            po.status = POStatus.COMPLETED

    db.commit()
    db.refresh(grn)
    return grn
