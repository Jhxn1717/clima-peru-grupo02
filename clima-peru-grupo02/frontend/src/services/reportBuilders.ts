/**
 * reportBuilders.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Funciones que transforman los datos de cada tipo de reporte del sistema
 * MeteoPerú en la estructura genérica que espera PdfGenerator.
 *
 * Exporta:
 *   buildForecastReport(current, hourly, daily)
 *   buildHistoryReport(history, filters)
 *   buildCsvImportReport(importResult)
 */

import {
  PdfReportOptions, KPI, ChartSpec, AnalysisPoint, TableColumn,
} from './pdfGenerator';
import type {
  CurrentWeather,
  HourlyForecastItem,
  DailyForecastItem,
  HistoryResponse,
  HistoryDataPoint,
} from '../types/weather';

// ─── Helpers numéricos ────────────────────────────────────────────────────────

const toNumber = (value: number | null | undefined, fallback = 0): number => {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
};

const fmt1 = (value: number | null | undefined): string => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(1) : '—';
};

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const trend = (arr: number[]): string => {
  if (arr.length < 3) return 'Sin tendencia clara';
  const half = Math.floor(arr.length / 2);
  const firstHalf = avg(arr.slice(0, half));
  const secondHalf = avg(arr.slice(half));
  const diff = secondHalf - firstHalf;
  if (Math.abs(diff) < 0.5) return 'Estable (variación < 0.5)';
  return diff > 0 ? `Ascendente (+${diff.toFixed(1)})` : `Descendente (${diff.toFixed(1)})`;
};

const uvCategory = (uv: number) => {
  if (uv < 3) return 'Bajo';
  if (uv < 6) return 'Moderado';
  if (uv < 8) return 'Alto';
  if (uv < 11) return 'Muy Alto';
  return 'Extremo';
};

// ─── 1. Reporte de Pronóstico ─────────────────────────────────────────────────

