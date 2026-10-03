import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Classroom Occupancy Detection Using AI"
    ACADEMIC_CONTEXT: str = "Applied Machine Learning for Industry Solutions (PECO311C)"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'smart_classroom.db'}"

    # AI Model settings
    MODEL_PATH: str = str(BASE_DIR / "models" / "yolov8n.pt")
    CONFIDENCE_THRESHOLD: float = 0.35
    IOU_THRESHOLD: float = 0.45
    PROCESS_EVERY_N_FRAMES: int = 5

    # File uploads
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_IMAGE_SIZE_MB: int = 15
    MAX_VIDEO_SIZE_MB: int = 100

    # Classroom Occupancy Thresholds (Configurable)
    LOW_OCCUPANCY_THRESHOLD: float = 35.0
    MODERATE_OCCUPANCY_THRESHOLD: float = 80.0
    FULL_OCCUPANCY_THRESHOLD: float = 95.0

    # Energy calculations
    ENERGY_LIGHTING_KW_PER_ROOM: float = 0.6
    ENERGY_HVAC_KW_PER_ROOM: float = 3.0
    ENERGY_COST_PER_KWH: float = 8.0

    # Polling & System settings
    REALTIME_UPDATE_INTERVAL_MS: int = 3000
    DEMO_MODE: bool = False

    # Optional AI Assistant / LLM settings
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-1.5-flash"

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)
