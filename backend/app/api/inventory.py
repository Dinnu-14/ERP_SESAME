from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import (
    ProductCategory, Product, Batch, StockBalance, StockMovement, MovementType
)
from app.models.user import User, UserRole
from app.schemas.inventory import (
    CategoryCreate, CategoryOut,
    ProductCreate, ProductOut,
    BatchCreate, BatchOut,
    StockBalanceOut, StockMovementOut, StockAdjustmentCreate
)
from app.services.inventory_service import update_stock
from app.api.deps import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

# --- Categories ---
@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ProductCategory).filter(ProductCategory.is_active == True).all()

@router.post("/categories", response_model=CategoryOut)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    cat = ProductCategory(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# --- Products ---
@router.get("/products", response_model=List[ProductOut])
def list_products(
    category_id: Optional[int] = None,
    product_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product).filter(Product.is_active == True)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if product_type:
        query = query.filter(Product.product_type == product_type)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.code.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    return query.all()

@router.post("/products", response_model=ProductOut)
def create_product(
    prod_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    existing = db.query(Product).filter((Product.code == prod_in.code) | (Product.sku == prod_in.sku)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this Code or SKU already exists")

    product = Product(**prod_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

# --- Batches ---
@router.get("/batches", response_model=List[BatchOut])
def list_batches(
    product_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Batch)
    if product_id:
        query = query.filter(Batch.product_id == product_id)
    if location_id:
        query = query.filter(Batch.location_id == location_id)
    if status:
        query = query.filter(Batch.status == status)
    return query.order_by(Batch.created_at.desc()).all()

@router.post("/batches", response_model=BatchOut)
def create_batch(
    batch_in: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Batch).filter(Batch.batch_number == batch_in.batch_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch number already exists")

    batch = Batch(
        batch_number=batch_in.batch_number,
        product_id=batch_in.product_id,
        location_id=batch_in.location_id,
        initial_quantity=batch_in.initial_quantity,
        current_quantity=batch_in.initial_quantity,
        cost_per_unit=batch_in.cost_per_unit,
        expiry_date=batch_in.expiry_date,
        notes=batch_in.notes
    )
    db.add(batch)
    db.flush()

    # Record initial stock balance if location specified
    if batch_in.location_id:
        update_stock(
            db=db,
            location_id=batch_in.location_id,
            product_id=batch_in.product_id,
            quantity_delta=batch_in.initial_quantity,
            movement_type=MovementType.OPENING_STOCK,
            reference_type="BATCH_INITIAL",
            reference_id=batch.batch_number,
            batch_id=batch.id,
            unit_cost=batch_in.cost_per_unit,
            notes=batch_in.notes or "Initial batch opening stock",
            user_id=current_user.id
        )

    db.commit()
    db.refresh(batch)
    return batch

# --- Stock Balances ---
@router.get("/balances", response_model=List[StockBalanceOut])
def list_stock_balances(
    location_id: Optional[int] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockBalance)
    if location_id:
        query = query.filter(StockBalance.location_id == location_id)
    elif current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(StockBalance.location_id == current_user.location_id)
        
    if product_id:
        query = query.filter(StockBalance.product_id == product_id)
    return query.all()

# --- Stock Movements (Ledger) ---
@router.get("/movements", response_model=List[StockMovementOut])
def list_stock_movements(
    location_id: Optional[int] = None,
    product_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockMovement)
    if location_id:
        query = query.filter(StockMovement.location_id == location_id)
    elif current_user.role == UserRole.FRANCHISE_MANAGER and current_user.location_id:
        query = query.filter(StockMovement.location_id == current_user.location_id)
        
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    return query.order_by(StockMovement.created_at.desc()).limit(limit).all()

# --- Stock Adjustments ---
@router.post("/adjustments", response_model=StockMovementOut)
def record_stock_adjustment(
    adj_in: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.STORE_MANAGER]:
        raise HTTPException(status_code=403, detail="Only Managers can perform stock adjustments")

    balance = update_stock(
        db=db,
        location_id=adj_in.location_id,
        product_id=adj_in.product_id,
        quantity_delta=adj_in.quantity_delta,
        movement_type=MovementType.STOCK_ADJUSTMENT,
        reference_type="MANUAL_ADJUSTMENT",
        reference_id="ADJUST",
        batch_id=adj_in.batch_id,
        unit_cost=adj_in.unit_cost,
        notes=adj_in.reason,
        user_id=current_user.id
    )
    movement = db.query(StockMovement).filter(
        StockMovement.location_id == adj_in.location_id,
        StockMovement.product_id == adj_in.product_id
    ).order_by(StockMovement.created_at.desc()).first()
    db.commit()
    return movement
