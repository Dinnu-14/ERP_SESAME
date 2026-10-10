import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class MaterialOwnership(str, enum.Enum):
    COMPANY_OWNED = "COMPANY_OWNED"
    CUSTOMER_OWNED = "CUSTOMER_OWNED"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"

class ReplenishmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    DISPATCHED = "DISPATCHED"
    FULFILLED = "FULFILLED"
    REJECTED = "REJECTED"

class FranchiseExtraction(Base):
    __tablename__ = "franchise_extractions"

    id = Column(Integer, primary_key=True, index=True)
    extraction_number = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    
    # Ownership
    ownership = Column(Enum(MaterialOwnership), default=MaterialOwnership.COMPANY_OWNED, nullable=False)
    customer_name = Column(String(100), nullable=True)  # Populated if customer owned
    customer_phone = Column(String(50), nullable=True)
    service_charge = Column(Numeric(10, 2), default=0.00)
    is_service_paid = Column(Boolean, default=True)

    # Seed input
    seed_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    seed_batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True) # nullable if customer owned
    seed_input_qty = Column(Numeric(14, 4), nullable=False)  # in KG
    
    # Outputs
    oil_output_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)
    cake_output_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)
    waste_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)
    
    date = Column(DateTime, default=datetime.utcnow)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location")
    seed_product = relationship("Product")
    seed_batch = relationship("Batch")
    operator = relationship("User")

class FranchiseSale(Base):
    __tablename__ = "franchise_sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    customer_name = Column(String(100), default="Walk-in Customer")
    customer_phone = Column(String(50), nullable=True)
    subtotal = Column(Numeric(12, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00)
    tax_amount = Column(Numeric(12, 2), default=0.00)
    total_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    sale_date = Column(DateTime, default=datetime.utcnow)
    cashier_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location")
    cashier = relationship("User")
    items = relationship("FranchiseSaleItem", back_populates="sale", cascade="all, delete-orphan")

class FranchiseSaleItem(Base):
    __tablename__ = "franchise_sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("franchise_sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Numeric(14, 4), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)

    sale = relationship("FranchiseSale", back_populates="items")
    product = relationship("Product")
    batch = relationship("Batch")

class ReplenishmentRequest(Base):
    __tablename__ = "replenishment_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ReplenishmentStatus), default=ReplenishmentStatus.REQUESTED, nullable=False)
    notes = Column(Text, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location")
    requested_by = relationship("User")
    items = relationship("ReplenishmentRequestItem", back_populates="request", cascade="all, delete-orphan")

class ReplenishmentRequestItem(Base):
    __tablename__ = "replenishment_request_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("replenishment_requests.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    requested_quantity = Column(Numeric(14, 4), nullable=False)
    approved_quantity = Column(Numeric(14, 4), default=0.0000)

    request = relationship("ReplenishmentRequest", back_populates="items")
    product = relationship("Product")
