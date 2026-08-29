import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { GitCompare, Plus, X, Thermometer, Droplets, Wind, Sun, Mountain, ArrowUp, ArrowDown } from 'lucide-react';
import { City, CompareResponse, CityComparisonItem } from '../types/weather';
import { weatherApi } from '../services/api';
import { WeatherIcon } from './WeatherIcon';

interface CityComparisonProps {
  cities: City[];
}

export const CityComparison: React.FC<CityComparisonProps> = ({ cities }) => {
  // Default selected: Lima (1), Cusco (10), Iquitos (19) or available IDs
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([1, 10, 19]);
  const [comparisonData, setComparisonData] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data when selectedCityIds change
  useEffect(() => {
    if (selectedCityIds.length < 2) return;

    const loadComparison = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await weatherApi.compareCities(selectedCityIds);
        setComparisonData(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos comparativos');
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [selectedCityIds]);

  const addCity = (cityId: number) => {
    if (selectedCityIds.length >= 4) return;
    if (!selectedCityIds.includes(cityId)) {
      setSelectedCityIds([...selectedCityIds, cityId]);
    }
  };

  const removeCity = (cityId: number) => {
    if (selectedCityIds.length <= 2) return;
    setSelectedCityIds(selectedCityIds.filter(id => id !== cityId));
  };

  const chartData = comparisonData?.cities.map((c) => ({
    name: c.city_name,
    Temperatura: c.temperature,
    Sensación: c.apparent_temperature,
    Humedad: c.relative_humidity,
    Lluvia: c.precipitation,
    Viento: c.wind_speed,
    UV: c.uv_index,
  })) || [];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Comparador Meteorológico entre Ciudades del Perú
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona de 2 a 4 ciudades peruanas para contrastar temperaturas, humedad, radiación UV y lluvias.
          </p>
        </div>

        {/* City Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCityIds.length < 4 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val) addCity(val);
                }}
                value=""
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 shadow-sm"
              >
                <option value="" disabled>+ Añadir ciudad al comparador</option>
                {cities
                  .filter(c => !selectedCityIds.includes(c.id))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.department_name})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Side by Side Comparison Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 rounded-2xl h-64 animate-pulse bg-slate-200/60 dark:bg-slate-900/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparisonData?.cities.map((city) => (
            <div
              key={city.city_id}
              className="glass-card p-5 rounded-2xl relative flex flex-col justify-between border-t-4 border-t-sky-500 shadow-md"
            >
              {/* Remove button */}
              {selectedCityIds.length > 2 && (
                <button
                  onClick={() => removeCity(city.city_id)}
                  title="Eliminar de la comparación"
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* City Title & Region */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{city.city_name}</h4>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                    city.region_natural === 'Costa' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                    city.region_natural === 'Sierra' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                    'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                  }`}>
                    {city.region_natural}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{city.department_name}</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Mountain className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span>{city.altitude} msnm</span>
                </div>
              </div>

              {/* Big Weather Summary */}
              <div className="my-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{Math.round(city.temperature)}°C</span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Sensación {city.apparent_temperature}°C</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm">
                  <WeatherIcon name={city.weather_icon} size={28} />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> Humedad:
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200">{city.relative_humidity}%</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Índice UV:
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200">UV {city.uv_index}</strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" /> Viento:
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200">{city.wind_speed} km/h</strong>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400">Rango Hoy:</span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">{city.temp_min}°</span> - <span className="text-rose-600 dark:text-rose-400">{city.temp_max}°C</span>
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Comparative Bar Chart */}
      {comparisonData && comparisonData.cities.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gráfico Comparativo Directo</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:opacity-20" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Temperatura" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sensación" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Humedad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="UV" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

