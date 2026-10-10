from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.sop import SOPCategory, SOPStatus

class SOPChecklistStepCreate(BaseModel):
    step_number: int
    title: str
    instruction: Optional[str] = None
    is_critical: bool = False

class SOPChecklistStepOut(BaseModel):
    id: int
    version_id: int
    step_number: int
    title: str
    instruction: Optional[str] = None
    is_critical: bool

    class Config:
        from_attributes = True

class SOPVersionCreate(BaseModel):
    version_number: str
    content: str
    change_summary: Optional[str] = None
    checklists: List[SOPChecklistStepCreate] = []

class SOPVersionOut(BaseModel):
    id: int
    sop_id: int
    version_number: str
    content: str
    change_summary: Optional[str] = None
    status: SOPStatus
    effective_date: Optional[datetime] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    checklists: List[SOPChecklistStepOut] = []

    class Config:
        from_attributes = True

class SOPCreate(BaseModel):
    code: str
    title: str
    category: SOPCategory
    department: str = "Operations"
    description: Optional[str] = None
    initial_version: Optional[SOPVersionCreate] = None

class SOPAcknowledgmentCreate(BaseModel):
    sop_id: int
    version_id: int
    employee_id: int
    digital_signature: str

class SOPAcknowledgmentOut(BaseModel):
    id: int
    sop_id: int
    version_id: int
    employee_id: int
    acknowledged_at: datetime
    digital_signature: str

    class Config:
        from_attributes = True

class SOPOut(BaseModel):
    id: int
    code: str
    title: str
    category: SOPCategory
    department: str
    description: Optional[str] = None
    created_at: datetime
    versions: List[SOPVersionOut] = []
    acknowledgments: List[SOPAcknowledgmentOut] = []

    class Config:
        from_attributes = True
