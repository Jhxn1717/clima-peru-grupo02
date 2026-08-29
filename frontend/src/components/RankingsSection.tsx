import React, { useState, useEffect } from 'react';
import { Award, Flame, Snowflake, Sun, CloudRain, Wind, MapPin } from 'lucide-react';
import { NationalRankings } from '../types/weather';
import { weatherApi } from '../services/api';
import { WeatherIcon } from './WeatherIcon';

interface RankingsSectionProps {
  onSelectCityByName: (cityName: string) => void;
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({ onSelectCityByName }) => {
  const [rankings, setRankings] = useState<NationalRankings | null>(null);
  const [activeCategory, setActiveCategory] = useState<'hottest' | 'coldest' | 'uv' | 'rain' | 'wind'>('hottest');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const data = await weatherApi.getRankings();
        setRankings(data);
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const categories = [
    { id: 'hottest', label: 'Más Calurosas', icon: Flame, color: 'text-rose-400', key: 'hottest' },
    { id: 'coldest', label: 'Más Frías', icon: Snowflake, color: 'text-cyan-300', key: 'coldest' },
    { id: 'uv', label: 'Mayor Índice UV', icon: Sun, color: 'text-amber-400', key: 'highest_uv' },
    { id: 'rain', label: 'Mayor Precipitación', icon: CloudRain, color: 'text-blue-400', key: 'rainiest' },
    { id: 'wind', label: 'Más Ventosas', icon: Wind, color: 'text-teal-400', key: 'windiest' },
  ];

  const currentList = rankings ? (rankings as any)[
    activeCategory === 'hottest' ? 'hottest' :
    activeCategory === 'coldest' ? 'coldest' :
    activeCategory === 'uv' ? 'highest_uv' :
    activeCategory === 'rain' ? 'rainiest' : 'windiest'
  ] || [] : [];

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Rankings y Extremos Meteorológicos del Perú
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ciudades del territorio nacional con valores máximos y mínimos registrados en tiempo real.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto no-scrollbar shadow-sm">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Podium & List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 p-4" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {currentList.map((item: any, idx: number) => {
            const rank = idx + 1;
            const medalColor =
              rank === 1 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50' :
              rank === 2 ? 'bg-slate-200 dark:bg-slate-400/20 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-400/50' :
              rank === 3 ? 'bg-amber-700/15 text-amber-800 dark:text-amber-400 border-amber-700/50' :
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

            const displayMetric =
              activeCategory === 'hottest' ? `${item.temperature}°C` :
              activeCategory === 'coldest' ? `${item.temperature}°C` :
              activeCategory === 'uv' ? `UV ${item.uv_index}` :
              activeCategory === 'rain' ? `${item.precipitation} mm` : `${item.wind_speed} km/h`;

            return (
              <div
                key={item.city_id || idx}
                onClick={() => onSelectCityByName(item.city_name)}
                className="glass-card glass-card-hover p-4 rounded-2xl flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border ${medalColor}`}>
                    #{rank}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 shadow-sm">
                    <WeatherIcon name={item.weather_icon} size={20} />
                  </div>
                </div>

                <div className="my-3">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                    {item.city_name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                    <span className="truncate">{item.department_name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeCategory === 'hottest' || activeCategory === 'coldest' ? 'Temperatura' :
                     activeCategory === 'uv' ? 'Radiación' :
                     activeCategory === 'rain' ? 'Lluvia' : 'Viento'}
                  </span>
                  <strong className={`text-base font-extrabold ${
                    activeCategory === 'hottest' ? 'text-rose-600 dark:text-rose-400' :
                    activeCategory === 'coldest' ? 'text-cyan-600 dark:text-cyan-300' :
                    activeCategory === 'uv' ? 'text-amber-600 dark:text-amber-400' :
                    activeCategory === 'rain' ? 'text-blue-600 dark:text-blue-400' : 'text-teal-600 dark:text-teal-400'
                  }`}>
                    {displayMetric}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
