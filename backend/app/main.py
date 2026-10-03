import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.init_db import init_db
from app.ai.detector import YOLODetector
from app.api import classrooms, occupancy, analyze, analytics, energy, settings as settings_api, health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_classroom")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    # Initialize DB schema & seed data
    init_db()
    # Preload YOLO model
    detector = YOLODetector()
    if detector.is_ready:
        logger.info("YOLOv8 person detector ready.")
    else:
        logger.warning(f"YOLO detector status: {detector.status_info}")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI-based Smart Classroom Occupancy Detection, Analytics, and Energy Management.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded and annotated images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(classrooms.router, prefix=settings.API_V1_PREFIX)
app.include_router(occupancy.router, prefix=settings.API_V1_PREFIX)
app.include_router(analyze.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(energy.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_api.router, prefix=settings.API_V1_PREFIX)
app.include_router(health.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "academic_context": settings.ACADEMIC_CONTEXT,
        "version": settings.VERSION,
        "status": "operational",
        "api_docs": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
