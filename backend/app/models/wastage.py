import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class WastageType(str, enum.Enum):
    CLEANING_LOSS = "CLEANING_LOSS"
    REJECTED_RAW_MATERIAL = "REJECTED_RAW_MATERIAL"
    OIL_SPILL = "OIL_SPILL"
    PROCESSING_RESIDUE = "PROCESSING_RESIDUE"
    DAMAGED_PRODUCT = "DAMAGED_PRODUCT"
    PACKAGING_LOSS = "PACKAGING_LOSS"
    HANDLING_LOSS = "HANDLING_LOSS"
    STOCK_DISCREPANCY = "STOCK_DISCREPANCY"

class WastageStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class WastageRecord(Base):
    __tablename__ = "wastage_records"

    id = Column(Integer, primary_key=True, index=True)
    waste_number = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Numeric(14, 4), nullable=False)
    wastage_type = Column(Enum(WastageType), nullable=False)
    estimated_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    reason = Column(String(255), nullable=False)
    disposal_method = Column(String(255), default="Destroyed/Disposed")  # E.g. "Sold to animal feed", "Safe chemical disposal", "Recycled"
    is_recoverable = Column(Boolean, default=False)
    status = Column(Enum(WastageStatus), default=WastageStatus.PENDING, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location")
    product = relationship("Product")
    batch = relationship("Batch")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
