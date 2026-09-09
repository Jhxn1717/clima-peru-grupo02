import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.peru_geo import City
from app.services.weather_service import WeatherService
from app.services.csv_parser import parse_weather_csv

router = APIRouter(prefix="/export", tags=["Exportación e Importación de Datos"])

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


@router.get("/template")
async def get_csv_template():
    """Descarga una plantilla modelo de archivo CSV para registro de datos meteorológicos"""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Fecha", "Ciudad", "Departamento", "Temperatura", "Temp_Min", "Temp_Max", "Humedad", "Precipitacion", "Viento", "UV", "Condicion"])
    sample_rows = [
        ["2026-08-25", "Lima", "Lima", 20.5, 17.2, 22.8, 78, 0.0, 14.5, 7, "Parcialmente nublado"],
        ["2026-08-26", "Lima", "Lima", 21.0, 16.9, 23.4, 76, 0.0, 15.2, 8, "Soleado con cielo despejado"],
        ["2026-08-27", "Lima", "Lima", 19.8, 17.0, 21.5, 82, 0.2, 16.0, 6, "Nublado con llovizna dispersa"],
        ["2026-08-28", "Lima", "Lima", 20.2, 16.8, 22.1, 80, 0.0, 13.8, 7, "Parcialmente nublado"],
        ["2026-08-29", "Lima", "Lima", 21.5, 17.5, 24.0, 75, 0.0, 14.0, 8, "Cielo claro y despejado"],
    ]
    for row in sample_rows:
        writer.writerow(row)

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=plantilla_meteorologica_peru.csv",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.post("/import-csv")
async def import_weather_csv(
    file: UploadFile = File(..., description="Archivo CSV con datos meteorológicos")
):
    """Procesa y valida un archivo CSV con series de tiempo o mediciones climáticas del Perú"""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="El archivo subido debe tener extensión .csv")

    try:
        content_bytes = await file.read()
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío.")

        parsed_rows, stats = parse_weather_csv(content_bytes, file.filename)
        if not parsed_rows:
            raise HTTPException(status_code=400, detail="No se pudieron extraer filas de datos válidas del archivo CSV.")

        return {
            "success": True,
            "message": f"Se procesaron con éxito {stats['total_records']} registros del archivo {file.filename}",
            "stats": stats,
            "preview": parsed_rows[:200],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo CSV: {str(e)}")

