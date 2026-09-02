import os
import json

try:
    from dotenv import load_dotenv
    # Cargar variables desde .env (raíz del proyecto o carpeta backend)
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
    load_dotenv()
except ImportError:
    pass

# Detectar entorno serverless de Vercel o Linux read-only
is_serverless = os.getenv("VERCEL") == "1" or (os.path.exists("/tmp") and os.name != "nt")
default_db_url = "sqlite:////tmp/clima_peru.db" if is_serverless else "sqlite:///./clima_peru.db"

def _get_cors_origins() -> list:
    raw = os.getenv("CORS_ORIGINS", "*")
    if not raw or raw == "*":
        return ["*"]
    if raw.startswith("["):
        try:
            return json.loads(raw)
        except Exception:
            pass
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

class Settings:
    PROJECT_NAME: str = "Sistema Meteorológico del Perú - Clima Perú"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db_url)
    CACHE_TTL_MINUTES: int = 15
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_HISTORICAL_URL: str = "https://archive-api.open-meteo.com/v1"
    CORS_ORIGINS: list = _get_cors_origins()

    # Autenticación (JWT)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "clave-super-secreta-de-desarrollo-cambiar-en-produccion")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", 60))
    VERIFICATION_CODE_EXPIRE_MINUTES: int = int(os.getenv("VERIFICATION_CODE_EXPIRE_MINUTES", 15))

    # SMTP / Email (verificación por correo)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "")

settings = Settings()
