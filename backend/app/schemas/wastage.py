from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.wastage import WastageType, WastageStatus
from app.schemas.inventory import ProductOut, BatchOut

class WastageCreate(BaseModel):
    location_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    wastage_type: WastageType
    estimated_cost: Decimal = Decimal("0.00")
    reason: str
    disposal_method: str = "Destroyed/Disposed"
    is_recoverable: bool = False

class WastageOut(BaseModel):
    id: int
    waste_number: str
    location_id: int
    product_id: int
    batch_id: Optional[int] = None
    quantity: Decimal
    wastage_type: WastageType
    estimated_cost: Decimal
    reason: str
    disposal_method: str
    is_recoverable: bool
    status: WastageStatus
    date: datetime
    recorded_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    product: Optional[ProductOut] = None
    batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True
