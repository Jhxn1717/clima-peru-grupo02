import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  HelpCircle,
  Filter
} from 'lucide-react';
import { AlertsResponse, City } from '../types/weather';
import { weatherApi } from '../services/api';

interface WeatherAlertsProps {
  selectedCity: City | null;
  onSelectCityByName: (cityName: string) => void;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ selectedCity, onSelectCityByName }) => {
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'city' | 'national'>('national');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const cityId = viewScope === 'city' && selectedCity ? selectedCity.id : undefined;
        const data = await weatherApi.getAlerts(cityId);
        setAlertsData(data);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [selectedCity, viewScope]);

  const filteredAlerts = alertsData?.alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  }) || [];

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'danger':
        return {
          bg: 'bg-red-500/10 border-red-500/40 text-red-300',
          badge: 'bg-red-500 text-white font-bold',
          icon: <AlertOctagon className="w-5 h-5 text-red-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'caution':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
          badge: 'bg-yellow-400 text-slate-950 font-bold',
          icon: <Info className="w-5 h-5 text-yellow-400" />
        };
      default:
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
          badge: 'bg-sky-500 text-white font-semibold',
          icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />
        };
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500 dark:text-red-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Sistema de Alertas Meteorológicas del Perú
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avisos de condiciones extremas calculados con umbrales meteorológicos físicos.
          </p>
        </div>

        {/* Scope Toggle: National vs Current City */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <button
              onClick={() => setViewScope('national')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                viewScope === 'national' ? 'bg-sky-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Nivel Nacional
            </button>
            <button
              onClick={() => setViewScope('city')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                viewScope === 'city' ? 'bg-sky-500 text-white shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {selectedCity ? selectedCity.name : 'Ciudad Actual'}
            </button>
          </div>
        </div>
      </div>

      {/* Severity Counters & Filter Bar */}
      {alertsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setFilterSeverity('danger')}
            className={`p-3 rounded-2xl border transition-all text-left shadow-sm ${
              filterSeverity === 'danger' ? 'bg-red-500/20 border-red-500' : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-red-500 dark:text-red-400">Peligro</span>
              <AlertOctagon className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{alertsData.danger_count}</div>
          </button>

          <button
            onClick={() => setFilterSeverity('warning')}
            className={`p-3 rounded-2xl border transition-all text-left shadow-sm ${
              filterSeverity === 'warning' ? 'bg-amber-500/20 border-amber-500' : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Advertencia</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{alertsData.warning_count}</div>
          </button>

          <button
            onClick={() => setFilterSeverity('caution')}
            className={`p-3 rounded-2xl border transition-all text-left shadow-sm ${
              filterSeverity === 'caution' ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-yellow-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Precaución</span>
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{alertsData.caution_count}</div>
          </button>

          <button
            onClick={() => setFilterSeverity('all')}
            className={`p-3 rounded-2xl border transition-all text-left shadow-sm ${
              filterSeverity === 'all' ? 'bg-sky-500/20 border-sky-500' : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Todas</span>
              <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{alertsData.total_alerts}</div>
          </button>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Evaluando parámetros meteorológicos del Perú...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
            No hay alertas activas en el filtro seleccionado.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border ${style.bg} transition-all space-y-3 shadow-sm`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-sm">
                      {style.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${style.badge}`}>
                          {alert.severity_label}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {alert.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                        <span className="font-medium">{alert.city_name}</span>
                        {alert.department_name && <span className="text-slate-500 dark:text-slate-400">({alert.department_name})</span>}
                        {alert.region_natural && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                            {alert.region_natural}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {alert.city_name !== 'Territorio Nacional del Perú' && (
                    <button
                      onClick={() => onSelectCityByName(alert.city_name)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline self-start sm:self-auto"
                    >
                      Consultar ciudad →
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pl-1">
                  {alert.description}
                </p>

                {/* Recommendation Box */}
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-300 block flex items-center gap-1.5">
                    💡 Recomendación Preventiva:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-normal">
                    {alert.recommendation}
                  </p>
                </div>

                {/* Trigger metadata */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-800/40">
                  <span>Valor detectado: <strong className="text-slate-700 dark:text-slate-300">{alert.trigger_value}</strong></span>
                  <span>Umbral de activación: <strong className="text-slate-700 dark:text-slate-300">{alert.threshold}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

