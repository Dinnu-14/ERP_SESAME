import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

class ProductionBatchStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    QUALITY_CHECK = "QUALITY_CHECK"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"

class QualityStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    REJECTED = "REJECTED"

class ProductionBatch(Base):
    __tablename__ = "production_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(100), unique=True, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    
    # Input seed
    seed_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    seed_batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    seed_input_qty = Column(Numeric(14, 4), nullable=False)  # in KG
    
    # Outputs
    oil_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    oil_output_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)  # in Liters or KG
    oil_batch_number = Column(String(100), nullable=True)
    
    cake_product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    cake_output_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)  # in KG
    cake_batch_number = Column(String(100), nullable=True)
    
    # Mass Balance & Yields
    recorded_loss_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)  # in KG
    unexplained_variance_qty = Column(Numeric(14, 4), default=0.0000, nullable=False)  # in KG
    
    expected_oil_yield_pct = Column(Numeric(5, 2), default=45.00, nullable=False)  # Configurable e.g. 45%
    actual_oil_yield_pct = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    status = Column(Enum(ProductionBatchStatus), default=ProductionBatchStatus.PLANNED, nullable=False)
    notes = Column(Text, nullable=True)
    
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location")
    seed_product = relationship("Product", foreign_keys=[seed_product_id])
    seed_batch = relationship("Batch", foreign_keys=[seed_batch_id])
    oil_product = relationship("Product", foreign_keys=[oil_product_id])
    cake_product = relationship("Product", foreign_keys=[cake_product_id])
    operator = relationship("User", foreign_keys=[operator_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    quality_checks = relationship("ProductionQualityCheck", back_populates="production_batch", cascade="all, delete-orphan")

class ProductionQualityCheck(Base):
    __tablename__ = "production_quality_checks"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("production_batches.id", ondelete="CASCADE"), nullable=False)
    test_date = Column(DateTime, default=datetime.utcnow)
    free_fatty_acids_pct = Column(Numeric(5, 3), nullable=True)  # FFA % e.g. 0.8%
    moisture_pct = Column(Numeric(5, 3), nullable=True)          # e.g. 0.15%
    color = Column(String(50), nullable=True)                   # Golden yellow, clear
    odor = Column(String(100), nullable=True)                   # Pleasant, characteristic nutty aroma
    density_g_ml = Column(Numeric(6, 4), nullable=True)         # ~0.920
    status = Column(Enum(QualityStatus), default=QualityStatus.PENDING, nullable=False)
    tested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comments = Column(Text, nullable=True)

    production_batch = relationship("ProductionBatch", back_populates="quality_checks")
    tested_by = relationship("User")
