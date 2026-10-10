from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.location import LocationType

class OrganizationCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class OrganizationOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LocationCreate(BaseModel):
    organization_id: int
    name: str
    code: str
    location_type: LocationType
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_number: Optional[str] = None
    manager_name: Optional[str] = None

class LocationOut(BaseModel):
    id: int
    organization_id: int
    name: str
    code: str
    location_type: LocationType
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_number: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
