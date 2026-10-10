import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    FACTORY_MANAGER = "FACTORY_MANAGER"
    PRODUCTION_MANAGER = "PRODUCTION_MANAGER"
    STORE_MANAGER = "STORE_MANAGER"
    FRANCHISE_MANAGER = "FRANCHISE_MANAGER"
    INVENTORY_OPERATOR = "INVENTORY_OPERATOR"
    B2B_SALES_MANAGER = "B2B_SALES_MANAGER"
    HR_MANAGER = "HR_MANAGER"
    QUALITY_MANAGER = "QUALITY_MANAGER"
    ACCOUNTANT = "ACCOUNTANT"
    EMPLOYEE = "EMPLOYEE"
    AUDITOR = "AUDITOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    location = relationship("Location", back_populates="users")
    employee_profile = relationship("Employee", back_populates="user", uselist=False)

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=False)
    job_title = Column(String(100), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    shift = Column(String(50), default="General 9AM-6PM")
    employment_status = Column(String(50), default="ACTIVE")  # ACTIVE, ON_LEAVE, TERMINATED
    date_of_joining = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="employee_profile")
    location = relationship("Location")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="PRESENT")  # PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE
    check_in = Column(String(20), nullable=True)
    check_out = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="attendances")
