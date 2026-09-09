from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.peru_geo import City
from app.models.weather_record import WeatherRecord
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

@router.get("/dataset")
async def get_real_dataset(
    limit: int = Query(10000, ge=1, le=100000, description="Cantidad máxima de registros a devolver"),
    db: Session = Depends(get_db)
):
    """Devuelve los registros reales del dataset CSV guardados en weather_records."""
    try:
        records = (
            db.query(WeatherRecord, City)
            .join(City, City.id == WeatherRecord.city_id)
            .filter(WeatherRecord.source == "csv")
            .order_by(WeatherRecord.record_date.asc(), WeatherRecord.hour.asc(), City.name.asc())
            .limit(limit)
            .all()
        )
        rows = [
            {
                "id": rec.id,
                "city_name": city.name,
                "department_name": city.department.name if city.department else "",
                "record_date": rec.record_date.isoformat(),
                "hour": rec.hour,
                "temperature": rec.temperature,
                "temp_min": rec.temp_min,
                "temp_max": rec.temp_max,
                "humidity": rec.humidity,
                "precipitation": rec.precipitation,
                "wind_speed": rec.wind_speed,
                "uv_index": rec.uv_index,
                "condition": rec.condition,
                "source": rec.source,
            }
            for rec, city in records
        ]
        return {"count": len(rows), "records": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo el dataset real: {str(e)}")
