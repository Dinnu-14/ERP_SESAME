import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class LocationType(str, enum.Enum):
    FACTORY = "FACTORY"
    WAREHOUSE = "WAREHOUSE"
    FRANCHISE_BRANCH = "FRANCHISE_BRANCH"
    PRODUCTION_UNIT = "PRODUCTION_UNIT"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    locations = relationship("Location", back_populates="organization")
    users = relationship("User", back_populates="organization")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    location_type = Column(Enum(LocationType), default=LocationType.WAREHOUSE, nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    contact_number = Column(String(50), nullable=True)
    manager_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="locations")
    users = relationship("User", back_populates="location")
    stock_balances = relationship("StockBalance", back_populates="location")
    stock_movements = relationship("StockMovement", back_populates="location")
