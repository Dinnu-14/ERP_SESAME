from decimal import Decimal
from typing import Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.inventory import StockBalance, StockMovement, MovementType, Batch, Product
from app.models.user import User

def generate_movement_number() -> str:
    return f"MOV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"

def update_stock(
    db: Session,
    location_id: int,
    product_id: int,
    quantity_delta: Decimal,  # positive to add, negative to deduct
    movement_type: MovementType,
    reference_type: str,
    reference_id: str,
    batch_id: Optional[int] = None,
    unit_cost: Decimal = Decimal("0.00"),
    notes: Optional[str] = None,
    user_id: Optional[int] = None,
    allow_negative: bool = False
) -> StockBalance:
    """
    The single source of truth stock balance updater and ledger recorder.
    Guarantees ledger integrity, prevents negative balances by default,
    and updates both aggregated and batch-level stock records.
    """
    # 1. Fetch or create StockBalance for (location_id, product_id, batch_id)
    query = db.query(StockBalance).filter(
        StockBalance.location_id == location_id,
        StockBalance.product_id == product_id
    )
    if batch_id is not None:
        query = query.filter(StockBalance.batch_id == batch_id)
    else:
        # If no batch_id specified, check if there is an unbatched balance
        unbatched = query.filter(StockBalance.batch_id.is_(None)).first()
        if unbatched:
            stock_balance = unbatched
        elif quantity_delta < 0:
            # If deducting and no unbatched balance, pick first available batch with stock
            batch_with_stock = db.query(StockBalance).filter(
                StockBalance.location_id == location_id,
                StockBalance.product_id == product_id,
                StockBalance.quantity > 0
            ).order_by(StockBalance.id.asc()).first()
            if batch_with_stock:
                stock_balance = batch_with_stock
                batch_id = batch_with_stock.batch_id
            else:
                stock_balance = None
        else:
            stock_balance = None

    if batch_id is not None and not locals().get("stock_balance"):
        stock_balance = query.first()

    current_qty = stock_balance.quantity if stock_balance else Decimal("0.0000")
    new_qty = current_qty + Decimal(str(quantity_delta))

    if new_qty < 0 and not allow_negative:
        product = db.query(Product).filter(Product.id == product_id).first()
        prod_name = product.name if product else f"ID {product_id}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory for {prod_name} at location {location_id}. Current: {current_qty}, Attempted deduction: {abs(quantity_delta)}"
        )

    if not stock_balance:
        stock_balance = StockBalance(
            location_id=location_id,
            product_id=product_id,
            batch_id=batch_id,
            quantity=new_qty,
            reserved_quantity=Decimal("0.0000")
        )
        db.add(stock_balance)
    else:
        stock_balance.quantity = new_qty
        stock_balance.updated_at = datetime.utcnow()

    # 2. Update Batch remaining quantity if batch_id provided
    if batch_id is not None:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if batch:
            batch.current_quantity = batch.current_quantity + Decimal(str(quantity_delta))
            if batch.current_quantity <= 0:
                batch.status = "EXHAUSTED"
            else:
                batch.status = "ACTIVE"

    # 3. Create immutable StockMovement audit record
    movement = StockMovement(
        movement_number=generate_movement_number(),
        reference_type=reference_type,
        reference_id=str(reference_id),
        product_id=product_id,
        batch_id=batch_id,
        location_id=location_id,
        movement_type=movement_type,
        quantity=Decimal(str(quantity_delta)),
        balance_after=new_qty,
        unit_cost=unit_cost,
        notes=notes,
        created_by=user_id,
        created_at=datetime.utcnow()
    )
    db.add(movement)
    db.flush()

    return stock_balance
