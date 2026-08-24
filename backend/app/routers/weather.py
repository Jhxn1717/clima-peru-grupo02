from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService
from app.schemas.weather import CurrentWeather, FullForecastResponse, HourlyForecastItem, DailyForecastItem, DepartmentWeatherSummary

router = APIRouter(prefix="/weather", tags=["Clima y Meteorología"])

@router.get("/forecast", response_model=FullForecastResponse)
async def get_full_forecast(
    city_id: Optional[int] = Query(None, description="ID de la ciudad peruana"),
    lat: Optional[float] = Query(None, description="Latitud personalizada"),
    lon: Optional[float] = Query(None, description="Longitud personalizada"),
    db: Session = Depends(get_db)
):
    # Default to Lima (id=1) if nothing provided
    if not city_id and (lat is None or lon is None):
        first_city = db.query(City).filter(City.name == "Lima").first()
        if first_city:
            city_id = first_city.id
            lat = first_city.latitude
            lon = first_city.longitude
        else:
            lat = -12.0464
            lon = -77.0428

    try:
        forecast = await WeatherService.get_forecast(
            lat=lat or -12.0464,
            lon=lon or -77.0428,
            city_id=city_id,
            db=db
        )
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo pronóstico meteorológico: {str(e)}")

@router.get("/current", response_model=CurrentWeather)
async def get_current_weather(
    city_id: Optional[int] = Query(None, description="ID de la ciudad"),
    lat: Optional[float] = Query(None, description="Latitud"),
    lon: Optional[float] = Query(None, description="Longitud"),
    db: Session = Depends(get_db)
):
    forecast = await get_full_forecast(city_id=city_id, lat=lat, lon=lon, db=db)
    return forecast.current

@router.get("/hourly", response_model=List[HourlyForecastItem])
async def get_hourly_forecast(
    city_id: Optional[int] = Query(None, description="ID de la ciudad"),
    lat: Optional[float] = Query(None, description="Latitud"),
    lon: Optional[float] = Query(None, description="Longitud"),
    db: Session = Depends(get_db)
):
    forecast = await get_full_forecast(city_id=city_id, lat=lat, lon=lon, db=db)
    return forecast.hourly

@router.get("/overview", response_model=List[DepartmentWeatherSummary])
async def get_weather_overview(db: Session = Depends(get_db)):
    try:
        summaries = await WeatherService.get_departments_summary(db)
        return summaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cargando resumen nacional: {str(e)}")
