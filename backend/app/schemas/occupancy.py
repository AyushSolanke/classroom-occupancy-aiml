from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class DetectionBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    class_name: str = "person"

class OccupancyRecordCreate(BaseModel):
    classroom_id: int
    detected_count: int = Field(..., ge=0)
    capacity: int = Field(..., gt=0)
    occupancy_percentage: float = Field(..., ge=0.0)
    status: str
    source: str = "IMAGE"
    confidence_avg: Optional[float] = 0.0
    detections_json: Optional[str] = None
    image_path: Optional[str] = None

class OccupancyRecordResponse(BaseModel):
    id: int
    classroom_id: int
    classroom_name: Optional[str] = None
    detected_count: int
    capacity: int
    occupancy_percentage: float
    status: str
    source: str
    confidence_avg: float
    detections_json: Optional[str] = None
    image_path: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedOccupancyResponse(BaseModel):
    items: List[OccupancyRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
