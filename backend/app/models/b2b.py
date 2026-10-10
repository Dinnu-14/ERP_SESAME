import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class B2BOrderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    APPROVED = "APPROVED"
    RESERVED = "RESERVED"
    DISPATCHED = "DISPATCHED"
    INVOICED = "INVOICED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class InvoiceStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class B2BCustomer(Base):
    __tablename__ = "b2b_customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    contact_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    gst_tin = Column(String(50), nullable=True)
    credit_limit = Column(Numeric(14, 2), default=100000.00)
    payment_terms_days = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sales_orders = relationship("B2BSalesOrder", back_populates="customer")
    invoices = relationship("B2BInvoice", back_populates="customer")

class B2BQuotation(Base):
    __tablename__ = "b2b_quotations"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("b2b_customers.id", ondelete="CASCADE"), nullable=False)
    quote_date = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    subtotal = Column(Numeric(14, 2), default=0.00)
    tax_amount = Column(Numeric(14, 2), default=0.00)
    total_amount = Column(Numeric(14, 2), default=0.00)
    status = Column(String(50), default="SENT")  # DRAFT, SENT, ACCEPTED, REJECTED
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("B2BCustomer")
    created_by = relationship("User")

class B2BSalesOrder(Base):
    __tablename__ = "b2b_sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    so_number = Column(String(100), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("b2b_customers.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    delivery_due_date = Column(DateTime, nullable=True)
    status = Column(Enum(B2BOrderStatus), default=B2BOrderStatus.DRAFT, nullable=False)
    subtotal = Column(Numeric(14, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(14, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(14, 2), default=0.00, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("B2BCustomer", back_populates="sales_orders")
    location = relationship("Location")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("B2BSalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    invoices = relationship("B2BInvoice", back_populates="sales_order")

class B2BSalesOrderItem(Base):
    __tablename__ = "b2b_sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("b2b_sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Numeric(14, 4), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_percent = Column(Numeric(5, 2), default=5.00)
    total_price = Column(Numeric(14, 2), nullable=False)

    sales_order = relationship("B2BSalesOrder", back_populates="items")
    product = relationship("Product")
    batch = relationship("Batch")

class B2BInvoice(Base):
    __tablename__ = "b2b_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    sales_order_id = Column(Integer, ForeignKey("b2b_sales_orders.id", ondelete="SET NULL"), nullable=True)
    customer_id = Column(Integer, ForeignKey("b2b_customers.id", ondelete="CASCADE"), nullable=False)
    invoice_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    paid_amount = Column(Numeric(14, 2), default=0.00, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.UNPAID, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sales_order = relationship("B2BSalesOrder", back_populates="invoices")
    customer = relationship("B2BCustomer", back_populates="invoices")
    payments = relationship("B2BPayment", back_populates="invoice", cascade="all, delete-orphan")

class B2BPayment(Base):
    __tablename__ = "b2b_payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String(100), unique=True, index=True, nullable=False)
    invoice_id = Column(Integer, ForeignKey("b2b_invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String(50), default="BANK_TRANSFER")
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    received_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("B2BInvoice", back_populates="payments")
    received_by = relationship("User")
