import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FullForecastResponse, City } from '../types/weather';

interface ChartSeries {
  label: string;
  color: [number, number, number];
  style: 'line' | 'bar' | 'area';
  dash?: number[];
  tint?: [number, number, number];
  axis?: 'left' | 'right';
}

function pathDeltas(pts: [number, number][]): number[][] {
  const deltas: number[][] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = i === 0 ? pts[0] : pts[i - 1];
    deltas.push([pts[i][0] - prev[0], pts[i][1] - prev[1]]);
  }
  return deltas;
}

function formatTick(value: number): string {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(1);
}

// Dibuja una tarjeta de gráfico vectorial (línea/área/barras) en el PDF.
function drawVectorChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  unit: string,
  series: ChartSeries[],
  values: number[][],
  labels: string[],
  yMin: number,
  yMax: number,
  rightMin: number,
  rightMax: number
): number {
  if (yMax <= yMin) yMax = yMin + 1;
  if (rightMax <= rightMin) rightMax = rightMin + 1;

  const plotLeft = x + 26;
  const plotRight = x + w - 8;
  const plotTop = y + 18;
  const plotBottom = y + h - 11;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  // Fondo y borde de la tarjeta
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 6, y + 7);

  // Unidad (derecha)
  if (unit) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(unit, plotRight, y + 7, { align: 'right' });
  }

  // Leyenda (sólo si hay más de una serie)
  if (series.length > 1) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    let lx = x + 6;
    const ly = y + 12;
    series.forEach((s) => {
      if (s.style === 'bar') {
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.rect(lx, ly - 2, 2.4, 2.4, 'F');
      } else {
        doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
        doc.setLineWidth(0.5);
        if (s.dash) doc.setLineDashPattern(s.dash, 0);
        doc.line(lx, ly - 1, lx + 6, ly - 1);
        if (s.dash) doc.setLineDashPattern([], 0);
      }
      doc.setTextColor(71, 85, 105);
      doc.text(s.label, lx + 8, ly);
      lx += 8 + doc.getTextWidth(s.label) + 5;
    });
  }

  // Rejilla horizontal y etiquetas del eje Y izquierdo
  const ticks = 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  for (let i = 0; i <= ticks; i++) {
    const v = yMin + ((yMax - yMin) / ticks) * i;
    const gy = plotBottom - ((v - yMin) / (yMax - yMin)) * plotH;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(plotLeft, gy, plotRight, gy);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(100, 116, 139);
    doc.text(formatTick(v), plotLeft - 1.5, gy + 1.5, { align: 'right' });
  }

  // Eje Y derecho (serie secundaria)
  if (rightMax > rightMin) {
    for (let i = 0; i <= ticks; i++) {
      const v = rightMin + ((rightMax - rightMin) / ticks) * i;
      const gy = plotBottom - ((v - rightMin) / (rightMax - rightMin)) * plotH;
      doc.setTextColor(96, 165, 250);
      doc.text(formatTick(v), plotRight + 1.5, gy + 1.5);
    }
  }

  // Ejes principales
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(plotLeft, plotTop, plotLeft, plotBottom);
  doc.line(plotLeft, plotBottom, plotRight, plotBottom);

  // Etiquetas del eje X (cada 3 horas + última)
  const xIndices = new Set<number>();
  for (let i = 0; i < labels.length; i += 3) xIndices.add(i);
  xIndices.add(labels.length - 1);
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  xIndices.forEach((i) => {
    const gx = plotLeft + (plotW * (i / Math.max(1, labels.length - 1)));
    doc.text(labels[i], gx, plotBottom + 3.5, { align: 'center' });
  });

  // Dibujar series
  values.forEach((data, sIdx) => {
    const s = series[sIdx];
    const min = s.axis === 'right' ? rightMin : yMin;
    const max = s.axis === 'right' ? rightMax : yMax;
    const pts: [number, number][] = data.map((val, i) => {
      const raw = Math.min(Math.max(val, min), max);
      const gx = plotLeft + (plotW * (i / Math.max(1, data.length - 1)));
      const gy = plotBottom - ((raw - min) / (max - min)) * plotH;
      return [gx, gy];
    });

    if (s.style === 'bar') {
      const barW = Math.max(1.2, (plotW / Math.max(1, data.length - 1)) * 0.55);
      doc.setFillColor(s.color[0], s.color[1], s.color[2]);
      pts.forEach((p) => {
        doc.rect(p[0] - barW / 2, p[1], barW, plotBottom - p[1], 'F');
      });
      return;
    }

    if (s.style === 'area' && s.tint) {
      const poly: [number, number][] = [[plotLeft, plotBottom]];
      pts.forEach((p) => poly.push(p));
      poly.push([plotRight, plotBottom]);
      poly.push([plotLeft, plotBottom]);
      doc.setFillColor(s.tint[0], s.tint[1], s.tint[2]);
      doc.setLineWidth(0.1);
      doc.setLineJoin('round');
      doc.lines(pathDeltas(poly), plotLeft, plotBottom, [1, 1], 'F', false);
    }

    doc.setDrawColor(s.color[0], s.color[1], s.color[2]);
    doc.setLineWidth(0.5);
    if (s.dash) doc.setLineDashPattern(s.dash, 0);
    doc.lines(pathDeltas(pts), pts[0][0], pts[0][1], [1, 1], 'S', false);
    if (s.dash) doc.setLineDashPattern([], 0);
  });

  return y + h;
}

