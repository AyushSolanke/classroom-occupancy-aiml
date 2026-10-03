from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ClassroomBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    building: str = Field(..., min_length=1, max_length=100)
    floor: int = Field(default=1, ge=-2, le=50)
    room_number: str = Field(..., min_length=1, max_length=50)
    capacity: int = Field(..., gt=0, le=1000)
    camera_id: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    building: Optional[str] = Field(None, min_length=1, max_length=100)
    floor: Optional[int] = Field(None, ge=-2, le=50)
    room_number: Optional[str] = Field(None, min_length=1, max_length=50)
    capacity: Optional[int] = Field(None, gt=0, le=1000)
    camera_id: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class ClassroomResponse(ClassroomBase):
    id: int
    created_at: datetime
    updated_at: datetime
    latest_occupancy: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)
