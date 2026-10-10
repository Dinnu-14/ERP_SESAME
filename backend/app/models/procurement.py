import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class POStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class InspectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PARTIALLY_ACCEPTED = "PARTIALLY_ACCEPTED"

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    gst_tin = Column(String(50), nullable=True)
    rating = Column(Numeric(3, 2), default=5.00)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(100), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery_date = Column(DateTime, nullable=True)
    status = Column(Enum(POStatus), default=POStatus.DRAFT, nullable=False)
    total_amount = Column(Numeric(14, 2), default=0.00, nullable=False)
    payment_terms = Column(String(100), default="Net 30")
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    destination_location = relationship("Location")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    goods_receipts = relationship("GoodsReceipt", back_populates="purchase_order")
    created_by = relationship("User")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(14, 4), nullable=False)
    received_quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_percent = Column(Numeric(5, 2), default=0.00)
    total_amount = Column(Numeric(14, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"

    id = Column(Integer, primary_key=True, index=True)
    grn_number = Column(String(100), unique=True, index=True, nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    received_date = Column(DateTime, default=datetime.utcnow)
    supplier_invoice_no = Column(String(100), nullable=True)
    inspection_status = Column(Enum(InspectionStatus), default=InspectionStatus.PENDING, nullable=False)
    total_received_amount = Column(Numeric(14, 2), default=0.00)
    notes = Column(Text, nullable=True)
    received_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="goods_receipts")
    supplier = relationship("Supplier")
    location = relationship("Location")
    received_by = relationship("User")
    items = relationship("GoodsReceiptItem", back_populates="goods_receipt", cascade="all, delete-orphan")

class GoodsReceiptItem(Base):
    __tablename__ = "goods_receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("goods_receipts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=False)
    received_quantity = Column(Numeric(14, 4), nullable=False)
    accepted_quantity = Column(Numeric(14, 4), nullable=False)
    rejected_quantity = Column(Numeric(14, 4), default=0.0000)
    unit_price = Column(Numeric(12, 2), nullable=False)
    moisture_pct = Column(Numeric(5, 2), nullable=True)
    foreign_matter_pct = Column(Numeric(5, 2), nullable=True)
    rejection_reason = Column(String(255), nullable=True)

    goods_receipt = relationship("GoodsReceipt", back_populates="items")
    product = relationship("Product")
