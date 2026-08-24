import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/export", tags=["Exportación de Datos"])

@router.get("/csv")
async def export_weather_csv(
    city_id: int = Query(..., description="ID de la ciudad"),
    export_type: str = Query("forecast", description="Tipo de exportación: forecast o history"),
    days: int = Query(30, description="Días históricos si export_type=history"),
    db: Session = Depends(get_db)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="Ciudad no encontrada")

    output = io.StringIO()
    writer = csv.writer(output)

    dept_name = city.department.name if city.department else ""

    if export_type == "history":
        end_d = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        start_d = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        history = await WeatherService.get_history(city_id, start_d, end_d, "all", db)

        writer.writerow(["SISTEMA DE CLIMA Y DATOS METEOROLOGICOS DEL PERU"])
        writer.writerow(["Reporte Historico de", city.name, f"({dept_name})"])
        writer.writerow(["Periodo", start_d, "al", end_d])
        writer.writerow(["Promedio", f"{history.stats.average}°C", "Maximo", f"{history.stats.maximum}°C", "Minimo", f"{history.stats.minimum}°C"])
        writer.writerow([])
        writer.writerow(["Fecha", "Temp Max (°C)", "Temp Min (°C)", "Temp Media (°C)", "Precipitacion (mm)", "Viento Max (km/h)"])

        for dp in history.data:
            writer.writerow([
                dp.date,
                dp.temp_max,
                dp.temp_min,
                dp.temp_mean,
                dp.precipitation_sum,
                dp.wind_speed_max
            ])

        filename = f"clima_historico_{city.name.lower().replace(' ', '_')}_{start_d}_{end_d}.csv"

    else:
        # Forecast CSV
        forecast = await WeatherService.get_forecast(lat=city.latitude, lon=city.longitude, city_id=city.id, db=db)

        writer.writerow(["SISTEMA DE CLIMA Y DATOS METEOROLOGICOS DEL PERU"])
        writer.writerow(["Reporte de Pronostico", city.name, f"({dept_name})"])
        writer.writerow(["Fecha Emision", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow(["Clima Actual", f"{forecast.current.temperature}°C", forecast.current.weather_description])
        writer.writerow(["Humedad", f"{forecast.current.relative_humidity}%", "Viento", f"{forecast.current.wind_speed} km/h", "Indice UV", forecast.current.uv_index])
        writer.writerow([])
        writer.writerow(["--- PRONOSTICO HORARIO (PROXIMAS 24 HORAS) ---"])
        writer.writerow(["Hora", "Temperatura (°C)", "Sensacion (°C)", "Humedad (%)", "Prob. Lluvia (%)", "Precipitacion (mm)", "Viento (km/h)", "UV", "Condicion"])

        for h in forecast.hourly:
            writer.writerow([
                h.time,
                h.temperature,
                h.apparent_temperature,
                h.relative_humidity,
                h.precipitation_probability,
                h.precipitation,
                h.wind_speed,
                h.uv_index,
                h.weather_description
            ])

        writer.writerow([])
        writer.writerow(["--- PRONOSTICO DIARIO (PROXIMOS 7 DIAS) ---"])
        writer.writerow(["Fecha", "Dia", "Temp Max (°C)", "Temp Min (°C)", "Lluvia (mm)", "Prob. Lluvia (%)", "UV Max", "Viento Max (km/h)", "Condicion"])

        for d in forecast.daily:
            writer.writerow([
                d.date,
                d.day_name,
                d.temp_max,
                d.temp_min,
                d.precipitation_sum,
                d.precipitation_probability_max,
                d.uv_index_max,
                d.wind_speed_max,
                d.weather_description
            ])

        filename = f"pronostico_{city.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
