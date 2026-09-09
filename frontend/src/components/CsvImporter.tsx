import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  CloudRain,
  Sparkles,
  Loader2,
  Eye,
  Database
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { weatherApi } from '../services/api';
import { adminApi } from '../services/adminApi';
import { authStorage } from '../services/authApi';
import { saveCsvPreview, loadCsvPreview, clearCsvPreview } from '../utils/csvStorage';

const CHUNK_SIZE = 3000;
const MAX_CHART_POINTS = 500;
const MAX_RENDERED = 1000;
const LARGE_FILE_SIZE = 1024 * 1024;

// Extremos iterativos (sin spread) para tolerar datasets de 100k+ filas sin
// desbordar la pila (Math.max(...arr) revienta con arrays muy grandes).
const maxOf = (arr: number[]) => (arr.length ? arr.reduce((a, b) => (b > a ? b : a), -Infinity) : 0);
const minOf = (arr: number[]) => (arr.length ? arr.reduce((a, b) => (b < a ? b : a), Infinity) : 0);

// Caché de módulo: sobrevive al desmontaje de la pestaña para que el dataset
// importado (y su archivo) no se pierdan al cambiar de pestaña.
const csvSession: {
  importResult: any | null;
  lastFile: File | null;
  saveStatus: string | null;
  saveHasError: boolean;
} = {
  importResult: null,
  lastFile: null,
  saveStatus: null,
  saveHasError: false,
};

interface CsvImporterProps {
  theme?: 'dark' | 'light';
  onDatasetSaved?: () => void;
}

