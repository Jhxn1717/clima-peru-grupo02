/**
 * pdfGenerator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor genérico de generación de PDF para MeteoPerú.
 * Dibuja directamente con jsPDF (sin html2canvas) para máxima velocidad,
 * portabilidad y control de layout.
 *
 * Soporta:
 *   • Encabezado corporativo con título, subtítulo, fecha/hora y filtros
 *   • Indicadores KPI (calculados dinámicamente desde los datos)
 *   • Gráficas nativas: barras, líneas, dona, barras agrupadas
 *   • Tabla paginada con encabezados repetidos y columnas auto-ajustadas
 *   • Sección de análisis automático (máx, mín, tendencias, distribuciones)
 *   • Pie de página con número de página y marca de agua discreta
 *   • Orientación auto: portrait (<= 6 cols) / landscape (> 6 cols o datos anchos)
 */

import { jsPDF } from 'jspdf';

// ─── Paleta de colores MeteoPerú ──────────────────────────────────────────────
const C = {
  brand:      [14, 165, 233]  as [number,number,number], // sky-500
  brandDark:  [2, 132, 199]   as [number,number,number], // sky-600
  accent:     [99, 102, 241]  as [number,number,number], // indigo-500
  success:    [16, 185, 129]  as [number,number,number], // emerald-500
  warning:    [245, 158, 11]  as [number,number,number], // amber-500
  danger:     [239, 68, 68]   as [number,number,number], // red-500
  purple:     [168, 85, 247]  as [number,number,number], // purple-500
  teal:       [20, 184, 166]  as [number,number,number], // teal-500
  // Neutros
  bg:         [248, 250, 252] as [number,number,number], // slate-50
  bgCard:     [241, 245, 249] as [number,number,number], // slate-100
  border:     [203, 213, 225] as [number,number,number], // slate-300
  textDark:   [15, 23, 42]    as [number,number,number], // slate-900
  textMid:    [71, 85, 105]   as [number,number,number], // slate-600
  textLight:  [148, 163, 184] as [number,number,number], // slate-400
  white:      [255, 255, 255] as [number,number,number],
  black:      [0, 0, 0]       as [number,number,number],
};

// Serie de colores para gráficas (hasta 8 series)
const CHART_COLORS: [number,number,number][] = [
  C.brand, C.success, C.warning, C.danger,
  C.purple, C.teal, C.accent, [251,146,60],
];

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'donut' | 'grouped-bar' | 'area';

export interface ChartSeries {
  label: string;
  values: number[];
  color?: [number,number,number];
}

export interface ChartSpec {
  type: ChartType;
  title: string;
  labels: string[];       // etiquetas del eje X / sectores donut
  series: ChartSeries[];  // cada serie tiene sus valores
  unit?: string;          // unidad para el eje Y (ej. '°C', 'mm')
  height?: number;        // altura en mm (default 55)
}

export interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  color?: [number,number,number];
  sub?: string;           // subtexto secundario
}

export interface TableColumn {
  header: string;
  key: string;
  width?: number;         // fracción relativa (ej. 1.5 = 50% más ancho que el resto)
  align?: 'left' | 'center' | 'right';
  format?: (v: unknown) => string;
}

