from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.transfer import TransferStatus
from app.schemas.inventory import ProductOut, BatchOut

class TransferItemCreate(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    requested_quantity: Decimal
    notes: Optional[str] = None

class TransferItemOut(BaseModel):
    id: int
    transfer_id: int
    product_id: int
    batch_id: Optional[int] = None
    requested_quantity: Decimal
    dispatched_quantity: Decimal
    received_quantity: Decimal
    damaged_quantity: Decimal
    notes: Optional[str] = None
    product: Optional[ProductOut] = None
    batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True

class TransferOrderCreate(BaseModel):
    source_location_id: int
    destination_location_id: int
    notes: Optional[str] = None
    items: List[TransferItemCreate]

class TransferDispatchItem(BaseModel):
    item_id: int
    batch_id: Optional[int] = None
    dispatched_quantity: Decimal

class TransferDispatchAction(BaseModel):
    items: List[TransferDispatchItem]
    notes: Optional[str] = None

class TransferReceiveItem(BaseModel):
    item_id: int
    received_quantity: Decimal
    damaged_quantity: Decimal = Decimal("0.0000")
    notes: Optional[str] = None

class TransferReceiveAction(BaseModel):
    items: List[TransferReceiveItem]
    notes: Optional[str] = None

class TransferOrderOut(BaseModel):
    id: int
    transfer_number: str
    source_location_id: int
    destination_location_id: int
    status: TransferStatus
    notes: Optional[str] = None
    requested_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    dispatched_by_id: Optional[int] = None
    received_by_id: Optional[int] = None
    requested_at: datetime
    approved_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    created_at: datetime
    items: List[TransferItemOut] = []

    class Config:
        from_attributes = True
