from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.procurement import POStatus, InspectionStatus
from app.schemas.inventory import ProductOut

class SupplierCreate(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_tin: Optional[str] = None
    rating: Decimal = Decimal("5.00")

class SupplierOut(BaseModel):
    id: int
    name: str
    code: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_tin: Optional[str] = None
    rating: Decimal
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal = Decimal("0.00")

class PurchaseOrderItemOut(BaseModel):
    id: int
    po_id: int
    product_id: int
    quantity: Decimal
    received_quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal
    total_amount: Decimal
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    destination_location_id: int
    expected_delivery_date: Optional[datetime] = None
    payment_terms: str = "Net 30"
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    destination_location_id: int
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    status: POStatus
    total_amount: Decimal
    payment_terms: str
    notes: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    supplier: Optional[SupplierOut] = None
    items: List[PurchaseOrderItemOut] = []

    class Config:
        from_attributes = True

class GoodsReceiptItemCreate(BaseModel):
    product_id: int
    batch_number: str
    received_quantity: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal = Decimal("0.0000")
    unit_price: Decimal
    moisture_pct: Optional[Decimal] = None
    foreign_matter_pct: Optional[Decimal] = None
    rejection_reason: Optional[str] = None

class GoodsReceiptItemOut(BaseModel):
    id: int
    grn_id: int
    product_id: int
    batch_number: str
    received_quantity: Decimal
    accepted_quantity: Decimal
    rejected_quantity: Decimal
    unit_price: Decimal
    moisture_pct: Optional[Decimal] = None
    foreign_matter_pct: Optional[Decimal] = None
    rejection_reason: Optional[str] = None
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class GoodsReceiptCreate(BaseModel):
    po_id: Optional[int] = None
    supplier_id: int
    location_id: int
    supplier_invoice_no: Optional[str] = None
    notes: Optional[str] = None
    items: List[GoodsReceiptItemCreate]

class GoodsReceiptOut(BaseModel):
    id: int
    grn_number: str
    po_id: Optional[int] = None
    supplier_id: int
    location_id: int
    received_date: datetime
    supplier_invoice_no: Optional[str] = None
    inspection_status: InspectionStatus
    total_received_amount: Decimal
    notes: Optional[str] = None
    received_by_id: Optional[int] = None
    created_at: datetime
    supplier: Optional[SupplierOut] = None
    items: List[GoodsReceiptItemOut] = []

    class Config:
        from_attributes = True
