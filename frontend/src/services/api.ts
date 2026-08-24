import {
  City,
  Department,
  FullForecastResponse,
  CurrentWeather,
  HourlyForecastItem,
  DepartmentWeatherSummary,
  AlertsResponse,
  CompareResponse,
  HistoryResponse,
  NationalRankings
} from '../types/weather';

// Base URL de la API (soporta variable de entorno en Vercel/Producción o proxy local)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const weatherApi = {
  // Cities & Departments
  async getCities(query?: string, departmentId?: number, region?: string, featuredOnly?: boolean): Promise<City[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (departmentId) params.append('department_id', departmentId.toString());
    if (region) params.append('region', region);
    if (featuredOnly) params.append('featured_only', 'true');

    const res = await fetch(`${API_BASE}/cities?${params.toString()}`);
    if (!res.ok) throw new Error('Error al cargar ciudades del Perú');
    return res.json();
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_BASE}/departments`);
    if (!res.ok) throw new Error('Error al cargar departamentos del Perú');
    return res.json();
  },

  // Weather forecasts
  async getForecast(cityId?: number, lat?: number, lon?: number): Promise<FullForecastResponse> {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());

    const res = await fetch(`${API_BASE}/weather/forecast?${params.toString()}`);
    if (!res.ok) throw new Error('Error al consultar pronóstico meteorológico');
    return res.json();
  },

  async getCurrentWeather(cityId?: number, lat?: number, lon?: number): Promise<CurrentWeather> {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lon !== undefined) params.append('lon', lon.toString());

    const res = await fetch(`${API_BASE}/weather/current?${params.toString()}`);
    if (!res.ok) throw new Error('Error al consultar clima actual');
    return res.json();
  },

  async getOverview(): Promise<DepartmentWeatherSummary[]> {
    const res = await fetch(`${API_BASE}/weather/overview`);
    if (!res.ok) throw new Error('Error al obtener resumen nacional');
    return res.json();
  },

  // Alerts
  async getAlerts(cityId?: number): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    if (cityId) params.append('city_id', cityId.toString());

    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Error al evaluar alertas meteorológicas');
    return res.json();
  },

  // Compare Cities
  async compareCities(cityIds: number[]): Promise<CompareResponse> {
    const idsStr = cityIds.join(',');
    const res = await fetch(`${API_BASE}/compare?city_ids=${idsStr}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al comparar ciudades');
    }
    return res.json();
  },

  // History & Climate Analysis
  async getHistory(cityId: number, startDate?: string, endDate?: string, variable: string = 'temperature'): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    params.append('city_id', cityId.toString());
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('variable', variable);

    const res = await fetch(`${API_BASE}/history?${params.toString()}`);
    if (!res.ok) throw new Error('Error al procesar análisis climático histórico');
    return res.json();
  },

  // National Rankings
  async getRankings(): Promise<NationalRankings> {
    const res = await fetch(`${API_BASE}/rankings`);
    if (!res.ok) throw new Error('Error al consultar rankings climáticos');
    return res.json();
  },

  // Export CSV download URL
  getExportCsvUrl(cityId: number, exportType: 'forecast' | 'history' = 'forecast', days: number = 30): string {
    return `${API_BASE}/export/csv?city_id=${cityId}&export_type=${exportType}&days=${days}`;
  },

  // Favorites
  async getFavorites(): Promise<City[]> {
    const res = await fetch(`${API_BASE}/favorites`);
    if (!res.ok) return [];
    return res.json();
  },

  async addFavorite(cityId: number): Promise<void> {
    await fetch(`${API_BASE}/favorites/${cityId}`, { method: 'POST' });
  },

  async removeFavorite(cityId: number): Promise<void> {
    await fetch(`${API_BASE}/favorites/${cityId}`, { method: 'DELETE' });
  }
};
