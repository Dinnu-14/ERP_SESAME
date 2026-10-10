from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.b2b import B2BOrderStatus, InvoiceStatus
from app.schemas.inventory import ProductOut, BatchOut

class B2BCustomerCreate(BaseModel):
    customer_code: str
    company_name: str
    contact_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gst_tin: Optional[str] = None
    credit_limit: Decimal = Decimal("100000.00")
    payment_terms_days: int = 30

class B2BCustomerOut(BaseModel):
    id: int
    customer_code: str
    company_name: str
    contact_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gst_tin: Optional[str] = None
    credit_limit: Decimal
    payment_terms_days: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class B2BSalesOrderItemCreate(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal = Decimal("5.00")

class B2BSalesOrderItemOut(BaseModel):
    id: int
    sales_order_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal
    total_price: Decimal
    product: Optional[ProductOut] = None
    batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True

class B2BSalesOrderCreate(BaseModel):
    customer_id: int
    location_id: int
    delivery_due_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[B2BSalesOrderItemCreate]

class B2BPaymentCreate(BaseModel):
    amount: Decimal
    payment_method: str = "BANK_TRANSFER"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class B2BPaymentOut(BaseModel):
    id: int
    payment_number: str
    invoice_id: int
    amount: Decimal
    payment_date: datetime
    payment_method: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class B2BInvoiceOut(BaseModel):
    id: int
    invoice_number: str
    sales_order_id: Optional[int] = None
    customer_id: int
    invoice_date: datetime
    due_date: datetime
    total_amount: Decimal
    paid_amount: Decimal
    status: InvoiceStatus
    notes: Optional[str] = None
    created_at: datetime
    payments: List[B2BPaymentOut] = []

    class Config:
        from_attributes = True

class B2BSalesOrderOut(BaseModel):
    id: int
    so_number: str
    customer_id: int
    location_id: int
    order_date: datetime
    delivery_due_date: Optional[datetime] = None
    status: B2BOrderStatus
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    notes: Optional[str] = None
    created_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    created_at: datetime
    customer: Optional[B2BCustomerOut] = None
    items: List[B2BSalesOrderItemOut] = []
    invoices: List[B2BInvoiceOut] = []

    class Config:
        from_attributes = True
