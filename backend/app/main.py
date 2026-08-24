from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import Base, engine
from app.seed.seed_data import init_db_and_seed
from app.routers import (
    weather,
    cities,
    departments,
    alerts,
    compare,
    history,
    rankings,
    export,
    favorites
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed Peru geographic data on startup
    init_db_and_seed()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST para el Sistema Web de Clima y Datos Meteorológicos del Perú. Integra Open-Meteo, catálogos geográficos del Perú, pronósticos, comparador, análisis histórico y alertas climáticas.",
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

# Include API Routers
app.include_router(weather.router, prefix=settings.API_V1_STR)
app.include_router(cities.router, prefix=settings.API_V1_STR)
app.include_router(departments.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(compare.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(rankings.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)
app.include_router(favorites.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "Sistema Meteorológico del Perú",
        "status": "Online",
        "docs": "/docs",
        "version": settings.VERSION
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "clima-peru-api"}
