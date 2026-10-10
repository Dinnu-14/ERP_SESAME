from decimal import Decimal
from datetime import datetime
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.transfer import TransferOrder, TransferItem, TransferStatus
from app.models.inventory import MovementType, Batch, StockBalance
from app.models.wastage import WastageRecord, WastageType, WastageStatus
from app.services.inventory_service import update_stock

def generate_transfer_number() -> str:
    return f"TRF-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{uuid.uuid4().hex[:4].upper()}"

def create_transfer_order(
    db: Session,
    source_location_id: int,
    destination_location_id: int,
    items_data: list,
    requested_by_id: Optional[int] = None,
    notes: Optional[str] = None
) -> TransferOrder:
    if source_location_id == destination_location_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and destination locations cannot be the same."
        )

    transfer = TransferOrder(
        transfer_number=generate_transfer_number(),
        source_location_id=source_location_id,
        destination_location_id=destination_location_id,
        status=TransferStatus.REQUESTED,
        notes=notes,
        requested_by_id=requested_by_id,
        requested_at=datetime.utcnow()
    )
    db.add(transfer)
    db.flush()

    for item in items_data:
        t_item = TransferItem(
            transfer_id=transfer.id,
            product_id=item["product_id"],
            batch_id=item.get("batch_id"),
            requested_quantity=Decimal(str(item["requested_quantity"])),
            notes=item.get("notes")
        )
        db.add(t_item)

    db.commit()
    db.refresh(transfer)
    return transfer

def approve_transfer_order(
    db: Session,
    transfer_id: int,
    approved_by_id: int
) -> TransferOrder:
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer order not found")
    if transfer.status != TransferStatus.REQUESTED:
        raise HTTPException(status_code=400, detail=f"Cannot approve transfer in status {transfer.status}")

    transfer.status = TransferStatus.APPROVED
    transfer.approved_by_id = approved_by_id
    transfer.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(transfer)
    return transfer

def dispatch_transfer_order(
    db: Session,
    transfer_id: int,
    dispatch_items: list,
    dispatched_by_id: int,
    notes: Optional[str] = None
) -> TransferOrder:
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer order not found")
    if transfer.status not in [TransferStatus.REQUESTED, TransferStatus.APPROVED]:
        raise HTTPException(status_code=400, detail=f"Cannot dispatch transfer in status {transfer.status}")

    # Process each dispatched item and reduce source inventory
    item_map = {item.id: item for item in transfer.items}
    for disp in dispatch_items:
        item_id = disp["item_id"]
        if item_id not in item_map:
            raise HTTPException(status_code=400, detail=f"Transfer item ID {item_id} not part of this transfer")
        
        t_item = item_map[item_id]
        qty = Decimal(str(disp["dispatched_quantity"]))
        batch_id = disp.get("batch_id") or t_item.batch_id

        if qty <= 0:
            continue

        t_item.dispatched_quantity = qty
        if batch_id:
            t_item.batch_id = batch_id

        # Deduct from source location
        update_stock(
            db=db,
            location_id=transfer.source_location_id,
            product_id=t_item.product_id,
            quantity_delta=-qty,
            movement_type=MovementType.TRANSFER_DISPATCH,
            reference_type="TRANSFER",
            reference_id=transfer.transfer_number,
            batch_id=batch_id,
            notes=f"Dispatched in transfer {transfer.transfer_number} to location {transfer.destination_location_id}",
            user_id=dispatched_by_id
        )

    transfer.status = TransferStatus.DISPATCHED
    transfer.dispatched_by_id = dispatched_by_id
    transfer.dispatched_at = datetime.utcnow()
    if notes:
        transfer.notes = (transfer.notes or "") + f" | Dispatch note: {notes}"

    db.commit()
    db.refresh(transfer)
    return transfer

def receive_transfer_order(
    db: Session,
    transfer_id: int,
    received_items: list,
    received_by_id: int,
    notes: Optional[str] = None
) -> TransferOrder:
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer order not found")
    if transfer.status != TransferStatus.DISPATCHED:
        raise HTTPException(status_code=400, detail=f"Cannot receive transfer in status {transfer.status}")

    item_map = {item.id: item for item in transfer.items}
    all_received_fully = True

    for rec in received_items:
        item_id = rec["item_id"]
        if item_id not in item_map:
            raise HTTPException(status_code=400, detail=f"Transfer item ID {item_id} not part of this transfer")

        t_item = item_map[item_id]
        rec_qty = Decimal(str(rec["received_quantity"]))
        dmg_qty = Decimal(str(rec.get("damaged_quantity", "0.0000")))

        t_item.received_quantity = rec_qty
        t_item.damaged_quantity = dmg_qty

        # Credit destination inventory with the good received quantity
        if rec_qty > 0:
            update_stock(
                db=db,
                location_id=transfer.destination_location_id,
                product_id=t_item.product_id,
                quantity_delta=rec_qty,
                movement_type=MovementType.TRANSFER_RECEIVE,
                reference_type="TRANSFER",
                reference_id=transfer.transfer_number,
                batch_id=t_item.batch_id,
                notes=f"Received in transfer {transfer.transfer_number} from location {transfer.source_location_id}",
                user_id=received_by_id
            )

        # If there are damaged items during transit, record them in Wastage
        if dmg_qty > 0:
            waste = WastageRecord(
                waste_number=f"WST-TRF-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{t_item.id}",
                location_id=transfer.destination_location_id,
                product_id=t_item.product_id,
                batch_id=t_item.batch_id,
                quantity=dmg_qty,
                wastage_type=WastageType.HANDLING_LOSS,
                reason=f"Damaged in transit during transfer {transfer.transfer_number}",
                disposal_method="Recorded as damaged on arrival",
                status=WastageStatus.APPROVED,
                recorded_by_id=received_by_id,
                approved_by_id=received_by_id,
                approved_at=datetime.utcnow()
            )
            db.add(waste)

        if (rec_qty + dmg_qty) < t_item.dispatched_quantity:
            all_received_fully = False

    transfer.status = TransferStatus.COMPLETED if all_received_fully else TransferStatus.PARTIALLY_RECEIVED
    transfer.received_by_id = received_by_id
    transfer.received_at = datetime.utcnow()
    if notes:
        transfer.notes = (transfer.notes or "") + f" | Receive note: {notes}"

    db.commit()
    db.refresh(transfer)
    return transfer
