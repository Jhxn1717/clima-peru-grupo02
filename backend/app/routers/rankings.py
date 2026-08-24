from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/rankings", tags=["Rankings y Estadísticas Nacionales"])

@router.get("")
async def get_national_rankings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    cities = db.query(City).filter(City.is_featured == True).all()
    city_weather_list = []

    for c in cities:
        try:
            forecast = await WeatherService.get_forecast(
                lat=c.latitude,
                lon=c.longitude,
                city_id=c.id,
                db=db
            )
            curr = forecast.current
            city_weather_list.append({
                "city_id": c.id,
                "city_name": c.name,
                "department_name": c.department.name if c.department else "",
                "region_natural": c.department.region_natural if c.department else "",
                "altitude": c.altitude,
                "temperature": curr.temperature,
                "temp_max": curr.temp_max,
                "temp_min": curr.temp_min,
                "uv_index": curr.uv_index,
                "precipitation": curr.precipitation,
                "precipitation_probability": curr.precipitation_probability or 0,
                "wind_speed": curr.wind_speed,
                "relative_humidity": curr.relative_humidity,
                "weather_description": curr.weather_description,
                "weather_icon": curr.weather_icon
            })
        except Exception as e:
            print(f"Error rank for {c.name}: {e}")

    # Top Hottest
    top_hottest = sorted(city_weather_list, key=lambda x: x["temperature"], reverse=True)[:5]
    # Top Coldest
    top_coldest = sorted(city_weather_list, key=lambda x: x["temperature"])[:5]
    # Top UV
    top_uv = sorted(city_weather_list, key=lambda x: x["uv_index"], reverse=True)[:5]
    # Top Rain / Precip
    top_rain = sorted(city_weather_list, key=lambda x: (x["precipitation"], x["precipitation_probability"]), reverse=True)[:5]
    # Top Wind
    top_wind = sorted(city_weather_list, key=lambda x: x["wind_speed"], reverse=True)[:5]

    return {
        "hottest": top_hottest,
        "coldest": top_coldest,
        "highest_uv": top_uv,
        "rainiest": top_rain,
        "windiest": top_wind,
        "total_cities_evaluated": len(city_weather_list)
    }
