import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class TransferStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    DISPATCHED = "DISPATCHED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class TransferOrder(Base):
    __tablename__ = "transfer_orders"

    id = Column(Integer, primary_key=True, index=True)
    transfer_number = Column(String(100), unique=True, index=True, nullable=False)
    source_location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.REQUESTED, nullable=False)
    notes = Column(Text, nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dispatched_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    received_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    items = relationship("TransferItem", back_populates="transfer", cascade="all, delete-orphan")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    dispatched_by = relationship("User", foreign_keys=[dispatched_by_id])
    received_by = relationship("User", foreign_keys=[received_by_id])

class TransferItem(Base):
    __tablename__ = "transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfer_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    requested_quantity = Column(Numeric(14, 4), nullable=False)
    dispatched_quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    received_quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    damaged_quantity = Column(Numeric(14, 4), default=0.0000, nullable=False)
    notes = Column(Text, nullable=True)

    transfer = relationship("TransferOrder", back_populates="items")
    product = relationship("Product")
    batch = relationship("Batch")
