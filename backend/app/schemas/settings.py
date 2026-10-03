from typing import Optional, Dict
from pydantic import BaseModel, Field

class SystemSettingsSchema(BaseModel):
    confidence_threshold: float = Field(default=0.35, ge=0.05, le=1.0)
    iou_threshold: float = Field(default=0.45, ge=0.05, le=1.0)
    process_every_n_frames: int = Field(default=5, ge=1, le=60)
    low_occupancy_threshold: float = Field(default=35.0, ge=1.0, le=100.0)
    moderate_occupancy_threshold: float = Field(default=80.0, ge=1.0, le=100.0)
    full_occupancy_threshold: float = Field(default=95.0, ge=1.0, le=100.0)
    energy_lighting_kw_per_room: float = Field(default=0.6, ge=0.0)
    energy_hvac_kw_per_room: float = Field(default=3.0, ge=0.0)
    energy_cost_per_kwh: float = Field(default=8.0, ge=0.0)
    realtime_update_interval_ms: int = Field(default=3000, ge=500, le=60000)
    demo_mode: bool = False

class SystemHealthResponse(BaseModel):
    frontend_status: str
    backend_status: str
    database_status: str
    ai_model_status: str
    model_name: str
    model_device: str
    total_classrooms: int
    total_records: int
    details: Optional[Dict[str, str]] = None

class DiagnosticCheckItem(BaseModel):
    name: str
    status: str
    tested: bool = True
    details: Optional[str] = None
    version: Optional[str] = None
    latency_ms: Optional[float] = None

class SystemDiagnosticResponse(BaseModel):
    all_systems_operational: bool
    python_env: DiagnosticCheckItem
    opencv: DiagnosticCheckItem
    numpy: DiagnosticCheckItem
    pytorch: DiagnosticCheckItem
    ultralytics: DiagnosticCheckItem
    yolo_model: DiagnosticCheckItem
    backend_api: DiagnosticCheckItem
    database: DiagnosticCheckItem
    image_processing: DiagnosticCheckItem
    ai_inference: DiagnosticCheckItem
    models_status: Dict[str, str]
    evaluation_status: Dict[str, str]
    timestamp: str

