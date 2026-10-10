from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.location import Organization, Location
from app.models.user import User, UserRole
from app.schemas.location import OrganizationCreate, OrganizationOut, LocationCreate, LocationOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/locations", tags=["Locations & Warehouses"])

@router.get("/organizations", response_model=List[OrganizationOut])
def get_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Organization).all()

@router.post("/organizations", response_model=OrganizationOut)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin permission required")
    org = Organization(**org_in.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("", response_model=List[LocationOut])
def list_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER, UserRole.AUDITOR]:
        return db.query(Location).all()
    # If user belongs to a specific branch/location, allow seeing all or assigned
    return db.query(Location).all()

@router.post("", response_model=LocationOut)
def create_location(
    loc_in: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    loc = Location(**loc_in.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc
