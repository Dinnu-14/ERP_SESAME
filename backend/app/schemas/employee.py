from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class EmployeeCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: str
    job_title: str
    location_id: Optional[int] = None
    shift: str = "General 9AM-6PM"
    employment_status: str = "ACTIVE"
    date_of_joining: Optional[datetime] = None

class AttendanceCreate(BaseModel):
    employee_id: int
    date: Optional[datetime] = None
    status: str = "PRESENT"
    check_in: Optional[str] = "09:00 AM"
    check_out: Optional[str] = "06:00 PM"
    notes: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    date: datetime
    status: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class EmployeeOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    employee_code: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: str
    job_title: str
    location_id: Optional[int] = None
    shift: str
    employment_status: str
    date_of_joining: datetime
    created_at: datetime
    attendances: List[AttendanceOut] = []

    class Config:
        from_attributes = True
