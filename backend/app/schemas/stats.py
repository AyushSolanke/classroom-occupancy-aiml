from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class DashboardKPICards(BaseModel):
    total_classrooms: int
    occupied_classrooms: int
    empty_classrooms: int
    total_students_detected: int
    average_occupancy_percentage: float
    energy_saving_opportunity: str  # e.g., "3 Classrooms (10.8 kW potential)"
    estimated_active_power_kw: float
    estimated_wasted_power_kw: float

class StatusDistributionItem(BaseModel):
    name: str  # EMPTY, LOW OCCUPANCY, MODERATE OCCUPANCY, FULL
    count: int
    percentage: float
    color: str

class ClassroomUtilizationItem(BaseModel):
    id: int
    name: str
    capacity: int
    current_occupancy: int
    occupancy_percentage: float
    status: str
    last_updated: Optional[str] = None

class OccupancyOverTimeItem(BaseModel):
    time: str
    timestamp: str
    average_occupancy: float
    total_detected: int

class EnergyRecommendation(BaseModel):
    id: str
    classroom_id: int
    classroom_name: str
    status: str
    occupancy_percentage: float
    detected_count: int
    capacity: int
    recommendation: str
    severity: str  # info, warning, success, alert
    action_type: str  # "SHUTDOWN_ALL", "POWER_REDUCE", "CONSOLIDATE", "NORMAL_OPERATION"
    estimated_savings_kw: float
    estimated_savings_cost_per_hour: float

class AIInsightItem(BaseModel):
    title: str
    category: str  # "utilization", "scheduling", "energy", "anomaly"
    summary: str
    detail: str
    recommendation: str
    impact_level: str  # High, Medium, Low
    data_points: Optional[Dict[str, Any]] = None

class ModelEvaluationSample(BaseModel):
    classroom_name: str
    predicted_count: int
    actual_count: int
    error: int
    timestamp: str
    actual_status: Optional[str] = None
    predicted_status: Optional[str] = None

class ModelEvaluationResponse(BaseModel):
    evaluated: bool
    sample_size: int
    active_model: str = "YOLOv8"
    primary_metric: str = "MAE (Counting)"
    mae: Optional[float] = None
    rmse: Optional[float] = None
    accuracy: Optional[float] = None
    samples: List[ModelEvaluationSample] = []
    message: str

class ClassroomAllocationItem(BaseModel):
    classroom_id: int
    classroom_name: str
    capacity: int
    current_occupancy: int
    utilization_percentage: float
    status: str
    recommended_action: str
    suggested_room_type: str
    reason: str