export function generateWeatherReportPdf(forecast: FullForecastResponse, city?: City | null): { blob: Blob; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cityName = city?.name || forecast.current.city_name || 'Perú';
  const deptName = city?.department_name || forecast.current.department_name || 'Nacional';
  const region = city?.region_natural || forecast.current.region_natural || 'Perú';
  const altitude = city?.altitude ?? forecast.current.altitude ?? 0;
  const lat = city?.latitude ?? forecast.current.latitude;
  const lon = city?.longitude ?? forecast.current.longitude;
  const nowStr = new Date().toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  // Background Header Banner
  doc.setFillColor(14, 116, 144); // Sky/Cyan brand color
  doc.rect(0, 0, 210, 32, 'F');

  // Brand Badge
  doc.setFillColor(225, 29, 72); // Rose/Red badge
  doc.roundedRect(14, 7, 18, 18, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PE', 19, 19);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('METEOPERÚ PRO', 38, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 242, 254);
  doc.text('Sistema Meteorológico Nacional del Perú · Reporte Oficial', 38, 22);

  // Date Tag on Right
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Emitido: ${nowStr}`, 196, 22, { align: 'right' });

  // --- Subheader / City Metadata Card ---
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 22, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${cityName}, ${deptName}`, 19, 48);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Región: ${region}  |  Altitud: ${altitude} msnm  |  Coord: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
    19,
    55
  );

  // --- Current Conditions Section ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text('1. CONDICIONES METEOROLÓGICAS ACTUALES', 14, 68);

  const cur = forecast.current;
  const currentMetrics = [
    [
      { content: 'Temperatura Actual', styles: { fontStyle: 'bold' as const } },
      `${cur.temperature}°C (Sensación ${cur.apparent_temperature}°C)`,
      { content: 'Estado del Cielo', styles: { fontStyle: 'bold' as const } },
      cur.weather_description || 'Despejado',
    ],
    [
      { content: 'Humedad Relativa', styles: { fontStyle: 'bold' as const } },
      `${cur.relative_humidity}%`,
      { content: 'Viento', styles: { fontStyle: 'bold' as const } },
      `${cur.wind_speed} km/h (Dir. ${cur.wind_direction}°)`,
    ],
    [
      { content: 'Presión Superficial', styles: { fontStyle: 'bold' as const } },
      `${cur.surface_pressure} hPa`,
      { content: 'Precipitación Actual', styles: { fontStyle: 'bold' as const } },
      `${cur.precipitation} mm (${cur.precipitation_probability ?? 0}% prob.)`,
    ],
    [
      { content: 'Índice de Radiación UV', styles: { fontStyle: 'bold' as const } },
      `UV ${cur.uv_index} (${cur.uv_category || 'Moderado'})`,
      { content: 'Rango Diario Estimado', styles: { fontStyle: 'bold' as const } },
      `Mín ${cur.temp_min}°C / Máx ${cur.temp_max}°C`,
    ],
  ];

  autoTable(doc, {
    startY: 71,
    body: currentMetrics,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { fillColor: [241, 245, 249], cellWidth: 42 },
      1: { cellWidth: 49 },
      2: { fillColor: [241, 245, 249], cellWidth: 42 },
      3: { cellWidth: 49 },
    },
    margin: { left: 14, right: 14 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- Pronóstico por Horas (Próximas 12 - 24 hrs) ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text('2. PRONÓSTICO METEOROLÓGICO POR HORAS', 14, currentY);

  const hourlyData = (forecast.hourly || []).slice(0, 12).map((h) => [
    h.hour_label || h.time.split('T')[1]?.substring(0, 5) || h.time,
    `${h.temperature}°C`,
    `${h.apparent_temperature}°C`,
    `${h.relative_humidity}%`,
    `${h.precipitation_probability}% (${h.precipitation} mm)`,
    `${h.wind_speed} km/h`,
    `UV ${h.uv_index}`,
    h.weather_description || 'Parcialmente nublado',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Hora', 'Temp', 'Sens.', 'Humedad', 'Lluvia Prob/mm', 'Viento', 'UV', 'Condición']],
    body: hourlyData,
    theme: 'striped',
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      7: { halign: 'left' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need page break for 7-day forecast
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // --- Pronóstico Extendido de 7 Días ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text('3. PRONÓSTICO EXTENDIDO DE 7 DÍAS', 14, currentY);

  const dailyData = (forecast.daily || []).map((d) => [
    d.day_name || d.date,
    d.date,
    `${d.temp_min}°C`,
    `${d.temp_max}°C`,
    `${d.precipitation_probability_max}%`,
    `${d.precipitation_sum} mm`,
    `UV ${d.uv_index_max}`,
    `${d.wind_speed_max} km/h`,
    d.weather_description || 'Soleado',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Día', 'Fecha', 'T. Mín', 'T. Máx', 'Prob. Lluvia', 'Precip. Total', 'UV Máx', 'Viento Máx', 'Condición']],
    body: dailyData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      8: { halign: 'left' },
    },
    margin: { left: 14, right: 14 },
  });

  // --- Análisis Gráfico Horario (los 4 gráficos del dashboard) ---
  const hourlyCharts = (forecast.hourly || []).slice(0, 24);
  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text('4. ANÁLISIS GRÁFICO HORARIO (24 HORAS)', 14, currentY);
  currentY += 6;

  const chartLabels = hourlyCharts.map((_, i) => `${String(i).padStart(2, '0')}:00`);
  const temps = hourlyCharts.map((h) => h.temperature);
  const feels = hourlyCharts.map((h) => h.apparent_temperature);
  const pops = hourlyCharts.map((h) => Math.min(100, h.precipitation_probability));
  const rains = hourlyCharts.map((h) => h.precipitation || 0);
  const hums = hourlyCharts.map((h) => Math.min(100, h.relative_humidity));
  const winds = hourlyCharts.map((h) => h.wind_speed);

  const withMin = Math.min(...temps, ...feels);
  const withMax = Math.max(...temps, ...feels);
  const withPad = Math.max(1, (withMax - withMin) * 0.15);
  const rainMax = Math.max(1, ...rains);
  const windMax = Math.max(1, ...winds);

  const tempSeries: ChartSeries[] = [
    { label: 'Temperatura', color: [245, 158, 11], style: 'area', tint: [254, 243, 199] },
    { label: 'Sensación Térmica', color: [6, 182, 212], style: 'area', tint: [207, 250, 254], dash: [2, 1] },
  ];
  const precipSeries: ChartSeries[] = [
    { label: 'Probabilidad de Lluvia (%)', color: [59, 130, 246], style: 'bar' },
    { label: 'Precipitación Estimada (mm)', color: [96, 165, 250], style: 'line', axis: 'right' },
  ];
  const humSeries: ChartSeries[] = [
    { label: 'Humedad Relativa', color: [56, 189, 248], style: 'area', tint: [224, 242, 254] },
  ];
  const windSeries: ChartSeries[] = [
    { label: 'Velocidad del Viento', color: [45, 212, 191], style: 'area', tint: [204, 251, 241] },
  ];

  const cardW = 182;
  const cardH = 64;
  const drawChartAt = (
    title: string,
    unit: string,
    series: ChartSeries[],
    values: number[][],
    yMin: number,
    yMax: number,
    rightMin: number,
    rightMax: number
  ) => {
    if (currentY + cardH > 282) {
      doc.addPage();
      currentY = 20;
    }
    currentY = drawVectorChart(doc, 14, currentY, cardW, cardH, title, unit, series, values, chartLabels, yMin, yMax, rightMin, rightMax) + 6;
  };

  drawChartAt('Evolución de Temperatura (24h)', 'Temperatura y sensación térmica (°C)', tempSeries, [temps, feels], withMin - withPad, withMax + withPad, 0, 0);
  drawChartAt('Precipitación (24h)', 'Probabilidad de lluvia (%) y milímetros', precipSeries, [pops, rains], 0, 100, 0, rainMax);
  drawChartAt('Humedad Relativa (24h)', 'Porcentaje de humedad (%)', humSeries, [hums], 0, 100, 0, 0);
  drawChartAt('Velocidad del Viento (24h)', 'Kilómetros por hora (km/h)', windSeries, [winds], 0, windMax * 1.15, 0, 0);

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  const isReal = forecast.current.data_source === 'real';
  const footerNote = isReal
    ? 'METEOPERÚ PRO · Datos meteorológicos reales del dataset nacional (SENAMHI)'
    : 'METEOPERÚ PRO · Datos simulados / estimados (API Open-Meteo & catálogos del Perú)';
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.line(14, 285, 196, 285);
    doc.text(
      footerNote,
      14,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
  }

  // Generate filename and return blob for preview in a new tab
  const cleanCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `reporte_meteorologico_${cleanCity}_${dateStamp}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename };
}