export function buildForecastReport(
  current: CurrentWeather,
  hourly: HourlyForecastItem[],
  daily: DailyForecastItem[],
): PdfReportOptions {

  const cityName = current.city_name || 'Perú';
  const deptName = current.department_name ?? '';
  const regionNatural = current.region_natural ?? '';

  // ── KPIs ──
  const kpis: KPI[] = [
    {
      label: 'Temperatura actual',
      value: fmt1(current.temperature),
      unit: '°C',
      color: [239, 68, 68],
      sub: `Sensación ${fmt1(current.apparent_temperature)}°C`,
    },
    {
      label: 'Humedad relativa',
      value: current.relative_humidity,
      unit: '%',
      color: [14, 165, 233],
      sub: `Nubosidad ${current.cloud_cover}%`,
    },
    {
      label: 'Viento',
      value: fmt1(current.wind_speed),
      unit: 'km/h',
      color: [99, 102, 241],
      sub: current.wind_gusts ? `Ráfagas ${fmt1(current.wind_gusts)} km/h` : undefined,
    },
    {
      label: 'Índice UV',
      value: fmt1(current.uv_index),
      unit: `(${uvCategory(current.uv_index)})`,
      color: [245, 158, 11],
      sub: `Presión ${fmt1(current.surface_pressure)} hPa`,
    },
    {
      label: 'Temp. máxima hoy',
      value: fmt1(current.temp_max),
      unit: '°C',
      color: [239, 68, 68],
    },
    {
      label: 'Temp. mínima hoy',
      value: fmt1(current.temp_min),
      unit: '°C',
      color: [99, 102, 241],
    },
    {
      label: 'Precipitación actual',
      value: fmt1(current.precipitation),
      unit: 'mm',
      color: [20, 184, 166],
      sub: current.precipitation_probability != null
        ? `Prob. ${current.precipitation_probability}%`
        : undefined,
    },
    {
      label: 'Condición',
      value: current.weather_description,
      color: [16, 185, 129],
    },
  ];

  // ── Gráficas ──
  const next24h = hourly.slice(0, 24);
  const labels24 = next24h.map(h => h.hour_label ?? h.time.slice(11, 16));

  const charts: ChartSpec[] = [
    {
      type: 'line',
      title: 'Temperatura y Sensación Térmica — Próximas 24h',
      labels: labels24,
      unit: '°C',
      height: 58,
      series: [
        { label: 'Temperatura', values: next24h.map(h => h.temperature), color: [239, 68, 68] },
        { label: 'Sensación', values: next24h.map(h => h.apparent_temperature), color: [251, 146, 60] },
      ],
    },
    {
      type: 'bar',
      title: 'Probabilidad de Lluvia — Próximas 24h',
      labels: labels24,
      unit: '%',
      height: 48,
      series: [
        { label: 'Prob. lluvia', values: next24h.map(h => h.precipitation_probability), color: [14, 165, 233] },
      ],
    },
    {
      type: 'bar',
      title: 'Temperatura Máxima / Mínima — 7 días',
      labels: daily.map(d => d.day_short ?? d.day_name.slice(0, 3)),
      unit: '°C',
      height: 58,
      series: [
        { label: 'Temp. Máx.', values: daily.map(d => d.temp_max), color: [239, 68, 68] },
        { label: 'Temp. Mín.', values: daily.map(d => d.temp_min), color: [14, 165, 233] },
      ],
    },
    {
      type: 'bar',
      title: 'Precipitación y UV máximo — 7 días',
      labels: daily.map(d => d.day_short ?? d.day_name.slice(0, 3)),
      height: 48,
      series: [
        { label: 'Lluvia (mm)', values: daily.map(d => d.precipitation_sum), color: [20, 184, 166] },
        { label: 'UV máx.', values: daily.map(d => d.uv_index_max), color: [245, 158, 11] },
      ],
    },
  ];

  // ── Tabla — Pronóstico diario ──
  const columns: TableColumn[] = [
    { header: 'Fecha',         key: 'date',     width: 1.2 },
    { header: 'Día',           key: 'day_name', width: 1.0 },
    { header: 'Máx. °C',      key: 'temp_max', width: 0.8, align: 'right', format: v => fmt1(v as number) },
    { header: 'Mín. °C',      key: 'temp_min', width: 0.8, align: 'right', format: v => fmt1(v as number) },
    { header: 'Lluvia mm',     key: 'precipitation_sum',            width: 0.9, align: 'right', format: v => fmt1(v as number) },
    { header: 'Prob. (%)',     key: 'precipitation_probability_max',width: 0.8, align: 'right' },
    { header: 'UV máx.',       key: 'uv_index_max',  width: 0.7, align: 'right' },
    { header: 'Viento km/h',   key: 'wind_speed_max',width: 0.9, align: 'right', format: v => fmt1(v as number) },
    { header: 'Condición',     key: 'weather_description', width: 2.0 },
  ];

  // ── Análisis automático ──
  const maxDay = daily.reduce((a, b) => (b.temp_max > a.temp_max ? b : a), daily[0]);
  const minDay = daily.reduce((a, b) => (b.temp_min < a.temp_min ? b : a), daily[0]);
  const rainiestDay = daily.reduce((a, b) => (b.precipitation_sum > a.precipitation_sum ? b : a), daily[0]);
  const maxUVDay = daily.reduce((a, b) => (b.uv_index_max > a.uv_index_max ? b : a), daily[0]);
  const avgTemp7 = avg(daily.map(d => (d.temp_max + d.temp_min) / 2));
  const totalRain = daily.reduce((a, b) => a + b.precipitation_sum, 0);

  const analysis: AnalysisPoint[] = [
    { label: 'Condición actual', value: current.weather_description },
    { label: 'Ciudad / Región', value: `${cityName}${deptName ? ` — ${deptName}` : ''}${regionNatural ? ` (${regionNatural})` : ''}` },
    { label: 'Temp. promedio próx. 7 días', value: `${fmt1(avgTemp7)} °C` },
    { label: 'Día más caluroso', value: `${maxDay?.date ?? '—'}: ${fmt1(maxDay?.temp_max)} °C` },
    { label: 'Día más frío', value: `${minDay?.date ?? '—'}: ${fmt1(minDay?.temp_min)} °C` },
    { label: 'Día más lluvioso', value: `${rainiestDay?.date ?? '—'}: ${fmt1(rainiestDay?.precipitation_sum)} mm` },
    { label: 'Precipitación acumulada 7d', value: `${fmt1(totalRain)} mm` },
    { label: 'Mayor índice UV', value: `${fmt1(maxUVDay?.uv_index_max)} (${uvCategory(toNumber(maxUVDay?.uv_index_max))}) el ${maxUVDay?.date ?? '—'}` },
    { label: 'Rango térmico hoy', value: `${fmt1(current.temp_min)} – ${fmt1(current.temp_max)} °C` },
    {
      label: 'Altitud',
      value: current.altitude != null ? `${current.altitude} msnm` : '—',
    },
    {
      label: 'Amanecer / Ocaso',
      value: current.sunrise && current.sunset
        ? `${current.sunrise} / ${current.sunset}`
        : '—',
    },
  ].filter(a => a.value !== '—');

  return {
    title: `Pronóstico Meteorológico — ${cityName}`,
    subtitle: `${deptName}${regionNatural ? ' · ' + regionNatural : ''} · Actualizado: ${current.updated_at}`,
    filters: {
      Ciudad: cityName,
      Departamento: deptName || '—',
      'Región natural': regionNatural || '—',
      'Fecha emisión': new Date().toLocaleDateString('es-PE'),
    },
    kpis,
    charts,
    columns,
    rows: daily as unknown as Record<string, unknown>[],
    analysis,
    orientation: 'landscape',
  };
}

