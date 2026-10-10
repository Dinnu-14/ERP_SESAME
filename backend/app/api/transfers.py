from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transfer import TransferOrder, TransferStatus
from app.models.user import User, UserRole
from app.schemas.transfer import (
    TransferOrderCreate, TransferOrderOut,
    TransferDispatchAction, TransferReceiveAction
)
from app.services.transfer_service import (
    create_transfer_order, approve_transfer_order,
    dispatch_transfer_order, receive_transfer_order
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/transfers", tags=["Stock Transfers (Factory to SUFALA)"])

@router.get("", response_model=List[TransferOrderOut])
def list_transfers(
    source_location_id: Optional[int] = None,
    destination_location_id: Optional[int] = None,
    status: Optional[TransferStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TransferOrder)
    if source_location_id:
        query = query.filter(TransferOrder.source_location_id == source_location_id)
    if destination_location_id:
        query = query.filter(TransferOrder.destination_location_id == destination_location_id)
    if status:
        query = query.filter(TransferOrder.status == status)

    # If franchise manager, filter to their branch
    if current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(
            (TransferOrder.source_location_id == current_user.location_id) |
            (TransferOrder.destination_location_id == current_user.location_id)
        )
    return query.order_by(TransferOrder.created_at.desc()).all()

@router.get("/{transfer_id}", response_model=TransferOrderOut)
def get_transfer(transfer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transfer = db.query(TransferOrder).filter(TransferOrder.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer order not found")
    return transfer

@router.post("", response_model=TransferOrderOut)
def create_transfer(
    transfer_in: TransferOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items_data = [item.model_dump() for item in transfer_in.items]
    return create_transfer_order(
        db=db,
        source_location_id=transfer_in.source_location_id,
        destination_location_id=transfer_in.destination_location_id,
        items_data=items_data,
        requested_by_id=current_user.id,
        notes=transfer_in.notes
    )

@router.post("/{transfer_id}/approve", response_model=TransferOrderOut)
def approve_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to approve transfers")
    return approve_transfer_order(db=db, transfer_id=transfer_id, approved_by_id=current_user.id)

@router.post("/{transfer_id}/dispatch", response_model=TransferOrderOut)
def dispatch_transfer(
    transfer_id: int,
    action: TransferDispatchAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER, UserRole.INVENTORY_OPERATOR]:
        raise HTTPException(status_code=403, detail="Permission denied to dispatch stock")
    items_data = [item.model_dump() for item in action.items]
    return dispatch_transfer_order(
        db=db,
        transfer_id=transfer_id,
        dispatch_items=items_data,
        dispatched_by_id=current_user.id,
        notes=action.notes
    )

@router.post("/{transfer_id}/receive", response_model=TransferOrderOut)
def receive_transfer(
    transfer_id: int,
    action: TransferReceiveAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items_data = [item.model_dump() for item in action.items]
    return receive_transfer_order(
        db=db,
        transfer_id=transfer_id,
        received_items=items_data,
        received_by_id=current_user.id,
        notes=action.notes
    )
