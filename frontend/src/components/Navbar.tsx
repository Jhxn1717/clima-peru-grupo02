import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  RefreshCw,
  Clock,
  Compass,
  Bell,
  BarChart3,
  GitCompare,
  Layers,
  Award,
  Download
} from 'lucide-react';
import { City } from '../types/weather';

interface NavbarProps {
  cities: City[];
  selectedCity: City | null;
  onSelectCity: (city: City) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLocateUser: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  alertsCount: number;
  onExportForecast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  onRefresh,
  isRefreshing,
  onLocateUser,
  activeTab,
  setActiveTab,
  alertsCount,
  onExportForecast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // Update Peruvian time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      };
      setCurrentTime(new Intl.DateTimeFormat('es-PE', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter cities by search query
  const filteredCities = searchQuery.trim() === ''
    ? cities.filter(c => c.is_featured).slice(0, 8)
    : cities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.province?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'map', label: 'Mapa del Perú', icon: Compass },
    { id: 'compare', label: 'Comparar', icon: GitCompare },
    { id: 'analysis', label: 'Análisis Histórico', icon: BarChart3 },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: alertsCount > 0 ? alertsCount : null },
    { id: 'rankings', label: 'Rankings', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-sky-500 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl font-black gradient-text-peru">PE</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">METEO<span className="text-sky-400">PERÚ</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-md">PRO</span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">Datos Meteorológicos del Perú</p>
            </div>
          </div>

          {/* Search Box & Quick City Selector */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Buscar ciudad o departamento (ej. Cusco, Piura, Iquitos)..."
                className="w-full pl-10 pr-10 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 mt-2 py-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-xl">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {searchQuery ? 'Resultados de búsqueda' : 'Ciudades destacadas del Perú'}
                </div>
                {filteredCities.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-400 text-center">
                    No se encontró "{searchQuery}" en el catálogo del Perú
                  </div>
                ) : (
                  filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        onSelectCity(city);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="text-sm font-medium text-slate-200 group-hover:text-white">{city.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({city.department_name})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {city.region_natural && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            city.region_natural === 'Costa' ? 'bg-amber-500/20 text-amber-300' :
                            city.region_natural === 'Sierra' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-teal-500/20 text-teal-300'
                          }`}>
                            {city.region_natural}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{city.altitude} msnm</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Action Controls: Clock, Geolocation, Refresh, Export */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono">{currentTime}</span>
            </div>

            {/* Geolocation Button */}
            <button
              onClick={onLocateUser}
              title="Detectar mi ubicación"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-sky-400 transition-colors"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Actualizar datos meteorológicos"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={onExportForecast}
              title="Descargar reporte CSV"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-sky-600' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
