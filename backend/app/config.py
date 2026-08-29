import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel
    class BaseSettings(BaseModel):
        pass

# Detectar entorno serverless de Vercel o Linux read-only
is_serverless = os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt")
default_db_url = "sqlite:////tmp/clima_peru.db" if is_serverless else "sqlite:///./clima_peru.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema Meteorológico del Perú - Clima Perú"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db_url)
    CACHE_TTL_MINUTES: int = 15
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_HISTORICAL_URL: str = "https://archive-api.open-meteo.com/v1"
    CORS_ORIGINS: list = ["*"]

settings = Settings()
