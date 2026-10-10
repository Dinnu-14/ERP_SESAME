from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import Employee, Attendance, User, UserRole
from app.schemas.employee import (
    EmployeeCreate, EmployeeOut, AttendanceCreate, AttendanceOut
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    location_id: Optional[int] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)
    if location_id:
        query = query.filter(Employee.location_id == location_id)
    if department:
        query = query.filter(Employee.department == department)
    return query.all()

@router.post("", response_model=EmployeeOut)
def create_employee(
    emp_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied to add employee profiles")

    emp = Employee(**emp_in.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.post("/attendance", response_model=AttendanceOut)
def record_attendance(
    att_in: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    att = Attendance(
        employee_id=att_in.employee_id,
        date=att_in.date or datetime.utcnow(),
        status=att_in.status,
        check_in=att_in.check_in,
        check_out=att_in.check_out,
        notes=att_in.notes
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att
