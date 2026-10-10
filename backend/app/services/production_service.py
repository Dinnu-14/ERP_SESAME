from decimal import Decimal
from datetime import datetime
from typing import Optional
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.production import (
    ProductionBatch, ProductionQualityCheck, ProductionBatchStatus, QualityStatus
)
from app.models.inventory import MovementType, Batch, Product
from app.services.inventory_service import update_stock

def generate_production_batch_number() -> str:
    return f"BAT-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

def create_production_batch(
    db: Session,
    location_id: int,
    seed_product_id: int,
    seed_batch_id: int,
    seed_input_qty: Decimal,
    oil_product_id: int,
    cake_product_id: int,
    expected_oil_yield_pct: Decimal = Decimal("45.00"),
    operator_id: Optional[int] = None,
    notes: Optional[str] = None
) -> ProductionBatch:
    # 1. Deduct seed from inventory (Consumption)
    batch_num = generate_production_batch_number()
    update_stock(
        db=db,
        location_id=location_id,
        product_id=seed_product_id,
        quantity_delta=-seed_input_qty,
        movement_type=MovementType.PRODUCTION_CONSUMPTION,
        reference_type="PRODUCTION_BATCH",
        reference_id=batch_num,
        batch_id=seed_batch_id,
        notes=f"Issued for oil extraction batch {batch_num}",
        user_id=operator_id
    )

    # 2. Create production batch record in IN_PROGRESS status
    prod_batch = ProductionBatch(
        batch_number=batch_num,
        location_id=location_id,
        seed_product_id=seed_product_id,
        seed_batch_id=seed_batch_id,
        seed_input_qty=seed_input_qty,
        oil_product_id=oil_product_id,
        cake_product_id=cake_product_id,
        expected_oil_yield_pct=expected_oil_yield_pct,
        status=ProductionBatchStatus.IN_PROGRESS,
        operator_id=operator_id,
        notes=notes,
        started_at=datetime.utcnow()
    )
    db.add(prod_batch)
    db.commit()
    db.refresh(prod_batch)
    return prod_batch

def complete_production_batch(
    db: Session,
    batch_id: int,
    oil_output_qty: Decimal,
    cake_output_qty: Decimal,
    recorded_loss_qty: Decimal = Decimal("0.0000"),
    oil_batch_number: Optional[str] = None,
    cake_batch_number: Optional[str] = None,
    quality_check_data: Optional[dict] = None,
    supervisor_id: Optional[int] = None,
    notes: Optional[str] = None
) -> ProductionBatch:
    prod_batch = db.query(ProductionBatch).filter(ProductionBatch.id == batch_id).first()
    if not prod_batch:
        raise HTTPException(status_code=404, detail="Production batch not found")
    if prod_batch.status not in [ProductionBatchStatus.IN_PROGRESS, ProductionBatchStatus.PLANNED]:
        raise HTTPException(status_code=400, detail=f"Cannot complete batch in status {prod_batch.status}")

    # Mass balance calculation:
    # Seed In = Oil Out + Cake Out + Recorded Loss + Unexplained Variance
    # Unexplained Variance = Seed In - (Oil Out + Cake Out + Recorded Loss)
    total_accounted = oil_output_qty + cake_output_qty + recorded_loss_qty
    variance = prod_batch.seed_input_qty - total_accounted

    # Oil Yield % = (Oil Output / Seed Input) * 100
    actual_yield_pct = Decimal("0.00")
    if prod_batch.seed_input_qty > 0:
        actual_yield_pct = (oil_output_qty / prod_batch.seed_input_qty) * Decimal("100.00")

    # Generate output batch numbers if not provided
    oil_bnum = oil_batch_number or f"OIL-{prod_batch.batch_number}"
    cake_bnum = cake_batch_number or f"CAKE-{prod_batch.batch_number}"

    # Create Batch entities for finished oil and cake
    oil_batch = Batch(
        batch_number=oil_bnum,
        product_id=prod_batch.oil_product_id,
        location_id=prod_batch.location_id,
        initial_quantity=oil_output_qty,
        current_quantity=oil_output_qty,
        manufacturing_date=datetime.utcnow(),
        status="ACTIVE",
        notes=f"Produced from extraction batch {prod_batch.batch_number}"
    )
    db.add(oil_batch)
    db.flush()

    cake_batch = Batch(
        batch_number=cake_bnum,
        product_id=prod_batch.cake_product_id,
        location_id=prod_batch.location_id,
        initial_quantity=cake_output_qty,
        current_quantity=cake_output_qty,
        manufacturing_date=datetime.utcnow(),
        status="ACTIVE",
        notes=f"By-product cake from extraction batch {prod_batch.batch_number}"
    )
    db.add(cake_batch)
    db.flush()

    # Credit Oil into Inventory
    if oil_output_qty > 0:
        update_stock(
            db=db,
            location_id=prod_batch.location_id,
            product_id=prod_batch.oil_product_id,
            quantity_delta=oil_output_qty,
            movement_type=MovementType.PRODUCTION_OUTPUT,
            reference_type="PRODUCTION_BATCH",
            reference_id=prod_batch.batch_number,
            batch_id=oil_batch.id,
            notes=f"Extraction output for batch {prod_batch.batch_number}",
            user_id=supervisor_id
        )

    # Credit Cake into Inventory
    if cake_output_qty > 0:
        update_stock(
            db=db,
            location_id=prod_batch.location_id,
            product_id=prod_batch.cake_product_id,
            quantity_delta=cake_output_qty,
            movement_type=MovementType.PRODUCTION_OUTPUT,
            reference_type="PRODUCTION_BATCH",
            reference_id=prod_batch.batch_number,
            batch_id=cake_batch.id,
            notes=f"Sesame cake by-product for batch {prod_batch.batch_number}",
            user_id=supervisor_id
        )

    # Attach Quality Inspection if provided
    if quality_check_data:
        qc = ProductionQualityCheck(
            batch_id=prod_batch.id,
            test_date=datetime.utcnow(),
            free_fatty_acids_pct=quality_check_data.get("free_fatty_acids_pct"),
            moisture_pct=quality_check_data.get("moisture_pct"),
            color=quality_check_data.get("color"),
            odor=quality_check_data.get("odor"),
            density_g_ml=quality_check_data.get("density_g_ml"),
            status=quality_check_data.get("status", QualityStatus.PASSED),
            tested_by_id=supervisor_id,
            comments=quality_check_data.get("comments")
        )
        db.add(qc)

    # Update Production Batch status
    # Flag if variance is excessively high (>5% of input)
    variance_pct = abs(variance) / prod_batch.seed_input_qty * 100 if prod_batch.seed_input_qty > 0 else 0
    if variance_pct > 5:
        prod_batch.status = ProductionBatchStatus.FLAGGED
    else:
        prod_batch.status = ProductionBatchStatus.COMPLETED

    prod_batch.oil_output_qty = oil_output_qty
    prod_batch.oil_batch_number = oil_bnum
    prod_batch.cake_output_qty = cake_output_qty
    prod_batch.cake_batch_number = cake_bnum
    prod_batch.recorded_loss_qty = recorded_loss_qty
    prod_batch.unexplained_variance_qty = variance
    prod_batch.actual_oil_yield_pct = actual_yield_pct
    prod_batch.supervisor_id = supervisor_id
    prod_batch.completed_at = datetime.utcnow()
    if notes:
        prod_batch.notes = (prod_batch.notes or "") + f" | Completion note: {notes}"

    db.commit()
    db.refresh(prod_batch)
    return prod_batch
