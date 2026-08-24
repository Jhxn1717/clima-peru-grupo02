from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.services.weather_service import WeatherService
from app.schemas.history import HistoryResponse

router = APIRouter(prefix="/history", tags=["Análisis Climático e Historial"])

@router.get("", response_model=HistoryResponse)
async def get_weather_history(
    city_id: int = Query(..., description="ID de la ciudad peruana"),
    start_date: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD (por defecto hace 30 días)"),
    end_date: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD (por defecto hoy)"),
    variable: str = Query("temperature", description="Variable a analizar: temperature, precipitation, wind, humidity"),
    db: Session = Depends(get_db)
):
    if not end_date:
        end_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    try:
        history = await WeatherService.get_history(
            city_id=city_id,
            start_date=start_date,
            end_date=end_date,
            variable=variable,
            db=db
        )
        return history
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar análisis histórico: {str(e)}")
