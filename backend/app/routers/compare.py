from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService
from app.schemas.compare import CompareResponse, CityComparisonItem

router = APIRouter(prefix="/compare", tags=["Comparación de Ciudades"])

@router.get("", response_model=CompareResponse)
async def compare_cities(
    city_ids: str = Query(..., description="IDs de ciudades separados por coma, ej: 1,7,10 (de 2 a 4 ciudades)"),
    db: Session = Depends(get_db)
):
    try:
        id_list = [int(x.strip()) for x in city_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de IDs inválido. Use números separados por comas.")

    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Debe seleccionar al menos 2 ciudades para comparar.")
    if len(id_list) > 4:
        raise HTTPException(status_code=400, detail="Puede comparar un máximo de 4 ciudades simultáneamente.")

    cities = db.query(City).filter(City.id.in_(id_list)).all()
    if not cities:
        raise HTTPException(status_code=404, detail="No se encontraron las ciudades especificadas.")

    comparison_items: List[CityComparisonItem] = []

    for c in cities:
        try:
            forecast = await WeatherService.get_forecast(
                lat=c.latitude,
                lon=c.longitude,
                city_id=c.id,
                db=db
            )
            curr = forecast.current
            comparison_items.append(CityComparisonItem(
                city_id=c.id,
                city_name=c.name,
                department_name=c.department.name if c.department else "",
                region_natural=c.department.region_natural if c.department else "",
                altitude=c.altitude,
                temperature=curr.temperature,
                apparent_temperature=curr.apparent_temperature,
                relative_humidity=curr.relative_humidity,
                precipitation=curr.precipitation,
                wind_speed=curr.wind_speed,
                uv_index=curr.uv_index,
                temp_max=curr.temp_max,
                temp_min=curr.temp_min,
                weather_description=curr.weather_description,
                weather_icon=curr.weather_icon,
                surface_pressure=curr.surface_pressure
            ))
        except Exception as e:
            print(f"Error fetching compare data for {c.name}: {e}")

    return CompareResponse(
        count=len(comparison_items),
        cities=comparison_items
    )