export const CsvImporter: React.FC<CsvImporterProps> = ({ theme = 'dark', onDatasetSaved }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any | null>(csvSession.importResult);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [chartMode, setChartMode] = useState<'all' | 'sampled'>('all');
  const [lastFile, setLastFile] = useState<File | null>(csvSession.lastFile);
  const [isSavingDataset, setIsSavingDataset] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(csvSession.saveStatus);
  const [saveHasError, setSaveHasError] = useState<boolean>(csvSession.saveHasError);
  const [restoredFromDb, setRestoredFromDb] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = authStorage.getUser()?.role === 'admin';

  // Recupera la vista previa del último CSV cargado (persistida en IndexedDB)
  // cuando no hay un dataset vivo en la memoria de la pestaña actual.
  useEffect(() => {
    if (csvSession.importResult) return;
    let cancelled = false;
    loadCsvPreview().then((stored) => {
      if (stored && !cancelled) {
        setImportResult(stored);
        setRestoredFromDb(true);
        setChartMode(stored.data?.length > 60 ? 'sampled' : 'all');
        setCurrentPage(1);
        setSaveStatus('Vista previa recuperada del último dataset cargado en este navegador (persiste aunque cierres sesión o recargues).');
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Sincroniza la caché de módulo en cada cambio de estado
  useEffect(() => {
    csvSession.importResult = importResult;
  }, [importResult]);
  useEffect(() => {
    csvSession.lastFile = lastFile;
  }, [lastFile]);
  useEffect(() => {
    csvSession.saveStatus = saveStatus;
    csvSession.saveHasError = saveHasError;
  }, [saveStatus, saveHasError]);

  // Guarda el dataset real del archivo subido en la tabla weather_records
  const saveToDatabase = async () => {
    if (!lastFile) return;
    setIsSavingDataset(true);
    setSaveStatus(null);
    setSaveHasError(false);
    try {
      const res = await adminApi.importDataset(lastFile);
      const detail =
        res.unmatched_stations?.length > 0
          ? ` Estaciones sin vincular: ${res.unmatched_stations.join(', ')}`
          : '';
      setSaveStatus(`${res.message}${detail}`);
      onDatasetSaved?.();
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message || 'No se pudo guardar el dataset en la base de datos.'}`);
      setSaveHasError(true);
    } finally {
      setIsSavingDataset(false);
    }
  };

  // Carga de respaldo: trae los registros reales guardados en Supabase (weather_records)
  const loadFromDatabase = async () => {
    setIsLoadingDb(true);
    setError(null);
    try {
      const { records } = await weatherApi.getRealDataset(10000);
      if (!records.length) {
        setSaveHasError(true);
        setSaveStatus('Todavía no hay datos reales guardados en la base de datos. Sube un CSV y pulsa «Guardar en Base de Datos Real».');
        return;
      }

      const data = records.map((r: any, idx: number) => ({
        id: idx + 1,
        date: r.record_date,
        city: r.city_name,
        department: r.department_name,
        temperature: r.temperature,
        temp_min: r.temp_min,
        temp_max: r.temp_max,
        humidity: r.humidity,
        precipitation: r.precipitation ?? 0,
        wind_speed: r.wind_speed,
        uv_index: r.uv_index,
        condition: r.condition || 'Dato Registrado'
      }));

      const avg = (arr: number[]) =>
        arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
      const temps = data.map((d: any) => d.temperature ?? 0);
      const precips = data.map((d: any) => d.precipitation);
      const winds = data.map((d: any) => d.wind_speed ?? 0);
      const uvs = data.map((d: any) => d.uv_index ?? 0);

      const result = {
        success: true,
        message: `Dataset real cargado desde la base de datos: ${records.length} registros guardados (source=csv).`,
        source_db: true,
        stats: {
          total_records: records.length,
          filename: 'weather_records (base de datos real)',
          detected_city: `${data[0]?.city || 'Perú'} (${data[0]?.department || ''})`,
          all_cities: Array.from(new Set(data.map((d: any) => d.city))),
          start_date: data[0]?.date,
          end_date: data[data.length - 1]?.date,
          temperature: {
            average: avg(temps),
            max: maxOf(temps),
            min: minOf(temps)
          },
          precipitation: {
            total: Math.round(precips.reduce((a, b) => a + b, 0) * 10) / 10,
            max_single_day: maxOf(precips),
            rainy_days: precips.filter((p: number) => p > 0.1).length
          },
          wind: {
            average: avg(winds),
            max: maxOf(winds)
          },
          uv: {
            average: avg(uvs),
            max: maxOf(uvs)
          }
        },
        data
      };
      setImportResult(result);
      setChartMode(data.length > 60 ? 'sampled' : 'all');
      setCurrentPage(1);
      setRestoredFromDb(true);
      setSaveHasError(false);
      setSaveStatus('Visualización generada desde los datos reales guardados en la base de datos.');
    } catch (err: any) {
      setSaveHasError(true);
      setSaveStatus(`Error: ${err.message || 'No se pudo consultar el dataset real guardado.'}`);
    } finally {
      setIsLoadingDb(false);
    }
  };

  // Datasets de prueba predefinidos para carga instantánea
  const loadDemoData = (station: 'lima' | 'cusco' | 'iquitos') => {
    let demoName = 'Estación Lima Costa - SENAMHI';
    let city = 'Lima';
    let dept = 'Lima';
    let baseTemp = 21.0;
    let baseHum = 78;
    let baseWind = 14.0;

    if (station === 'cusco') {
      demoName = 'Estación Cusco Sierra - Valle Sagrado';
      city = 'Cusco';
      dept = 'Cusco';
      baseTemp = 13.5;
      baseHum = 58;
      baseWind = 11.0;
    } else if (station === 'iquitos') {
      demoName = 'Estación Iquitos Selva - Río Amazonas';
      city = 'Iquitos';
      dept = 'Loreto';
      baseTemp = 28.0;
      baseHum = 88;
      baseWind = 9.0;
    }

    const rows = Array.from({ length: 30 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const tempVar = Math.sin(i * 0.5) * 3.5;
      const temp = Math.round((baseTemp + tempVar) * 10) / 10;
      const tempMax = Math.round((temp + 3.2) * 10) / 10;
      const tempMin = Math.round((temp - 2.8) * 10) / 10;
      const rain = station === 'iquitos' ? (i % 3 === 0 ? 12.5 : 0.0) : (i % 5 === 0 ? 1.2 : 0.0);
      const wind = Math.round((baseWind + Math.cos(i) * 3) * 10) / 10;
      const uv = station === 'cusco' ? 11 : station === 'lima' ? 7 : 9;

      return {
        id: i + 1,
        date: `2026-08-${day}`,
        city,
        department: dept,
        temperature: temp,
        temp_max: tempMax,
        temp_min: tempMin,
        humidity: Math.min(98, Math.max(40, Math.round(baseHum + Math.sin(i) * 8))),
        precipitation: rain,
        wind_speed: wind,
        uv_index: uv,
        condition: rain > 5 ? 'Lluvia moderada' : temp > 25 ? 'Soleado y despejado' : 'Parcialmente nublado'
      };
    });

    const temps = rows.map(r => r.temperature);
    const precips = rows.map(r => r.precipitation);
    const winds = rows.map(r => r.wind_speed);
    const uvs = rows.map(r => r.uv_index);

    const demoResult = {
      success: true,
      message: `Dataset de demostración cargado con éxito (${demoName})`,
      stats: {
        total_records: rows.length,
        filename: `${station}_meteo_demo.csv`,
        detected_city: `${city} (${dept})`,
        all_cities: [city],
        start_date: rows[0].date,
        end_date: rows[rows.length - 1].date,
        temperature: {
          average: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
          max: maxOf(rows.map(r => r.temp_max)),
          min: minOf(rows.map(r => r.temp_min))
        },
        precipitation: {
          total: Math.round(precips.reduce((a, b) => a + b, 0) * 10) / 10,
          max_single_day: maxOf(precips),
          rainy_days: precips.filter(p => p > 0.1).length
        },
        wind: {
          average: Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10,
          max: maxOf(winds)
        },
        uv: {
          average: Math.round((uvs.reduce((a, b) => a + b, 0) / uvs.length) * 10) / 10,
          max: maxOf(uvs)
        }
      },
      data: rows
    };
    setImportResult(demoResult);
    saveCsvPreview(demoResult);
    setChartMode('all');
    setError(null);
    setCurrentPage(1);
    setRestoredFromDb(false);
  };

  // Parser local completo que lee el 100% de todas las filas del archivo
  const parseLocalCsv = async (
    text: string,
    filename: string,
    serverMessage?: string | null,
    serverStats?: any
  ) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('El archivo CSV no contiene suficientes registros.');
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';

    let headerIndex = 0;
    const colMap: Record<string, number> = {};
    const headerHints = ['fecha', 'date', 'hora', 'time', 'temp', 'temperatura', 'ciudad', 'city', 'departamento'];
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const joined = lines[i].split(delimiter).join(' ').toLowerCase();
      if (headerHints.some(k => joined.includes(k))) {
        headerIndex = i;
        lines[i].split(delimiter).forEach((rawCol, idx) => {
          const norm = rawCol.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
          const set = (key: string) => { if (colMap[key] === undefined) colMap[key] = idx; };
          if (/fecha|date|time|hora|dia/.test(norm)) set('date');
          else if (/ciudad|city|estacion|location/.test(norm)) set('city');
          else if (/departamento|department|region/.test(norm)) set('department');
          else if (/provincia|province/.test(norm)) set('province');
          else if (/temp_max|maxima|tmax/.test(norm)) set('temp_max');
          else if (/temp_min|minima|tmin/.test(norm)) set('temp_min');
          else if (/temp_mean|media|tmean|temp|temperatura/.test(norm)) set('temperature');
          else if (/hum|humedad|relative_humidity/.test(norm)) set('humidity');
          else if (/precip|precipitacion|lluvia|rain/.test(norm)) set('precipitation');
          else if (/viento|wind|speed|velocidad/.test(norm)) set('wind_speed');
          else if (/uv|indice_uv/.test(norm)) set('uv_index');
          else if (/condicion|condition|descripcion|clima|weather/.test(norm)) set('condition');
        });
        break;
      }
    }

    const data: any[] = [];
    const temps: number[] = [];
    const precips: number[] = [];
    const winds: number[] = [];
    const uvs: number[] = [];
    const cities = new Set<string>();
    const dates: string[] = [];

    const cleanFloat = (raw: string | undefined, fallback?: number): number | null => {
      if (raw === undefined || raw.trim() === '') return fallback ?? null;
      const parsed = parseFloat(raw.replace('°C', '').replace('°', '').replace('km/h', '').replace('%', '').replace('mm', '').replace(',', '.'));
      return isNaN(parsed) ? (fallback ?? null) : Math.round(parsed * 100) / 100;
    };

    let rowId = 0;

    const processRow = (line: string) => {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2 || !cols.some(c => c !== '')) return;
      if (/---|reporte de/.test(line.toLowerCase())) return;

      const get = (key: string) => (colMap[key] !== undefined && colMap[key] < cols.length ? cols[colMap[key]] : undefined);

      const rawTemp = cleanFloat(get('temperature'));
      const tempMax = cleanFloat(get('temp_max'));
      const tempMin = cleanFloat(get('temp_min'));
      const fallbackTemp = tempMax !== null && tempMin !== null ? Math.round(((tempMax + tempMin) / 2) * 10) / 10 : 20.0;
      const temp = rawTemp === null ? fallbackTemp : rawTemp;
      const humidity = cleanFloat(get('humidity'), 75) ?? 75;
      const rain = cleanFloat(get('precipitation'), 0.0) ?? 0.0;
      const wind = cleanFloat(get('wind_speed'), 10.0) ?? 10.0;
      const uv = cleanFloat(get('uv_index'), 7) ?? 7;

      rowId += 1;

      const dateVal = get('date') || `Fila ${rowId}`;
      const cityVal = get('city') || 'Perú';
      const deptVal = get('department') || '';
      const provVal = get('province') || '';

      temps.push(temp);
      precips.push(rain);
      winds.push(wind);
      uvs.push(uv);
      if (cityVal && cityVal !== 'Perú') cities.add(cityVal);
      if (dateVal) dates.push(dateVal);

      data.push({
        id: rowId,
        date: dateVal,
        city: cityVal,
        department: deptVal,
        province: provVal,
        temperature: temp,
        temp_min: tempMin ?? Math.round((temp - 3) * 10) / 10,
        temp_max: tempMax ?? Math.round((temp + 3) * 10) / 10,
        humidity,
        precipitation: rain,
        wind_speed: wind,
        uv_index: uv,
        condition: get('condition') || 'Dato Registrado'
      });
    };

    for (let i = headerIndex + 1; i < lines.length; i++) {
      processRow(lines[i]);
      if (i % CHUNK_SIZE === 0) {
        await new Promise<void>(r => setTimeout(r, 0));
      }
    }

    if (data.length === 0) {
      throw new Error('No se pudieron interpretar registros válidos en el archivo.');
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    const localStats = {
      total_records: data.length,
      filename,
      detected_city: data[0]?.city || 'Perú',
      all_cities: Array.from(cities),
      start_date: dates[0] || '-',
      end_date: dates[dates.length - 1] || '-',
      temperature: {
        average: avg(temps),
        max: maxOf(temps),
        min: minOf(temps)
      },
      precipitation: {
        total: Math.round(precips.reduce((a, b) => a + b, 0) * 10) / 10,
        max_single_day: maxOf(precips),
        rainy_days: precips.filter(p => p > 0.1).length
      },
      wind: {
        average: avg(winds),
        max: maxOf(winds)
      },
      uv: {
        average: avg(uvs),
        max: maxOf(uvs)
      }
    };

    const useServerStats = serverStats && serverStats.total_records === data.length;

    const result = {
      success: true,
      message: serverMessage || `Archivo procesado con éxito: ${data.length} registros cargados al 100% (${filename})`,
      stats: useServerStats ? serverStats : localStats,
      data
    };
    setImportResult(result);
    saveCsvPreview(result);
    setChartMode(data.length > 60 ? 'sampled' : 'all');
    setError(null);
    setRestoredFromDb(false);
  };

  // Manejo de carga de archivo
  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor selecciona un archivo con formato .CSV');
      return;
    }

    setIsUploading(true);
    setError(null);
    setLastFile(file);

    try {
      const text = await file.text();

      let serverMessage: string | null = null;
      let serverStats: any = null;

      if (file.size <= LARGE_FILE_SIZE) {
        try {
          const result = await weatherApi.importCsv(file);
          if (result?.stats) {
            serverMessage = result.message || null;
            serverStats = result.stats;
          }
        } catch (err) {
          console.warn('API backend no disponible, procesando 100% de los datos localmente:', err);
        }
      }

      await parseLocalCsv(text, file.name, serverMessage, serverStats);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo CSV. Verifica el formato o descarga la plantilla.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Gráficos: Permite ver todos los puntos (100% del archivo) o vista suavizada
  const chartData = useMemo(() => {
    if (!importResult?.data || importResult.data.length === 0) return [];
    const source = importResult.data;
    const maxPoints = chartMode === 'all' ? Math.min(MAX_CHART_POINTS, source.length) : 50;
    if (source.length <= maxPoints) return source;
    const step = Math.ceil(source.length / maxPoints);
    return source.filter((_: any, idx: number) => idx % step === 0);
  }, [importResult, chartMode]);

  // Filtrado de filas en la tabla
  const filteredData = useMemo(() => {
    if (!importResult?.data) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return importResult.data;
    return importResult.data.filter((row: any) =>
      String(row.date || '').toLowerCase().includes(q) ||
      String(row.city || '').toLowerCase().includes(q) ||
      String(row.department || '').toLowerCase().includes(q) ||
      String(row.condition || '').toLowerCase().includes(q)
    );
  }, [importResult, searchQuery]);

  const effectiveRowsPerPage = rowsPerPage === 0 ? Math.max(1, Math.min(filteredData.length, MAX_RENDERED)) : rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / effectiveRowsPerPage));
  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * effectiveRowsPerPage, currentPage * effectiveRowsPerPage);
  }, [filteredData, currentPage, effectiveRowsPerPage]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Importador & Analizador de Datos CSV del Perú
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lectura y análisis del 100% de los registros de cualquier archivo CSV meteorológico.
              </p>
            </div>
          </div>
        </div>

        {/* Download Template Button */}
        <a
          href={weatherApi.getTemplateCsvUrl()}
          download="plantilla_meteorologica_peru.csv"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all shadow-sm self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Plantilla CSV Oficial</span>
        </a>
      </div>

      {/* Upload Zone & Quick Demos */}
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 hover:border-sky-500/60 hover:bg-sky-500/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-inner">
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isUploading ? 'Procesando el 100% de las filas del archivo CSV...' : 'Arrastra y suelta tu archivo CSV aquí, o haz clic para explorar'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lee todos los registros completos sin límite. Compatible con delimitadores por coma (,) o punto y coma (;).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Demo Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Prueba rápida con datasets de demostración:
          </span>
          <button
            onClick={() => loadDemoData('lima')}
            className="px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium transition-all shadow-sm"
          >
            🌊 Demo Lima (Costa)
          </button>
          <button
            onClick={() => loadDemoData('cusco')}
            className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-medium transition-all shadow-sm"
          >
            🏔️ Demo Cusco (Sierra)
          </button>
          <button
            onClick={() => loadDemoData('iquitos')}
            className="px-3 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-medium transition-all shadow-sm"
          >
            🌿 Demo Iquitos (Selva)
          </button>
          <button
            onClick={loadFromDatabase}
            disabled={isLoadingDb}
            className={`px-3 py-1 rounded-xl font-medium transition-all shadow-sm flex items-center gap-1.5 ${
              isLoadingDb
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30'
            }`}
            title="Genera la visualización desde los registros reales guardados en la base de datos"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isLoadingDb ? 'Consultando BD real...' : 'Ver datos reales guardados'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-600 dark:text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Processed Results & Analytics Section */}
      {importResult && (
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          
          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs shadow-sm">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{importResult.message}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {isAdmin && lastFile && (
                <button
                  onClick={saveToDatabase}
                  disabled={isSavingDataset}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                    isSavingDataset
                      ? 'border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                      : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                  title="Sube este archivo como los datos reales que alimentan todo el sistema"
                >
                  {isSavingDataset ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingDataset ? 'Guardando en la base de datos real...' : 'Guardar en Base de Datos Real'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setImportResult(null);
                  setLastFile(null);
                  setError(null);
                  setSaveStatus(null);
                  setSaveHasError(false);
                  setRestoredFromDb(false);
                  clearCsvPreview();
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar dataset</span>
              </button>
            </div>
          </div>

          {/* Save Status Message */}
          {saveStatus && (
            <div className={`p-3 rounded-2xl border text-xs ${
              saveHasError
                ? 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
            }`}>
              {saveStatus}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Registros */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registros</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {importResult.stats.total_records}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% de filas leídas</span>
            </div>

            {/* 2. Ubicación Detectada */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ubicación</span>
              <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1 truncate" title={importResult.stats.detected_city}>
                {importResult.stats.detected_city}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{importResult.stats.all_cities?.length || 1} estación(es)</span>
            </div>

            {/* 3. Temperatura Promedio */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Temp Promedio</span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {importResult.stats.temperature?.average}°C
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Mín {importResult.stats.temperature?.min}° / Máx {importResult.stats.temperature?.max}°</span>
            </div>

            {/* 4. Precipitación Total */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Precipitación Total</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {importResult.stats.precipitation?.total} mm
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{importResult.stats.precipitation?.rainy_days} días con lluvia</span>
            </div>

            {/* 5. Viento Promedio */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Viento Promedio</span>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                {importResult.stats.wind?.average} km/h
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Ráfaga máx {importResult.stats.wind?.max} km/h</span>
            </div>

            {/* 6. Periodo Temporal */}
            <div className="glass-card p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Periodo</span>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                {importResult.stats.start_date}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">al {importResult.stats.end_date}</span>
            </div>
          </div>

          {/* Interactive Charts from CSV Data */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Visualización Gráfica ({chartData.length} puntos renderizados):
              </span>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setChartMode('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    chartMode === 'all'
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos los datos
                </button>
                {importResult.data.length > 50 && (
                  <button
                    onClick={() => setChartMode('sampled')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      chartMode === 'sampled'
                        ? 'bg-sky-500 text-white font-bold shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Muestreo rápido (50 pts)
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Temperature Evolution */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    Evolución Térmica del Dataset Completo
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Temperaturas (°C)</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="csvTempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-20" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="°" />
                      <Tooltip />
                      <Legend />
                      <Area isAnimationActive={false} type="monotone" dataKey="temperature" name="Temp Media" unit="°C" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#csvTempGrad)" />
                      {chartData[0]?.temp_max !== undefined && (
                        <Line isAnimationActive={false} type="monotone" dataKey="temp_max" name="Temp Máx" unit="°C" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                      )}
                      {chartData[0]?.temp_min !== undefined && (
                        <Line isAnimationActive={false} type="monotone" dataKey="temp_min" name="Temp Mín" unit="°C" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Rainfall & Wind */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    Precipitación & Viento del Dataset Completo
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Lluvia (mm) & Viento (km/h)</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-20" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar isAnimationActive={false} dataKey="precipitation" name="Lluvia (mm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line isAnimationActive={false} type="monotone" dataKey="wind_speed" name="Viento (km/h)" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Data Table with 100% of rows and customizable page sizes */}
          <div className="glass-card rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Tabla Completa de Registros ({importResult.data.length} filas)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mostrando {paginatedData.length} registros en esta página de {filteredData.length} filtrados
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span>Mostrar:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={0}>{importResult.data.length <= MAX_RENDERED ? `Todos (${importResult.data.length})` : `Todos (${MAX_RENDERED} por página)`}</option>
                  </select>
                </div>

                {/* Table Search Input */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Buscar fecha o ciudad..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900/90 sticky top-0 z-10 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Ciudad / Estación</th>
                    <th className="py-3 px-4 text-center">Temperatura</th>
                    <th className="py-3 px-4 text-center">Rango Mín/Máx</th>
                    <th className="py-3 px-4 text-center">Humedad</th>
                    <th className="py-3 px-4 text-center">Lluvia</th>
                    <th className="py-3 px-4 text-center">Viento</th>
                    <th className="py-3 px-4 text-center">UV</th>
                    <th className="py-3 px-4">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedData.map((row: any, idx: number) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * effectiveRowsPerPage + idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{row.city}</div>
                        {row.department && <div className="text-[10px] text-slate-400">{row.department}{row.province ? ` · ${row.province}` : ''}</div>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {row.temperature !== null ? `${row.temperature}°C` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.temp_min}°</span>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">{row.temp_max}°C</span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-sky-600 dark:text-sky-400 font-medium">
                        {row.humidity !== null ? `${row.humidity}%` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-medium">
                        {row.precipitation > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{row.precipitation} mm</span>
                        ) : (
                          <span className="text-slate-400">0 mm</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center text-teal-600 dark:text-teal-400">
                        {row.wind_speed !== null ? `${row.wind_speed} k/h` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {row.uv_index !== null ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            UV {row.uv_index}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[150px]">
                        {row.condition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Página {currentPage} de {totalPages} ({filteredData.length} registros totales)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
