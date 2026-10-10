import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class SOPCategory(str, enum.Enum):
    SEED_RECEIVING = "SEED_RECEIVING"
    STORAGE = "STORAGE"
    OIL_EXTRACTION = "OIL_EXTRACTION"
    MACHINE_CLEANING = "MACHINE_CLEANING"
    QUALITY_CONTROL = "QUALITY_CONTROL"
    PACKAGING = "PACKAGING"
    WASTE_DISPOSAL = "WASTE_DISPOSAL"
    FRANCHISE_OPERATIONS = "FRANCHISE_OPERATIONS"

class SOPStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class SOP(Base):
    __tablename__ = "sops"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(Enum(SOPCategory), nullable=False)
    department = Column(String(100), default="Operations")
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User")
    versions = relationship("SOPVersion", back_populates="sop", cascade="all, delete-orphan")
    acknowledgments = relationship("SOPAcknowledgment", back_populates="sop")

class SOPVersion(Base):
    __tablename__ = "sop_versions"

    id = Column(Integer, primary_key=True, index=True)
    sop_id = Column(Integer, ForeignKey("sops.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(String(20), nullable=False)  # e.g., "v1.0", "v2.0"
    content = Column(Text, nullable=False)  # Full markdown or procedure guidelines
    change_summary = Column(String(255), nullable=True)
    status = Column(Enum(SOPStatus), default=SOPStatus.DRAFT, nullable=False)
    effective_date = Column(DateTime, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sop = relationship("SOP", back_populates="versions")
    approved_by = relationship("User")
    checklists = relationship("SOPChecklistStep", back_populates="sop_version", cascade="all, delete-orphan")

class SOPChecklistStep(Base):
    __tablename__ = "sop_checklist_steps"

    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("sop_versions.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    instruction = Column(Text, nullable=True)
    is_critical = Column(Boolean, default=False)

    sop_version = relationship("SOPVersion", back_populates="checklists")

class SOPAcknowledgment(Base):
    __tablename__ = "sop_acknowledgments"

    id = Column(Integer, primary_key=True, index=True)
    sop_id = Column(Integer, ForeignKey("sops.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(Integer, ForeignKey("sop_versions.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    acknowledged_at = Column(DateTime, default=datetime.utcnow)
    digital_signature = Column(String(100), nullable=False)

    sop = relationship("SOP", back_populates="acknowledgments")
    sop_version = relationship("SOPVersion")
    employee = relationship("Employee")
