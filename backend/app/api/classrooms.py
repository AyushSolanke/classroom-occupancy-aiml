from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomResponse

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(
    search: Optional[str] = Query(None, description="Search by name, room number, or building"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db)
):
    """Retrieve all classrooms with their latest real occupancy details."""
    query = db.query(Classroom).filter(Classroom.is_active == True)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Classroom.name.ilike(s)) |
            (Classroom.room_number.ilike(s)) |
            (Classroom.building.ilike(s))
        )

    if department:
        query = query.filter(Classroom.department == department)

    classrooms = query.order_by(Classroom.name.asc()).all()

    results = []
    for cr in classrooms:
        # Fetch latest occupancy record
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        latest_info = None
        if latest:
            latest_info = {
                "detected_count": latest.detected_count,
                "capacity": latest.capacity,
                "occupancy_percentage": latest.occupancy_percentage,
                "status": latest.status,
                "source": latest.source,
                "timestamp": latest.timestamp.isoformat(),
                "confidence_avg": latest.confidence_avg
            }
        else:
            latest_info = {
                "detected_count": 0,
                "capacity": cr.capacity,
                "occupancy_percentage": 0.0,
                "status": "EMPTY",
                "source": "DEFAULT",
                "timestamp": None,
                "confidence_avg": 0.0
            }

        cr_dict = ClassroomResponse.model_validate(cr).model_dump()
        cr_dict["latest_occupancy"] = latest_info
        results.append(cr_dict)

    return results

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(classroom_in: ClassroomCreate, db: Session = Depends(get_db)):
    """Add a new classroom to the system."""
    existing = db.query(Classroom).filter(
        Classroom.building == classroom_in.building,
        Classroom.room_number == classroom_in.room_number,
        Classroom.is_active == True
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Classroom {classroom_in.room_number} in {classroom_in.building} already exists."
        )

    cr = Classroom(**classroom_in.model_dump())
    db.add(cr)
    db.commit()
    db.refresh(cr)

    cr_dict = ClassroomResponse.model_validate(cr).model_dump()
    cr_dict["latest_occupancy"] = {
        "detected_count": 0,
        "capacity": cr.capacity,
        "occupancy_percentage": 0.0,
        "status": "EMPTY",
        "source": "DEFAULT",
        "timestamp": None
    }
    return cr_dict

@router.get("/{id}")
def get_classroom_detail(id: int, db: Session = Depends(get_db)):
    """Fetch complete classroom profile, occupancy statistics, and recent detection history."""
    cr = db.query(Classroom).filter(Classroom.id == id, Classroom.is_active == True).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    # Latest record
    latest = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.classroom_id == id)
        .order_by(OccupancyRecord.timestamp.desc())
        .first()
    )

    # Recent 10 detections
    recent_records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.classroom_id == id)
        .order_by(OccupancyRecord.timestamp.desc())
        .limit(10)
        .all()
    )

    # Average stats
    stats = (
        db.query(
            func.avg(OccupancyRecord.occupancy_percentage).label("avg_pct"),
            func.max(OccupancyRecord.occupancy_percentage).label("max_pct"),
            func.count(OccupancyRecord.id).label("total_runs")
        )
        .filter(OccupancyRecord.classroom_id == id)
        .first()
    )

    avg_occupancy = round(stats.avg_pct, 1) if stats and stats.avg_pct is not None else 0.0
    max_occupancy = round(stats.max_pct, 1) if stats and stats.max_pct is not None else 0.0
    total_detections = stats.total_runs if stats and stats.total_runs is not None else 0

    return {
        "classroom": ClassroomResponse.model_validate(cr),
        "latest_occupancy": latest,
        "statistics": {
            "average_occupancy_percentage": avg_occupancy,
            "peak_occupancy_percentage": max_occupancy,
            "total_detections_logged": total_detections
        },
        "recent_detections": recent_records
    }

@router.put("/{id}", response_model=ClassroomResponse)
def update_classroom(id: int, classroom_in: ClassroomUpdate, db: Session = Depends(get_db)):
    """Update classroom specifications."""
    cr = db.query(Classroom).filter(Classroom.id == id, Classroom.is_active == True).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    update_data = classroom_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cr, key, value)

    db.commit()
    db.refresh(cr)
    return cr

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(id: int, db: Session = Depends(get_db)):
    """Soft delete classroom or remove if desired."""
    cr = db.query(Classroom).filter(Classroom.id == id).first()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    cr.is_active = False
    db.commit()
    return None
