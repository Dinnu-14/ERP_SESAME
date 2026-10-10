from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.production import ProductionBatchStatus, QualityStatus
from app.schemas.inventory import ProductOut, BatchOut

class QualityCheckCreate(BaseModel):
    free_fatty_acids_pct: Optional[Decimal] = None
    moisture_pct: Optional[Decimal] = None
    color: Optional[str] = None
    odor: Optional[str] = None
    density_g_ml: Optional[Decimal] = None
    status: QualityStatus = QualityStatus.PASSED
    comments: Optional[str] = None

class QualityCheckOut(BaseModel):
    id: int
    batch_id: int
    test_date: datetime
    free_fatty_acids_pct: Optional[Decimal] = None
    moisture_pct: Optional[Decimal] = None
    color: Optional[str] = None
    odor: Optional[str] = None
    density_g_ml: Optional[Decimal] = None
    status: QualityStatus
    tested_by_id: Optional[int] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True

class ProductionBatchCreate(BaseModel):
    location_id: int
    seed_product_id: int
    seed_batch_id: int
    seed_input_qty: Decimal
    oil_product_id: int
    cake_product_id: int
    expected_oil_yield_pct: Decimal = Decimal("45.00")
    notes: Optional[str] = None

class ProductionBatchComplete(BaseModel):
    oil_output_qty: Decimal
    cake_output_qty: Decimal
    recorded_loss_qty: Decimal = Decimal("0.0000")
    oil_batch_number: Optional[str] = None
    cake_batch_number: Optional[str] = None
    quality_check: Optional[QualityCheckCreate] = None
    notes: Optional[str] = None

class ProductionBatchOut(BaseModel):
    id: int
    batch_number: str
    location_id: int
    seed_product_id: int
    seed_batch_id: int
    seed_input_qty: Decimal
    oil_product_id: int
    oil_output_qty: Decimal
    oil_batch_number: Optional[str] = None
    cake_product_id: int
    cake_output_qty: Decimal
    cake_batch_number: Optional[str] = None
    recorded_loss_qty: Decimal
    unexplained_variance_qty: Decimal
    expected_oil_yield_pct: Decimal
    actual_oil_yield_pct: Decimal
    status: ProductionBatchStatus
    notes: Optional[str] = None
    operator_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    quality_checks: List[QualityCheckOut] = []
    seed_product: Optional[ProductOut] = None
    oil_product: Optional[ProductOut] = None
    cake_product: Optional[ProductOut] = None
    seed_batch: Optional[BatchOut] = None

    class Config:
        from_attributes = True
