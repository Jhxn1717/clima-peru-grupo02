from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService
from app.services.alert_engine import AlertEngine
from app.schemas.alert import AlertsResponse, WeatherAlert

router = APIRouter(prefix="/alerts", tags=["Alertas Meteorológicas"])

@router.get("", response_model=AlertsResponse)
async def get_alerts(
    city_id: Optional[int] = Query(None, description="Filtrar alertas por ID de ciudad específica"),
    db: Session = Depends(get_db)
):
    try:
        all_alerts: List[WeatherAlert] = []

        if city_id:
            city = db.query(City).filter(City.id == city_id).first()
            if not city:
                raise HTTPException(status_code=404, detail="Ciudad no encontrada")
            forecast = await WeatherService.get_forecast(
                lat=city.latitude,
                lon=city.longitude,
                city_id=city.id,
                db=db
            )
            alerts = AlertEngine.evaluate_weather_alerts(forecast.current)
            all_alerts.extend(alerts)
        else:
            # National alerts evaluation: evaluate featured cities across Peru
            cities = db.query(City).filter(City.is_featured == True).all()
            for c in cities:
                try:
                    forecast = await WeatherService.get_forecast(
                        lat=c.latitude,
                        lon=c.longitude,
                        city_id=c.id,
                        db=db
                    )
                    city_alerts = AlertEngine.evaluate_weather_alerts(forecast.current)
                    # Filter only notable alerts (not normal info for national rollup unless empty)
                    notable = [a for a in city_alerts if a.severity in ["danger", "warning", "caution"]]
                    all_alerts.extend(notable)
                except Exception as e:
                    print(f"Error evaluando alerta para {c.name}: {e}")

            if not all_alerts:
                # Add default national status info
                all_alerts.append(WeatherAlert(
                    id="national_calm",
                    city_name="Territorio Nacional del Perú",
                    department_name="Nivel Nacional",
                    region_natural="Costa / Sierra / Selva",
                    title="Condiciones Climáticas Estables en el País",
                    severity="info",
                    severity_label="Informativo",
                    category="info",
                    icon="CheckCircle2",
                    description="No se registran alertas severas en las principales urbes del Perú en este momento.",
                    recommendation="Monitorear actualizaciones periódicas del SENAMHI y protección solar estándar.",
                    trigger_value="Rangos estables",
                    threshold="Normal",
                    timestamp=""
                ))

        return AlertEngine.create_alerts_response(all_alerts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluando alertas meteorológicas: {str(e)}")
