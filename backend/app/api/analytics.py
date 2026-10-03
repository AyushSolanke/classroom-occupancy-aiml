from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.analytics_service import (
    get_dashboard_kpis,
    get_status_distribution,
    get_classroom_utilization,
    get_occupancy_over_time,
    get_ai_insights,
    get_model_evaluation,
    get_classroom_allocation
)
from app.schemas.stats import (
    DashboardKPICards,
    StatusDistributionItem,
    ClassroomUtilizationItem,
    OccupancyOverTimeItem,
    AIInsightItem,
    ModelEvaluationResponse,
    ClassroomAllocationItem
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/kpis", response_model=DashboardKPICards)
def get_kpis(db: Session = Depends(get_db)):
    """Fetch live Key Performance Indicators based on actual database occupancy states."""
    return get_dashboard_kpis(db)

@router.get("/distribution", response_model=List[StatusDistributionItem])
def get_distribution(db: Session = Depends(get_db)):
    """Fetch classroom occupancy status distribution (EMPTY, LOW, MODERATE, FULL)."""
    return get_status_distribution(db)

@router.get("/utilization", response_model=List[ClassroomUtilizationItem])
def get_utilization(db: Session = Depends(get_db)):
    """Fetch all active classrooms ranked by their utilization percentage."""
    return get_classroom_utilization(db)

@router.get("/trend", response_model=List[OccupancyOverTimeItem])
def get_trend(days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    """Fetch historical occupancy trends for time-series charts."""
    return get_occupancy_over_time(db, days=days)

@router.get("/insights", response_model=List[AIInsightItem])
def get_insights(db: Session = Depends(get_db)):
    """Generate predictive and descriptive analytical insights based on logged history."""
    return get_ai_insights(db)

@router.get("/evaluation", response_model=ModelEvaluationResponse)
def get_evaluation(db: Session = Depends(get_db)):
    """Fetch real-time model evaluation metrics (MAE, RMSE, Accuracy) based on ground-truth checks."""
    return get_model_evaluation(db)

@router.get("/allocation", response_model=List[ClassroomAllocationItem])
def get_allocation(db: Session = Depends(get_db)):
    """Fetch data-driven classroom allocation optimization recommendations."""
    return get_classroom_allocation(db)

