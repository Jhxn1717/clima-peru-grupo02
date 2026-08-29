import React from 'react';
import {
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudHail,
  CloudSunRain,
  CloudLightning,
  Moon,
  CloudMoon,
  CloudMoonRain,
  Snowflake,
  Wind
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ name, className = 'w-6 h-6', size = 24 }) => {
  switch (name?.toLowerCase()) {
    case 'sun':
      return <Sun size={size} className={`${className} text-amber-400`} />;
    case 'sunmedium':
      return <SunMedium size={size} className={`${className} text-amber-300`} />;
    case 'cloudsun':
      return <CloudSun size={size} className={`${className} text-amber-300`} />;
    case 'cloud':
      return <Cloud size={size} className={`${className} text-slate-300`} />;
    case 'cloudfog':
      return <CloudFog size={size} className={`${className} text-slate-400`} />;
    case 'clouddrizzle':
      return <CloudDrizzle size={size} className={`${className} text-sky-400`} />;
    case 'cloudrain':
      return <CloudRain size={size} className={`${className} text-sky-500`} />;
    case 'cloudrainwind':
      return <CloudRainWind size={size} className={`${className} text-indigo-400`} />;
    case 'cloudsnow':
    case 'snowflake':
      return <Snowflake size={size} className={`${className} text-cyan-300`} />;
    case 'cloudhail':
      return <CloudHail size={size} className={`${className} text-cyan-400`} />;
    case 'cloudsunrain':
      return <CloudSunRain size={size} className={`${className} text-amber-400`} />;
    case 'cloudlightning':
      return <CloudLightning size={size} className={`${className} text-yellow-400`} />;
    case 'moon':
      return <Moon size={size} className={`${className} text-indigo-300`} />;
    case 'cloudmoon':
      return <CloudMoon size={size} className={`${className} text-indigo-300`} />;
    case 'cloudmoonrain':
      return <CloudMoonRain size={size} className={`${className} text-blue-400`} />;
    case 'wind':
      return <Wind size={size} className={`${className} text-teal-300`} />;
    default:
      return <Sun size={size} className={`${className} text-amber-400`} />;
  }
};
