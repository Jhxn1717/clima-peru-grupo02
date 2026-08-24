import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CurrentWeatherHero } from './components/CurrentWeatherHero';
import { MetricCardsGrid } from './components/MetricCardsGrid';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { WeatherCharts } from './components/WeatherCharts';
import { PeruMap } from './components/PeruMap';
import { CityComparison } from './components/CityComparison';
import { ClimateAnalysis } from './components/ClimateAnalysis';
import { WeatherAlerts } from './components/WeatherAlerts';
import { RankingsSection } from './components/RankingsSection';
import { SkeletonLoader } from './components/SkeletonLoader';
import { Footer } from './components/Footer';
import { City, FullForecastResponse, DepartmentWeatherSummary, AlertsResponse } from './types/weather';
import { weatherApi } from './services/api';
import { MapPin, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [forecast, setForecast] = useState<FullForecastResponse | null>(null);
  const [departmentsSummary, setDepartmentsSummary] = useState<DepartmentWeatherSummary[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial cities catalogue
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cityList = await weatherApi.getCities();
        setCities(cityList);
        // Default to Lima or first city
        const defaultCity = cityList.find(c => c.name === 'Lima') || cityList[0];
        if (defaultCity) {
          setSelectedCity(defaultCity);
        }
      } catch (err: any) {
        console.error('Error cargando ciudades:', err);
        setError('No se pudo conectar con el servidor meteorológico.');
        setIsLoading(false);
      }
    };

    loadCities();
  }, []);

  // Load overview for map and general alerts
  const loadGlobalOverview = useCallback(async () => {
    try {
      const [overviewData, alertsData] = await Promise.all([
        weatherApi.getOverview(),
        weatherApi.getAlerts()
      ]);
      setDepartmentsSummary(overviewData);
      setAlertsSummary(alertsData);
    } catch (err) {
      console.error('Error loading global overview:', err);
    }
  }, []);

  useEffect(() => {
    loadGlobalOverview();
  }, [loadGlobalOverview]);

  // Load weather for selected city
  const loadCityWeather = useCallback(async (city: City, showRefreshing: boolean = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await weatherApi.getForecast(city.id);
      setForecast(data);
    } catch (err: any) {
      console.error('Error cargando pronóstico:', err);
      setError(`Error al consultar datos meteorológicos de ${city.name}. Intente de nuevo.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadCityWeather(selectedCity);
    }
  }, [selectedCity, loadCityWeather]);

  // Handle City Selection
  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
  };

  const handleSelectCityByName = (cityName: string) => {
    const found = cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (found) {
      setSelectedCity(found);
      setActiveTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // User Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por su navegador.');
      return;
    }

    setIsRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const data = await weatherApi.getForecast(undefined, latitude, longitude);
          setForecast(data);
          // Create temp city object
          setSelectedCity({
            id: 0,
            department_id: 0,
            name: data.current.city_name || 'Mi Ubicación',
            latitude,
            longitude,
            altitude: 0,
            is_featured: false,
            is_capital: false,
            department_name: data.current.department_name || 'Perú',
            region_natural: 'Costa'
          });
          setActiveTab('dashboard');
        } catch (e) {
          alert('Error al consultar el clima de sus coordenadas.');
        } finally {
          setIsRefreshing(false);
        }
      },
      (err) => {
        setIsRefreshing(false);
        alert('No se pudo acceder a su ubicación: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedCity) {
      loadCityWeather(selectedCity, true);
      loadGlobalOverview();
    }
  };

  // Export forecast CSV
  const handleExportForecast = () => {
    if (selectedCity) {
      const url = weatherApi.getExportCsvUrl(selectedCity.id, 'forecast');
      window.open(url, '_blank');
    }
  };

  // Featured Quick Select Cities for Peru
  const featuredQuickCities = [
    'Lima', 'Arequipa', 'Cusco', 'Piura', 'Trujillo',
    'Chiclayo', 'Iquitos', 'Huancayo', 'Puno', 'Tacna', 'Chimbote'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLocateUser={handleLocateUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsCount={alertsSummary ? alertsSummary.danger_count + alertsSummary.warning_count : 0}
        onExportForecast={handleExportForecast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quick Featured Cities Carousel Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Acceso Rápido:
          </span>
          {featuredQuickCities.map((cName) => {
            const isCurrent = selectedCity?.name === cName;
            return (
              <button
                key={cName}
                onClick={() => handleSelectCityByName(cName)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                  isCurrent
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {cName}
              </button>
            );
          })}
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Dynamic View Rendering based on activeTab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {isLoading || !forecast ? (
              <SkeletonLoader />
            ) : (
              <>
                {/* 1. Hero Weather Card */}
                <CurrentWeatherHero weather={forecast.current} />

                {/* 2. Key Metrics Grid (6 cards) */}
                <MetricCardsGrid weather={forecast.current} />

                {/* 3. 24-Hour Forecast Carousel */}
                <HourlyForecast hourly={forecast.hourly} />

                {/* 4. Forecast Charts & 7-Day Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WeatherCharts hourly={forecast.hourly} />
                  <DailyForecast daily={forecast.daily} />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <PeruMap
            departmentsSummary={departmentsSummary}
            onSelectCityByName={handleSelectCityByName}
            selectedCity={selectedCity}
          />
        )}

        {activeTab === 'compare' && (
          <CityComparison cities={cities} />
        )}

        {activeTab === 'analysis' && (
          <ClimateAnalysis cities={cities} selectedCity={selectedCity} />
        )}

        {activeTab === 'alerts' && (
          <WeatherAlerts
            selectedCity={selectedCity}
            onSelectCityByName={handleSelectCityByName}
          />
        )}

        {activeTab === 'rankings' && (
          <RankingsSection onSelectCityByName={handleSelectCityByName} />
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default App;