// ─── 2. Reporte Histórico ─────────────────────────────────────────────────────

export function buildHistoryReport(
  history: HistoryResponse,
  extraFilters?: Record<string, string>,
): PdfReportOptions {
  const data = history.data;
  const st = history.stats;
  const variable = history.variable;

  // ── KPIs dinámicos según variable ──
  const varLabel: Record<string, string> = {
    temperature: 'Temperatura media',
    precipitation: 'Precipitación media',
    wind: 'Viento máx. promedio',
    humidity: 'Humedad media',
  };

  const numericMaxTemp = Math.max(...data.map(d => toNumber(d.temp_max))); 
  const numericMinTemp = Math.min(...data.map(d => toNumber(d.temp_min))); 
  const kpis: KPI[] = [
    {
      label: varLabel[variable] ?? 'Promedio',
      value: fmt1(st.average),
      unit: variable === 'temperature' ? '°C' : variable === 'precipitation' ? 'mm' : variable === 'wind' ? 'km/h' : '%',
      color: [14, 165, 233],
    },
    {
      label: 'Valor máximo',
      value: fmt1(st.maximum),
      color: [239, 68, 68],
      sub: `Días analizados: ${st.days_analyzed}`,
    },
    {
      label: 'Valor mínimo',
      value: fmt1(st.minimum),
      color: [99, 102, 241],
    },
    {
      label: 'Tendencia',
      value: st.trend,
      color: [16, 185, 129],
    },
    {
      label: 'Precipitación total',
      value: fmt1(st.total_precipitation ?? 0),
      unit: 'mm',
      color: [20, 184, 166],
    },
    {
      label: 'Días con lluvia',
      value: data.filter(d => toNumber(d.precipitation_sum) > 0.1).length,
      sub: `de ${st.days_analyzed} días`,
      color: [168, 85, 247],
    },
    {
      label: 'Temp. máx. absoluta',
      value: fmt1(numericMaxTemp),
      unit: '°C',
      color: [239, 68, 68],
    },
    {
      label: 'Temp. mín. absoluta',
      value: fmt1(numericMinTemp),
      unit: '°C',
      color: [14, 165, 233],
    },
  ];

  // ── Gráficas ──
  const labels = data.map(d => d.date.slice(5)); // MM-DD

  const charts: ChartSpec[] = [];

  // Temperatura
  charts.push({
    type: 'line',
    title: 'Evolución de Temperaturas (Máx. / Media / Mín.)',
    labels,
    unit: '°C',
    height: 60,
    series: [
      { label: 'Temp. Máx.', values: data.map(d => toNumber(d.temp_max)), color: [239, 68, 68] },
      { label: 'Temp. Media', values: data.map(d => toNumber(d.temp_mean)), color: [245, 158, 11] },
      { label: 'Temp. Mín.', values: data.map(d => toNumber(d.temp_min)), color: [14, 165, 233] },
    ],
  });

  // Precipitación
  const hasPrecip = data.some(d => toNumber(d.precipitation_sum) > 0);
  if (hasPrecip) {
    charts.push({
      type: 'bar',
      title: 'Precipitación diaria (mm)',
      labels,
      unit: 'mm',
      height: 50,
      series: [
        { label: 'Precipitación', values: data.map(d => toNumber(d.precipitation_sum)), color: [14, 165, 233] },
      ],
    });
  }

  // Viento
  const hasWind = data.some(d => toNumber(d.wind_speed_max) > 0);
  if (hasWind) {
    charts.push({
      type: 'area',
      title: 'Velocidad Máxima del Viento (km/h)',
      labels,
      unit: 'km/h',
      height: 48,
      series: [
        { label: 'Viento máx.', values: data.map(d => toNumber(d.wind_speed_max)), color: [99, 102, 241] },
      ],
    });
  }

  // ── Tabla ──
  const columns: TableColumn[] = [
    { header: 'Fecha',        key: 'date',               width: 1.2 },
    { header: 'Temp. Máx. °C', key: 'temp_max',          width: 1.0, align: 'right', format: v => fmt1(v as number) },
    { header: 'Temp. Mín. °C', key: 'temp_min',          width: 1.0, align: 'right', format: v => fmt1(v as number) },
    { header: 'Temp. Media °C', key: 'temp_mean',        width: 1.0, align: 'right', format: v => fmt1(v as number) },
    { header: 'Precip. mm',   key: 'precipitation_sum',  width: 1.0, align: 'right', format: v => fmt1(v as number) },
    { header: 'Viento km/h',  key: 'wind_speed_max',     width: 1.0, align: 'right', format: v => fmt1(v as number) },
  ];

  // ── Análisis ──
  const temps = data.map(d => toNumber(d.temp_mean));
  const precips = data.map(d => toNumber(d.precipitation_sum));
  const winds = data.map(d => toNumber(d.wind_speed_max));

  // Identificar mes más caluroso si hay > 30 días
  const trendStr = trend(temps);

  const analysis: AnalysisPoint[] = [
    { label: 'Ciudad', value: `${history.city_name} — ${history.department_name}` },
    { label: 'Período analizado', value: `${history.start_date} al ${history.end_date}` },
    { label: 'Días analizados', value: String(st.days_analyzed) },
    { label: 'Temperatura promedio', value: `${fmt1(st.average)} °C` },
    { label: 'Temperatura máxima', value: `${fmt1(st.maximum)} °C` },
    { label: 'Temperatura mínima', value: `${fmt1(st.minimum)} °C` },
    { label: 'Rango térmico', value: `${fmt1(st.maximum - st.minimum)} °C` },
    { label: 'Tendencia de temperatura', value: trendStr },
    { label: 'Precipitación total', value: `${fmt1(st.total_precipitation ?? 0)} mm` },
    { label: 'Días con lluvia', value: `${data.filter(d => toNumber(d.precipitation_sum) > 0.1).length} de ${st.days_analyzed}` },
    { label: 'Precipitación máxima en un día', value: `${fmt1(Math.max(...precips))} mm` },
    { label: 'Viento promedio', value: `${fmt1(avg(winds))} km/h` },
    { label: 'Viento máximo registrado', value: `${fmt1(Math.max(...winds))} km/h` },
  ].filter(a => a.value && a.value !== '—' && a.value !== 'NaN °C');

  return {
    title: `Análisis Histórico — ${history.city_name}`,
    subtitle: `${history.department_name} · ${history.start_date} al ${history.end_date}`,
    filters: {
      Ciudad: history.city_name,
      Departamento: history.department_name,
      Variable: varLabel[variable] ?? variable,
      'Período': `${history.start_date} → ${history.end_date}`,
      ...extraFilters,
    },
    kpis,
    charts,
    columns,
    rows: data as unknown as Record<string, unknown>[],
    analysis,
    orientation: 'portrait',
  };
}

