import { useEffect, useState } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface IpLocationResponse {
  country_name?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface ReverseGeocodeResponse {
  countryName?: string;
  principalSubdivision?: string;
  city?: string;
  locality?: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

const weatherCodeText = (code: number) => {
  const map: Record<number, string> = {
    0: '晴',
    1: '少云',
    2: '多云',
    3: '阴',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '毛毛雨',
    55: '强毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '阵雨',
    81: '强阵雨',
    82: '暴雨',
    95: '雷暴',
  };
  return map[code] ?? '未知';
};

const regionFromIp = (data: IpLocationResponse) =>
  [data.country_name, data.region, data.city].filter(Boolean).join(' ');

const regionFromReverseGeocode = (data: ReverseGeocodeResponse) =>
  [data.countryName, data.principalSubdivision, data.city || data.locality].filter(Boolean).join(' ');

export const useLocationWeather = () => {
  const [location, setLocation] = useState('地球');
  const [weather, setWeather] = useState('获取中...');
  const [coords, setCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    const updateFromIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = (await res.json()) as IpLocationResponse;
        const regionName = regionFromIp(data);
        if (regionName) {
          setLocation(regionName);
        }
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setCoords({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch {
        setLocation('地球');
        setWeather((current) => (current === '获取中...' ? '晴' : current));
      }
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
      try {
        const resp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
        );
        const data = (await resp.json()) as ReverseGeocodeResponse;
        const regionName = regionFromReverseGeocode(data);
        if (regionName) {
          setLocation(regionName);
        }
      } catch {
        setLocation(`经纬度 ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
      }
    };

    updateFromIp();

    if (!navigator.geolocation) {
      const timer = window.setInterval(updateFromIp, 10 * 60 * 1000);
      return () => window.clearInterval(timer);
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCoords({ latitude, longitude });
        void reverseGeocode(latitude, longitude);
      },
      () => {
        void updateFromIp();
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );
    const fallbackTimer = window.setInterval(updateFromIp, 10 * 60 * 1000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    const updateWeather = async () => {
      if (!coords) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
        const res = await fetch(url);
        const data = (await res.json()) as OpenMeteoResponse;
        const current = data.current;
        if (!current) return;
        const weatherText = weatherCodeText(Number(current.weather_code));
        const temp = Number(current.temperature_2m).toFixed(1);
        const wind = Number(current.wind_speed_10m).toFixed(1);
        setWeather(`${weatherText} ${temp}°C · 风速${wind}km/h`);
      } catch {
        setWeather('天气获取失败');
      }
    };

    void updateWeather();
    const timer = window.setInterval(updateWeather, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [coords]);

  return { location, weather };
};
