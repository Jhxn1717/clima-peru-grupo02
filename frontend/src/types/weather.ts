export interface City {
  id: number;
  department_id: number;
  name: string;
  province?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  is_featured: boolean;
  is_capital: boolean;
  department_name?: string;
  region_natural?: 'Costa' | 'Sierra' | 'Selva' | string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  capital: string;
  latitude: number;
  longitude: number;
  region_natural: string;
  description?: string;
  cities: City[];
}

export interface CurrentWeather {
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts?: number | null;
  surface_pressure: number;
  precipitation: number;
  precipitation_probability?: number | null;
  cloud_cover: number;
  uv_index: number;
  uv_category: string;
  weather_code: number;
  weather_description: string;
  weather_icon: string;
  is_day: boolean;
  temp_max: number;
  temp_min: number;
  sunrise?: string;
  sunset?: string;
  updated_at: string;
  city_id?: number | null;
  city_name: string;
  department_name?: string | null;
  region_natural?: string | null;
  altitude?: number | null;
  latitude: number;
  longitude: number;
}

export interface HourlyForecastItem {
  time: string;
  hour_label: string;
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  precipitation_probability: number;
  precipitation: number;
  weather_code: number;
  weather_description: string;
  weather_icon: string;
  wind_speed: number;
  uv_index: number;
  is_day: boolean;
}

export interface DailyForecastItem {
  date: string;
  day_name: string;
  day_short: string;
  temp_max: number;
  temp_min: number;
  weather_code: number;
  weather_description: string;
  weather_icon: string;
  precipitation_sum: number;
  precipitation_probability_max: number;
  uv_index_max: number;
  wind_speed_max: number;
  sunrise: string;
  sunset: string;
}

export interface FullForecastResponse {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface DepartmentWeatherSummary {
  department_id: number;
  department_name: string;
  capital: string;
  latitude: number;
  longitude: number;
  region_natural: string;
  temperature: number;
  weather_description: string;
  weather_icon: string;
  relative_humidity: number;
  precipitation: number;
  uv_index: number;
  wind_speed: number;
}

export interface WeatherAlert {
  id: string;
  city_id?: number | null;
  city_name: string;
  department_name?: string | null;
  region_natural?: string | null;
  title: string;
  severity: 'info' | 'caution' | 'warning' | 'danger';
  severity_label: string;
  category: string;
  icon: string;
  description: string;
  recommendation: string;
  trigger_value: string;
  threshold: string;
  timestamp: string;
}

export interface AlertsResponse {
  total_alerts: number;
  danger_count: number;
  warning_count: number;
  caution_count: number;
  info_count: number;
  alerts: WeatherAlert[];
}

export interface CityComparisonItem {
  city_id: number;
  city_name: string;
  department_name: string;
  region_natural: string;
  altitude: number;
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  precipitation: number;
  wind_speed: number;
  uv_index: number;
  temp_max: number;
  temp_min: number;
  weather_description: string;
  weather_icon: string;
  surface_pressure: number;
}

export interface CompareResponse {
  count: number;
  cities: CityComparisonItem[];
}

export interface HistoryDataPoint {
  date: string;
  temp_max?: number;
  temp_min?: number;
  temp_mean?: number;
  precipitation_sum?: number;
  wind_speed_max?: number;
  relative_humidity_mean?: number;
  weather_code?: number;
}

export interface HistoryStats {
  average: number;
  maximum: number;
  minimum: number;
  trend: 'ascendente' | 'descendente' | 'estable' | string;
  total_precipitation?: number;
  days_analyzed: number;
}

export interface HistoryResponse {
  city_id: number;
  city_name: string;
  department_name: string;
  variable: string;
  start_date: string;
  end_date: string;
  stats: HistoryStats;
  data: HistoryDataPoint[];
}

export interface NationalRankings {
  hottest: Array<Record<string, any>>;
  coldest: Array<Record<string, any>>;
  highest_uv: Array<Record<string, any>>;
  rainiest: Array<Record<string, any>>;
  windiest: Array<Record<string, any>>;
  total_cities_evaluated: number;
}
