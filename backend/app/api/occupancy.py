import io
import csv
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.classroom import Classroom
from app.models.occupancy_record import OccupancyRecord
from app.schemas.occupancy import (
    OccupancyRecordCreate,
    OccupancyRecordResponse,
    PaginatedOccupancyResponse
)
from app.services.occupancy_service import calculate_occupancy_and_status

router = APIRouter(prefix="/occupancy", tags=["Occupancy"])

@router.get("/latest")
def get_latest_occupancy(db: Session = Depends(get_db)):
    """Retrieve the most recent occupancy status across all active classrooms."""
    classrooms = db.query(Classroom).filter(Classroom.is_active == True).all()
    results = []

    for cr in classrooms:
        latest = (
            db.query(OccupancyRecord)
            .filter(OccupancyRecord.classroom_id == cr.id)
            .order_by(OccupancyRecord.timestamp.desc())
            .first()
        )

        results.append({
            "classroom_id": cr.id,
            "classroom_name": cr.name,
            "building": cr.building,
            "room_number": cr.room_number,
            "capacity": cr.capacity,
            "detected_count": latest.detected_count if latest else 0,
            "occupancy_percentage": latest.occupancy_percentage if latest else 0.0,
            "status": latest.status if latest else "EMPTY",
            "source": latest.source if latest else "DEFAULT",
            "confidence_avg": latest.confidence_avg if latest else 0.0,
            "image_path": latest.image_path if latest else None,
            "timestamp": latest.timestamp.isoformat() if latest else None
        })

    return results

@router.get("/history", response_model=PaginatedOccupancyResponse)
def get_occupancy_history(
    classroom_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve filtered, paginated historical occupancy logs."""
    query = db.query(OccupancyRecord, Classroom.name.label("classroom_name")).join(
        Classroom, OccupancyRecord.classroom_id == Classroom.id
    )

    if classroom_id:
        query = query.filter(OccupancyRecord.classroom_id == classroom_id)

    if status and status.upper() != "ALL":
        query = query.filter(OccupancyRecord.status == status.upper())

    if source and source.upper() != "ALL":
        query = query.filter(OccupancyRecord.source == source.upper())

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)

    records = (
        query.order_by(desc(OccupancyRecord.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for r, c_name in records:
        rec_dict = OccupancyRecordResponse(
            id=r.id,
            classroom_id=r.classroom_id,
            classroom_name=c_name,
            detected_count=r.detected_count,
            capacity=r.capacity,
            occupancy_percentage=r.occupancy_percentage,
            status=r.status,
            source=r.source,
            confidence_avg=r.confidence_avg or 0.0,
            detections_json=r.detections_json,
            image_path=r.image_path,
            timestamp=r.timestamp
        )
        items.append(rec_dict)

    return PaginatedOccupancyResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("/manual", response_model=OccupancyRecordResponse, status_code=status.HTTP_201_CREATED)
def create_manual_occupancy(
    classroom_id: int,
    detected_count: int,
    db: Session = Depends(get_db)
):
    """Manually log occupancy count for a classroom (e.g. lab verification or ground-truth check)."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id, Classroom.is_active == True).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    pct, st = calculate_occupancy_and_status(detected_count, classroom.capacity, db)

    record = OccupancyRecord(
        classroom_id=classroom.id,
        detected_count=detected_count,
        capacity=classroom.capacity,
        occupancy_percentage=pct,
        status=st,
        source="MANUAL",
        confidence_avg=1.0,
        timestamp=datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return OccupancyRecordResponse(
        id=record.id,
        classroom_id=record.classroom_id,
        classroom_name=classroom.name,
        detected_count=record.detected_count,
        capacity=record.capacity,
        occupancy_percentage=record.occupancy_percentage,
        status=record.status,
        source=record.source,
        confidence_avg=record.confidence_avg,
        image_path=None,
        timestamp=record.timestamp
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_occupancy_record(id: int, db: Session = Depends(get_db)):
    """Remove a specific occupancy record."""
    rec = db.query(OccupancyRecord).filter(OccupancyRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(rec)
    db.commit()
    return None

@router.get("/export")
def export_occupancy_csv(db: Session = Depends(get_db)):
    """Export all occupancy records as a downloadable CSV."""
    records = (
        db.query(OccupancyRecord, Classroom.name.label("classroom_name"), Classroom.room_number)
        .join(Classroom, OccupancyRecord.classroom_id == Classroom.id)
        .order_by(desc(OccupancyRecord.timestamp))
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Date", "Time", "Classroom Name", "Room Number",
        "Students Detected", "Room Capacity", "Occupancy %", "Status", "Detection Source"
    ])

    for r, c_name, r_num in records:
        writer.writerow([
            r.id,
            r.timestamp.strftime("%Y-%m-%d"),
            r.timestamp.strftime("%H:%M:%S"),
            c_name,
            r_num,
            r.detected_count,
            r.capacity,
            f"{r.occupancy_percentage}%",
            r.status,
            r.source
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=occupancy_history_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )
