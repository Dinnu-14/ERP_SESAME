from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.inventory import UnitOfMeasure, ProductType, MovementType

class CategoryCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    name: str
    code: str
    sku: str
    product_type: ProductType
    uom: UnitOfMeasure
    default_price: Decimal = Decimal("0.00")
    cost_price: Decimal = Decimal("0.00")
    reorder_level: Decimal = Decimal("100.00")
    description: Optional[str] = None

class ProductOut(BaseModel):
    id: int
    category_id: Optional[int] = None
    name: str
    code: str
    sku: str
    product_type: ProductType
    uom: UnitOfMeasure
    default_price: Decimal
    cost_price: Decimal
    reorder_level: Decimal
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

class BatchCreate(BaseModel):
    batch_number: str
    product_id: int
    location_id: Optional[int] = None
    initial_quantity: Decimal
    cost_per_unit: Decimal = Decimal("0.00")
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class BatchOut(BaseModel):
    id: int
    batch_number: str
    product_id: int
    location_id: Optional[int] = None
    initial_quantity: Decimal
    current_quantity: Decimal
    cost_per_unit: Decimal
    status: str
    manufacturing_date: datetime
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class StockBalanceOut(BaseModel):
    id: int
    location_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    reserved_quantity: Decimal
    product: Optional[ProductOut] = None
    batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    location_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity_delta: Decimal  # Positive to add, negative to deduct
    reason: str
    unit_cost: Decimal = Decimal("0.00")

class StockMovementOut(BaseModel):
    id: int
    movement_number: str
    reference_type: str
    reference_id: str
    product_id: int
    batch_id: Optional[int] = None
    location_id: int
    movement_type: MovementType
    quantity: Decimal
    balance_after: Decimal
    unit_cost: Decimal
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
