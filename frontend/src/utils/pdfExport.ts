import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FullForecastResponse, City } from '../types/weather';

export function generateWeatherReportPdf(forecast: FullForecastResponse, city?: City | null) {
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

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.line(14, 285, 196, 285);
    doc.text(
      'METEOPERÚ PRO · Datos meteorológicos integrados de Open-Meteo & Catálogos Geográficos del Perú',
      14,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
  }

  // Generate filename
  const cleanCity = cityName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  doc.save(`reporte_meteorologico_${cleanCity}_${dateStamp}.pdf`);
}