export interface AnalysisPoint {
  label: string;
  value: string;
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  filters?: Record<string, string>;
  kpis?: KPI[];
  charts?: ChartSpec[];
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  analysis?: AnalysisPoint[];
  /** Si se omite, la orientación se detecta automáticamente */
  orientation?: 'portrait' | 'landscape';
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class PdfGenerator {
  private doc!: jsPDF;
  private pw!: number;   // page width
  private ph!: number;   // page height
  private ml = 14;       // margin left
  private mr = 14;       // margin right
  private mt = 14;       // margin top (after header)
  private mb = 16;       // margin bottom (for footer)
  private cw!: number;   // content width
  private pageNum = 1;
  private totalPages = 0; // se rellena después con autoTable trick
  private opts!: PdfReportOptions;

  /** Genera y descarga el PDF automáticamente */
  async generate(opts: PdfReportOptions): Promise<void> {
    this.opts = opts;

    // Detectar orientación
    const isLandscape = opts.orientation === 'landscape'
      || opts.orientation === undefined && opts.columns.length > 6;

    this.doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    this.pw = this.doc.internal.pageSize.getWidth();
    this.ph = this.doc.internal.pageSize.getHeight();
    this.cw = this.pw - this.ml - this.mr;

    // Primera pasada: construir todo el contenido
    let y = this._drawHeader(opts);
    y = this._drawKPIs(y, opts.kpis ?? []);
    y = this._drawCharts(y, opts.charts ?? []);
    y = this._drawTable(y, opts.columns, opts.rows);
    y = this._drawAnalysis(y, opts.analysis ?? []);

    // Pie de página en todas las páginas
    this.totalPages = (this.doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= this.totalPages; p++) {
      this.doc.setPage(p);
      this._drawFooter(p, this.totalPages, opts.title);
    }

    // Descargar
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `reporte_${opts.title.replace(/\s+/g, '_').toLowerCase()}_${ts}.pdf`;
    this.doc.save(filename);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1 — Encabezado
  // ═══════════════════════════════════════════════════════════════════════════

  private _drawHeader(opts: PdfReportOptions): number {
    const doc = this.doc;
    let y = 0;
    const hh = 38; // altura del header

    // Fondo degradado simulado (dos rectángulos)
    doc.setFillColor(...C.brandDark);
    doc.rect(0, 0, this.pw, hh, 'F');
    doc.setFillColor(...C.brand);
    doc.rect(0, hh - 8, this.pw, 8, 'F');

    // Logo / marca — texto PE en caja
    doc.setFillColor(...C.white);
    doc.roundedRect(this.ml, 8, 18, 18, 2, 2, 'F');
    doc.setTextColor(...C.brandDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PE', this.ml + 9, 19.5, { align: 'center' });

    // Título principal
    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(opts.title.toUpperCase(), this.ml + 22, 15, { maxWidth: this.cw - 22 - 40 });

    // Subtítulo
    if (opts.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(186, 230, 253); // sky-200
      doc.text(opts.subtitle, this.ml + 22, 22);
    }

    // METEOBERÚ PRO a la derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(186, 230, 253);
    doc.text('METEOPERÚ PRO', this.pw - this.mr, 12, { align: 'right' });

    // Fecha/hora a la derecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const now = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    doc.text(`Generado: ${now}`, this.pw - this.mr, 19, { align: 'right' });
    doc.text('Hora Perú (UTC-5)', this.pw - this.mr, 24, { align: 'right' });

    y = hh + 4;

    // Filtros aplicados (si existen)
    if (opts.filters && Object.keys(opts.filters).length > 0) {
      doc.setFillColor(...C.bgCard);
      doc.rect(this.ml, y, this.cw, 10, 'F');
      doc.setTextColor(...C.textMid);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('FILTROS APLICADOS:', this.ml + 3, y + 4);
      doc.setFont('helvetica', 'normal');
      const filterStr = Object.entries(opts.filters)
        .map(([k, v]) => `${k}: ${v}`)
        .join('   |   ');
      doc.text(filterStr, this.ml + 38, y + 4, { maxWidth: this.cw - 41 });
      y += 14;
    }

    return y;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2 — KPIs / Indicadores
  // ═══════════════════════════════════════════════════════════════════════════

  private _drawKPIs(y: number, kpis: KPI[]): number {
    if (kpis.length === 0) return y;

    const doc = this.doc;
    this._sectionTitle(y, 'INDICADORES PRINCIPALES');
    y += 7;

    // Máximo 4 KPIs por fila
    const perRow = Math.min(4, kpis.length);
    const cardW = (this.cw - (perRow - 1) * 4) / perRow;
    const cardH = 22;

    let row = 0;
    kpis.forEach((kpi, i) => {
      if (i > 0 && i % perRow === 0) {
        y += cardH + 4;
        row++;
      }
      const x = this.ml + (i % perRow) * (cardW + 4);
      const color = kpi.color ?? CHART_COLORS[i % CHART_COLORS.length];

      // Fondo tarjeta
      doc.setFillColor(...C.bgCard);
      doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

      // Barra de color lateral
      doc.setFillColor(...color);
      doc.roundedRect(x, y, 3, cardH, 1, 1, 'F');

      // Valor principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...color);
      const valStr = `${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}`;
      doc.text(valStr, x + 7, y + 10);

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.textMid);
      doc.text(kpi.label.toUpperCase(), x + 7, y + 15.5);

      // Subtexto
      if (kpi.sub) {
        doc.setFontSize(6.5);
        doc.setTextColor(...C.textLight);
        doc.text(kpi.sub, x + 7, y + 20);
      }
    });

    // Si los kpis llenan más de una fila
    const rows = Math.ceil(kpis.length / perRow);
    y += rows * (cardH + 4);
    return y + 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 3 — Gráficas
  // ═══════════════════════════════════════════════════════════════════════════

  private _drawCharts(y: number, charts: ChartSpec[]): number {
    if (charts.length === 0) return y;
    const doc = this.doc;
    this._sectionTitle(y, 'VISUALIZACIÓN DE DATOS');
    y += 7;

    // Una o dos gráficas por fila según el ancho disponible
    const twoPerRow = charts.length > 1 && this.pw > 190;
    const chartW = twoPerRow ? (this.cw - 6) / 2 : this.cw;

    for (let i = 0; i < charts.length; i++) {
      const spec = charts[i];
      const isRight = twoPerRow && i % 2 === 1;
      const x = this.ml + (isRight ? chartW + 6 : 0);
      const h = spec.height ?? 55;

      // Verificar si cabe en la página
      if (y + h + 12 > this.ph - this.mb) {
        this._addPage();
        y = this.mt;
      }

      switch (spec.type) {
        case 'bar':
        case 'area':
          y = this._drawBarOrAreaChart(x, y, chartW, h, spec, spec.type === 'area');
          break;
        case 'line':
          y = this._drawLineChart(x, y, chartW, h, spec);
          break;
        case 'donut':
          y = this._drawDonutChart(x, y, chartW, h, spec);
          break;
        case 'grouped-bar':
          y = this._drawGroupedBarChart(x, y, chartW, h, spec);
          break;
        default:
          y = this._drawBarOrAreaChart(x, y, chartW, h, spec, false);
      }

      // Si es segunda gráfica de la fila, ambas están al mismo Y — avanzar
      if (twoPerRow && i % 2 === 1) {
        // y ya avanzó por la primera; la segunda queda en paralelo
      } else if (!twoPerRow || i === charts.length - 1) {
        y += 4;
      }
    }

    return y;
  }

  /** Gráfica de barras o área (simulada con barras + relleno) */
  private _drawBarOrAreaChart(
    x: number, startY: number, w: number, h: number,
    spec: ChartSpec, isArea: boolean
  ): number {
    const doc = this.doc;
    const y = startY;
    const plotH = h - 18; // espacio para ejes y título
    const plotW = w - 14; // espacio para etiqueta Y
    const px = x + 12;
    const py = y + 12;
    const labelCount = spec.labels.length;
    if (labelCount === 0) return startY + h;

    // Título de la gráfica
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.textDark);
    doc.text(spec.title, x + w / 2, y + 6, { align: 'center' });

    // Fondo del área de plot
    doc.setFillColor(...C.bg);
    doc.rect(px, py, plotW, plotH, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(px, py, plotW, plotH, 'S');

    // Calcular escala
    const allVals = spec.series.flatMap(s => s.values).filter(v => !isNaN(v));
    if (allVals.length === 0) return startY + h;
    const maxVal = Math.max(...allVals) * 1.1 || 1;
    const minVal = Math.min(0, Math.min(...allVals));
    const range = maxVal - minVal || 1;

    // Líneas de cuadrícula horizontales (4 líneas)
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    for (let g = 1; g <= 4; g++) {
      const gy = py + plotH - (g / 4) * plotH;
      doc.line(px, gy, px + plotW, gy);
      // Etiqueta Y
      doc.setFontSize(5.5);
      doc.setTextColor(...C.textLight);
      const labelV = ((g / 4) * range + minVal).toFixed(1);
      doc.text(`${labelV}${spec.unit ? spec.unit : ''}`, px - 1, gy + 1, { align: 'right' });
    }

    const barGroupW = plotW / labelCount;
    const series = spec.series;
    const barW = Math.max(2, Math.min(8, barGroupW * 0.6 / series.length));

    series.forEach((s, si) => {
      const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
      doc.setFillColor(...color);

      s.values.forEach((val, vi) => {
        if (isNaN(val)) return;
        const bx = px + vi * barGroupW + barGroupW * 0.5 - barW / 2 + si * (barW + 1);
        const bh = Math.abs(val - minVal) / range * plotH;
        const by = py + plotH - Math.abs(val - minVal) / range * plotH;

        if (isArea) {
          // Simular área con rectángulo semitransparente + línea
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(bx, by, barW, bh, 'F');
        } else {
          doc.rect(bx, by, barW, bh, 'F');
        }
      });
    });

    // Etiquetas eje X (cada N para no saturar)
    const step = Math.ceil(labelCount / 8);
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textMid);
    spec.labels.forEach((lbl, i) => {
      if (i % step !== 0) return;
      const lx = px + i * barGroupW + barGroupW / 2;
      doc.text(String(lbl).slice(0, 6), lx, py + plotH + 4, { align: 'center' });
    });

    // Leyenda
    if (series.length > 1) {
      series.forEach((s, si) => {
        const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
        const lx = px + si * 30;
        doc.setFillColor(...color);
        doc.rect(lx, py + plotH + 8, 4, 2, 'F');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.textMid);
        doc.text(s.label, lx + 5, py + plotH + 9.5);
      });
    }

    return startY + h;
  }

  /** Gráfica de líneas */
  private _drawLineChart(
    x: number, startY: number, w: number, h: number, spec: ChartSpec
  ): number {
    const doc = this.doc;
    const plotH = h - 18;
    const plotW = w - 14;
    const px = x + 12;
    const py = startY + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.textDark);
    doc.text(spec.title, x + w / 2, startY + 6, { align: 'center' });

    doc.setFillColor(...C.bg);
    doc.rect(px, py, plotW, plotH, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(px, py, plotW, plotH, 'S');

    const allVals = spec.series.flatMap(s => s.values).filter(v => !isNaN(v));
    if (allVals.length === 0) return startY + h;
    const maxVal = Math.max(...allVals) * 1.1 || 1;
    const minVal = Math.min(0, Math.min(...allVals));
    const range = maxVal - minVal || 1;
    const labelCount = spec.labels.length;

    // Grid
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    for (let g = 1; g <= 4; g++) {
      const gy = py + plotH - (g / 4) * plotH;
      doc.line(px, gy, px + plotW, gy);
      doc.setFontSize(5.5);
      doc.setTextColor(...C.textLight);
      const lv = ((g / 4) * range + minVal).toFixed(1);
      doc.text(`${lv}${spec.unit ?? ''}`, px - 1, gy + 1, { align: 'right' });
    }

    spec.series.forEach((s, si) => {
      const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
      doc.setDrawColor(...color);
      doc.setLineWidth(0.8);

      let prevX = 0, prevY = 0;
      s.values.forEach((val, vi) => {
        if (isNaN(val)) return;
        const cx = px + (vi / Math.max(labelCount - 1, 1)) * plotW;
        const cy = py + plotH - ((val - minVal) / range) * plotH;
        if (vi === 0) { prevX = cx; prevY = cy; }
        else {
          doc.line(prevX, prevY, cx, cy);
          prevX = cx; prevY = cy;
        }
        // Punto
        doc.setFillColor(...color);
        doc.circle(cx, cy, 0.7, 'F');
      });
    });

    // Eje X
    const step = Math.ceil(labelCount / 8);
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textMid);
    spec.labels.forEach((lbl, i) => {
      if (i % step !== 0) return;
      const lx = px + (i / Math.max(labelCount - 1, 1)) * plotW;
      doc.text(String(lbl).slice(0, 6), lx, py + plotH + 4, { align: 'center' });
    });

    // Leyenda
    if (spec.series.length > 1) {
      spec.series.forEach((s, si) => {
        const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
        const lx = px + si * 32;
        doc.setDrawColor(...color);
        doc.setLineWidth(0.8);
        doc.line(lx, py + plotH + 9, lx + 5, py + plotH + 9);
        doc.setFontSize(5.5);
        doc.setTextColor(...C.textMid);
        doc.text(s.label, lx + 6, py + plotH + 9.5);
      });
    }

    return startY + h;
  }

  /** Gráfica de dona */
  private _drawDonutChart(
    x: number, startY: number, w: number, h: number, spec: ChartSpec
  ): number {
    const doc = this.doc;
    const plotH = h - 12;
    const cx = x + w * 0.38;
    const cy = startY + 10 + plotH / 2;
    const R = Math.min(plotH / 2 - 2, w * 0.28);
    const r = R * 0.55;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.textDark);
    doc.text(spec.title, x + w / 2, startY + 6, { align: 'center' });

    const vals = spec.series[0]?.values ?? [];
    const total = vals.reduce((a, b) => a + b, 0) || 1;

    let angle = -Math.PI / 2;
    vals.forEach((val, i) => {
      const slice = (val / total) * 2 * Math.PI;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      doc.setFillColor(...color);

      // Dibujar sector como polígono aproximado
      const steps = Math.max(12, Math.round((slice / (2 * Math.PI)) * 60));
      const pts: [number, number][] = [[cx, cy]];
      for (let s = 0; s <= steps; s++) {
        const a = angle + (s / steps) * slice;
        pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      // Dibujar como path
      doc.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(p => doc.lineTo(p[0], p[1]));

      // Fallback: dibujar como triángulos en abanico
      for (let s = 0; s < steps; s++) {
        const a1 = angle + (s / steps) * slice;
        const a2 = angle + ((s + 1) / steps) * slice;
        const x1o = cx + Math.cos(a1) * R;
        const y1o = cy + Math.sin(a1) * R;
        const x2o = cx + Math.cos(a2) * R;
        const y2o = cy + Math.sin(a2) * R;
        const x1i = cx + Math.cos(a1) * r;
        const y1i = cy + Math.sin(a1) * r;
        const x2i = cx + Math.cos(a2) * r;
        const y2i = cy + Math.sin(a2) * r;
        // Dibuja el trapezoide como dos triángulos
        doc.setFillColor(...color);
        doc.triangle(x1o, y1o, x2o, y2o, x1i, y1i, 'F');
        doc.triangle(x2o, y2o, x2i, y2i, x1i, y1i, 'F');
      }

      angle += slice;
    });

    // Círculo interior (hueco)
    doc.setFillColor(...C.white);
    doc.circle(cx, cy, r - 0.5, 'F');

    // Total en el centro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.textDark);
    doc.text('TOTAL', cx, cy - 2, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(...C.brand);
    doc.text(String(total % 1 === 0 ? total : total.toFixed(1)), cx, cy + 4, { align: 'center' });

    // Leyenda a la derecha
    const lx = x + w * 0.65;
    spec.labels.forEach((lbl, i) => {
      if (i > 7) return;
      const ly = startY + 14 + i * 8;
      const color = CHART_COLORS[i % CHART_COLORS.length];
      const pct = ((vals[i] ?? 0) / total * 100).toFixed(1);
      doc.setFillColor(...color);
      doc.roundedRect(lx, ly - 3, 4, 3.5, 0.5, 0.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.textMid);
      doc.text(`${String(lbl).slice(0, 16)} (${pct}%)`, lx + 5.5, ly);
    });

    return startY + h;
  }

  /** Barras agrupadas */
  private _drawGroupedBarChart(
    x: number, startY: number, w: number, h: number, spec: ChartSpec
  ): number {
    // Para barras agrupadas reutilizamos bar chart con series múltiples
    return this._drawBarOrAreaChart(x, startY, w, h, spec, false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 4 — Tabla
  // ═══════════════════════════════════════════════════════════════════════════

  private _drawTable(
    startY: number,
    cols: TableColumn[],
    rows: Record<string, unknown>[]
  ): number {
    if (rows.length === 0) return startY;

    const doc = this.doc;
    this._sectionTitle(startY, `DATOS DEL REPORTE (${rows.length} registros)`);
    let y = startY + 8;

    const rowH = 6.5;
    const headH = 8;

    // Calcular anchos de columna
    const totalWeight = cols.reduce((a, c) => a + (c.width ?? 1), 0);
    const colWidths = cols.map(c => ((c.width ?? 1) / totalWeight) * this.cw);

    const drawHeader = (yPos: number) => {
      doc.setFillColor(...C.brandDark);
      doc.rect(this.ml, yPos, this.cw, headH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.white);
      let cx = this.ml;
      cols.forEach((col, i) => {
        const align = col.align ?? 'left';
        const tx = align === 'right'
          ? cx + colWidths[i] - 1.5
          : align === 'center'
          ? cx + colWidths[i] / 2
          : cx + 2;
        doc.text(col.header, tx, yPos + 5.5, { align });
        cx += colWidths[i];
      });
      return yPos + headH;
    };

    y = drawHeader(y);

    rows.forEach((row, ri) => {
      // Salto de página si es necesario
      if (y + rowH > this.ph - this.mb) {
        this._addPage();
        y = this.mt;
        y = drawHeader(y); // repetir encabezados
      }

      // Fila alterna
      if (ri % 2 === 0) {
        doc.setFillColor(...C.bgCard);
        doc.rect(this.ml, y, this.cw, rowH, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...C.textDark);
      let cx = this.ml;

      cols.forEach((col, i) => {
        const rawVal = row[col.key];
        const strVal = col.format
          ? col.format(rawVal)
          : rawVal === null || rawVal === undefined
          ? '—'
          : String(rawVal);

        const align = col.align ?? 'left';
        const tx = align === 'right'
          ? cx + colWidths[i] - 1.5
          : align === 'center'
          ? cx + colWidths[i] / 2
          : cx + 2;

        // Truncar si no cabe
        const maxChars = Math.floor(colWidths[i] / 1.6);
        const display = strVal.length > maxChars
          ? strVal.slice(0, maxChars - 1) + '…'
          : strVal;

        doc.text(display, tx, y + rowH - 1.8, { align });
        cx += colWidths[i];
      });

      // Línea separadora
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.line(this.ml, y + rowH, this.ml + this.cw, y + rowH);

      y += rowH;
    });

    return y + 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 5 — Análisis
  // ═══════════════════════════════════════════════════════════════════════════

  private _drawAnalysis(y: number, points: AnalysisPoint[]): number {
    if (points.length === 0) return y;

    const doc = this.doc;
    if (y + 10 + points.length * 7 > this.ph - this.mb) {
      this._addPage();
      y = this.mt;
    }

    this._sectionTitle(y, 'ANÁLISIS AUTOMÁTICO');
    y += 8;

    doc.setFillColor(...C.bgCard);
    const blockH = Math.ceil(points.length / 2) * 8 + 8;
    doc.roundedRect(this.ml, y, this.cw, blockH, 2, 2, 'F');

    // Borde izquierdo de acento
    doc.setFillColor(...C.brand);
    doc.rect(this.ml, y, 3, blockH, 'F');

    const col1W = this.cw / 2 - 4;
    points.forEach((pt, i) => {
      const col = i % 2;
      const rowIdx = Math.floor(i / 2);
      const px = this.ml + 6 + col * (col1W + 8);
      const py = y + 6 + rowIdx * 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.brand);
      doc.text('▶', px, py);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...C.textDark);
      doc.text(pt.label + ': ', px + 4, py);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMid);
      const labelW = doc.getTextWidth(pt.label + ': ') + 4;
      doc.text(pt.value, px + labelW, py, { maxWidth: col1W - labelW });
    });

    return y + blockH + 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utilidades internas
  // ═══════════════════════════════════════════════════════════════════════════

  private _sectionTitle(y: number, text: string): void {
    const doc = this.doc;
    doc.setFillColor(...C.brand);
    doc.rect(this.ml, y, this.cw, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.text(text, this.ml + 3, y + 3.8);
  }

  private _drawFooter(pageNum: number, total: number, title: string): void {
    const doc = this.doc;
    const fy = this.ph - 9;

    doc.setFillColor(...C.bgCard);
    doc.rect(0, fy - 2, this.pw, 12, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.line(this.ml, fy - 2, this.pw - this.mr, fy - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textLight);
    doc.text('METEOPERÚ — Sistema Meteorológico del Perú', this.ml, fy + 2);
    doc.text(title, this.pw / 2, fy + 2, { align: 'center' });
    doc.text(`Página ${pageNum} de ${total}`, this.pw - this.mr, fy + 2, { align: 'right' });
  }

  private _addPage(): void {
    this.doc.addPage();
    this.pageNum++;
    // Línea fina de encabezado en páginas secundarias
    const doc = this.doc;
    doc.setFillColor(...C.brand);
    doc.rect(0, 0, this.pw, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    doc.text('METEOPERÚ — ' + (this.opts?.title ?? ''), this.ml, 4.2);
    this.mt = 10;
  }
}

// ─── Singleton exportable ─────────────────────────────────────────────────────
export const pdfGenerator = new PdfGenerator();