// ─── 3. Reporte desde CSV Importado ──────────────────────────────────────────

export function buildCsvImportReport(
  importResult: {
    stats: {
      total_records: number; filename: string;
      detected_city: string; all_cities: string[];
      start_date: string; end_date: string;
      temperature: { average: number; max: number; min: number };
      precipitation: { total: number; max_single_day: number; rainy_days: number };
      wind: { average: number; max: number };
      uv: { average: number; max: number };
    };
    data: Record<string, unknown>[];
  },
): PdfReportOptions {
  const { stats, data } = importResult;

  // ── KPIs ──
  const kpis: KPI[] = [
    { label: 'Total de registros',  value: stats.total_records, color: [14, 165, 233] },
    { label: 'Temp. promedio',      value: fmt1(stats.temperature.average), unit: '°C', color: [239, 68, 68] },
    { label: 'Temp. máxima',        value: fmt1(stats.temperature.max),     unit: '°C', color: [239, 68, 68], sub: `Mín: ${fmt1(stats.temperature.min)} °C` },
    { label: 'Precipitación total', value: fmt1(stats.precipitation.total), unit: 'mm', color: [20, 184, 166], sub: `${stats.precipitation.rainy_days} días con lluvia` },
    { label: 'Precipitación máx.',  value: fmt1(stats.precipitation.max_single_day), unit: 'mm', color: [14, 165, 233] },
    { label: 'Viento promedio',     value: fmt1(stats.wind.average), unit: 'km/h', color: [99, 102, 241] },
    { label: 'Viento máximo',       value: fmt1(stats.wind.max),     unit: 'km/h', color: [99, 102, 241] },
    { label: 'UV promedio',         value: fmt1(stats.uv.average), unit: `(${uvCategory(stats.uv.average)})`, color: [245, 158, 11] },
  ];

  // ── Gráficas — usar subset representativo ──
  const sample = data.length > 60
    ? data.filter((_, i) => i % Math.ceil(data.length / 60) === 0)
    : data;

  const labels = sample.map(r => String(r.date ?? '').slice(5) || String(r.date));
  const temps  = sample.map(r => Number(r.temperature) || 0);
  const precip = sample.map(r => Number(r.precipitation) || 0);
  const wind   = sample.map(r => Number(r.wind_speed) || 0);
  const hasTempMaxMin = sample.some(r => r.temp_max !== null && r.temp_max !== undefined);

  const charts: ChartSpec[] = [];

  // Temperatura
  if (hasTempMaxMin) {
    charts.push({
      type: 'line',
      title: 'Evolución de Temperatura (Máx. / Media / Mín.)',
      labels,
      unit: '°C',
      height: 58,
      series: [
        { label: 'Temp. Máx.', values: sample.map(r => Number(r.temp_max) || 0), color: [239, 68, 68] },
        { label: 'Temp. Media', values: temps, color: [245, 158, 11] },
        { label: 'Temp. Mín.', values: sample.map(r => Number(r.temp_min) || 0), color: [14, 165, 233] },
      ],
    });
  } else {
    charts.push({
      type: 'line',
      title: 'Temperatura registrada',
      labels,
      unit: '°C',
      height: 55,
      series: [{ label: 'Temperatura', values: temps, color: [239, 68, 68] }],
    });
  }

  // Precipitación
  if (precip.some(v => v > 0)) {
    charts.push({
      type: 'bar',
      title: 'Precipitación diaria (mm)',
      labels,
      unit: 'mm',
      height: 50,
      series: [{ label: 'Precipitación', values: precip, color: [14, 165, 233] }],
    });
  }

  // Viento
  if (wind.some(v => v > 0)) {
    charts.push({
      type: 'area',
      title: 'Velocidad del Viento (km/h)',
      labels,
      unit: 'km/h',
      height: 48,
      series: [{ label: 'Viento', values: wind, color: [99, 102, 241] }],
    });
  }

  // Distribución de ciudades (si hay más de una)
  if (stats.all_cities.length > 1) {
    const cityCount = stats.all_cities.reduce((acc, city) => {
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const entries = Object.entries(cityCount).slice(0, 8);
    charts.push({
      type: 'donut',
      title: 'Distribución de registros por ciudad',
      labels: entries.map(([c]) => c),
      height: 55,
      series: [{ label: 'Registros', values: entries.map(([, v]) => v) }],
    });
  }

  // ── Tabla ──
  const columns: TableColumn[] = [
    { header: '#',          key: 'id',            width: 0.4, align: 'center' },
    { header: 'Fecha',      key: 'date',           width: 1.2 },
    { header: 'Ciudad',     key: 'city',           width: 1.2 },
    { header: 'Temp. °C',   key: 'temperature',    width: 0.9, align: 'right', format: v => fmt1(v as number) },
    { header: 'Máx. °C',   key: 'temp_max',       width: 0.8, align: 'right', format: v => fmt1(v as number) },
    { header: 'Mín. °C',   key: 'temp_min',       width: 0.8, align: 'right', format: v => fmt1(v as number) },
    { header: 'Hum. %',    key: 'humidity',       width: 0.7, align: 'right', format: v => v != null ? String(v) : '—' },
    { header: 'Precip. mm', key: 'precipitation',  width: 0.9, align: 'right', format: v => fmt1(v as number) },
    { header: 'Viento km/h',key: 'wind_speed',     width: 0.9, align: 'right', format: v => fmt1(v as number) },
    { header: 'UV',         key: 'uv_index',       width: 0.6, align: 'right' },
    { header: 'Condición',  key: 'condition',      width: 1.8 },
  ];

  // ── Análisis ──
  const analysis: AnalysisPoint[] = [
    { label: 'Archivo fuente',         value: stats.filename },
    { label: 'Ubicación detectada',    value: stats.detected_city },
    { label: 'Período registrado',     value: `${stats.start_date} → ${stats.end_date}` },
    { label: 'Total de registros',     value: String(stats.total_records) },
    { label: 'Temperatura promedio',   value: `${fmt1(stats.temperature.average)} °C` },
    { label: 'Temperatura máxima',     value: `${fmt1(stats.temperature.max)} °C` },
    { label: 'Temperatura mínima',     value: `${fmt1(stats.temperature.min)} °C` },
    { label: 'Rango térmico',          value: `${fmt1(stats.temperature.max - stats.temperature.min)} °C` },
    { label: 'Precipitación total',    value: `${fmt1(stats.precipitation.total)} mm` },
    { label: 'Días con lluvia',        value: String(stats.precipitation.rainy_days) },
    { label: 'Precipitación máx. diaria', value: `${fmt1(stats.precipitation.max_single_day)} mm` },
    { label: 'Porcentaje días lluviosos', value: `${((stats.precipitation.rainy_days / stats.total_records) * 100).toFixed(1)}%` },
    { label: 'Viento promedio',        value: `${fmt1(stats.wind.average)} km/h` },
    { label: 'Viento máximo',          value: `${fmt1(stats.wind.max)} km/h` },
    { label: 'Índice UV promedio',     value: `${fmt1(stats.uv.average)} (${uvCategory(stats.uv.average)})` },
    { label: 'Índice UV máximo',       value: `${fmt1(stats.uv.max)} (${uvCategory(stats.uv.max)})` },
  ].filter(a => a.value && a.value !== '—' && !a.value.includes('NaN'));

  return {
    title: `Reporte de Datos CSV — ${stats.detected_city}`,
    subtitle: `Archivo: ${stats.filename} · ${stats.total_records} registros`,
    filters: {
      Archivo:   stats.filename,
      Ubicación: stats.detected_city,
      Desde:     stats.start_date,
      Hasta:     stats.end_date,
      Registros: String(stats.total_records),
    },
    kpis,
    charts,
    columns,
    rows: data.slice(0, 500), // limitar a 500 filas en tabla para no generar PDF de 50 páginas
    analysis,
    orientation: data[0] && Object.keys(data[0]).length > 7 ? 'landscape' : 'portrait',
  };
}
