import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class UnitOfMeasure(str, enum.Enum):
    KG = "KG"
    LITER = "LITER"
    BAG_50KG = "BAG_50KG"
    BOTTLE_1L = "BOTTLE_1L"
    BOTTLE_500ML = "BOTTLE_500ML"
    TIN_15L = "TIN_15L"
    BOX = "BOX"
    PIECE = "PIECE"

class ProductType(str, enum.Enum):
    RAW_MATERIAL = "RAW_MATERIAL"       # E.g. Raw Sesame Seeds, Black Sesame
    INTERMEDIATE = "INTERMEDIATE"       # E.g. Cleaned Seeds, Roasted Seeds, Filtered Bulk Oil
    FINISHED_GOOD = "FINISHED_GOOD"     # E.g. Cold-Pressed Sesame Oil (1L, 500ml), Gingelly Oil
    BY_PRODUCT = "BY_PRODUCT"           # E.g. Sesame Oil Cake (Pinac/Khal), Husks
    PACKAGING = "PACKAGING"             # E.g. Bottles, Caps, Corrugated Boxes

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    product_type = Column(Enum(ProductType), nullable=False)
    uom = Column(Enum(UnitOfMeasure), nullable=False)
    default_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    cost_price = Column(Numeric(12, 2), default=0.00, nullable=False)
    reorder_level = Column(Numeric(12, 2), default=100.00, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("ProductCategory", back_populates="products")
    batches = relationship("Batch", back_populates="product")
    stock_balances = relationship("StockBalance", back_populates="product")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(100), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    initial_quantity = Column(Numeric(14, 4), nullable=False)
    current_quantity = Column(Numeric(14, 4), nullable=False)
    manufacturing_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    cost_per_unit = Column(Numeric(12, 2), default=0.00)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, EXHAUSTED, QUARANTINE
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="batches")
    location = relationship("Location")
    stock_balances = relationship("StockBalance", back_populates="batch")

class StockBalance(Base):
    __tablename__ = "stock_balances"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    reserved_quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    location = relationship("Location", back_populates="stock_balances")
    product = relationship("Product", back_populates="stock_balances")
    batch = relationship("Batch", back_populates="stock_balances")

class MovementType(str, enum.Enum):
    OPENING_STOCK = "OPENING_STOCK"
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT"
    PRODUCTION_CONSUMPTION = "PRODUCTION_CONSUMPTION"
    PRODUCTION_OUTPUT = "PRODUCTION_OUTPUT"
    TRANSFER_DISPATCH = "TRANSFER_DISPATCH"
    TRANSFER_RECEIVE = "TRANSFER_RECEIVE"
    RETAIL_SALE = "RETAIL_SALE"
    B2B_DISPATCH = "B2B_DISPATCH"
    WASTAGE_SCRAP = "WASTAGE_SCRAP"
    STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
    CUSTOMER_RETURN = "CUSTOMER_RETURN"
    SUPPLIER_RETURN = "SUPPLIER_RETURN"

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    movement_number = Column(String(100), unique=True, index=True, nullable=False)
    reference_type = Column(String(100), nullable=False)  # 'TRANSFER', 'PRODUCTION', 'PURCHASE', 'SALE', 'WASTAGE'
    reference_id = Column(String(100), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Numeric(14, 4), nullable=False)  # negative for deduction, positive for addition
    balance_after = Column(Numeric(14, 4), nullable=False)
    unit_cost = Column(Numeric(12, 2), default=0.00)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="stock_movements")
    product = relationship("Product")
    batch = relationship("Batch")
    user = relationship("User")
