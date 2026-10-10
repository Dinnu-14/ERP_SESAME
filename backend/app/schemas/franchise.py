from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.franchise import MaterialOwnership, PaymentMethod, ReplenishmentStatus
from app.schemas.inventory import ProductOut, BatchOut

class FranchiseExtractionCreate(BaseModel):
    location_id: int
    ownership: MaterialOwnership = MaterialOwnership.COMPANY_OWNED
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    service_charge: Decimal = Decimal("0.00")
    is_service_paid: bool = True
    seed_product_id: int
    seed_batch_id: Optional[int] = None
    seed_input_qty: Decimal
    oil_output_qty: Decimal
    cake_output_qty: Decimal
    waste_qty: Decimal = Decimal("0.0000")
    notes: Optional[str] = None

class FranchiseExtractionOut(BaseModel):
    id: int
    extraction_number: str
    location_id: int
    ownership: MaterialOwnership
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    service_charge: Decimal
    is_service_paid: bool
    seed_product_id: int
    seed_batch_id: Optional[int] = None
    seed_input_qty: Decimal
    oil_output_qty: Decimal
    cake_output_qty: Decimal
    waste_qty: Decimal
    date: datetime
    operator_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    seed_product: Optional[ProductOut] = None
    seed_batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True

class FranchiseSaleItemCreate(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    unit_price: Decimal

class FranchiseSaleItemOut(BaseModel):
    id: int
    sale_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class FranchiseSaleCreate(BaseModel):
    location_id: int
    customer_name: str = "Walk-in Customer"
    customer_phone: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    items: List[FranchiseSaleItemCreate]
    notes: Optional[str] = None

class FranchiseSaleOut(BaseModel):
    id: int
    invoice_number: str
    location_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_method: PaymentMethod
    sale_date: datetime
    cashier_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[FranchiseSaleItemOut] = []

    class Config:
        from_attributes = True

class ReplenishmentRequestItemCreate(BaseModel):
    product_id: int
    requested_quantity: Decimal

class ReplenishmentRequestItemOut(BaseModel):
    id: int
    request_id: int
    product_id: int
    requested_quantity: Decimal
    approved_quantity: Decimal
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class ReplenishmentRequestCreate(BaseModel):
    location_id: int
    notes: Optional[str] = None
    items: List[ReplenishmentRequestItemCreate]

class ReplenishmentRequestOut(BaseModel):
    id: int
    request_number: str
    location_id: int
    status: ReplenishmentStatus
    notes: Optional[str] = None
    requested_by_id: Optional[int] = None
    created_at: datetime
    items: List[ReplenishmentRequestItemOut] = []

    class Config:
        from_attributes = True
