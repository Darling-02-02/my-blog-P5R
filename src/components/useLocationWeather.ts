import { useCallback, useEffect, useState } from 'react';
import { parseIpLocation, type Coordinates } from '../lib/ip-location';

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

const regionFromReverseGeocode = (data: ReverseGeocodeResponse) =>
  [data.countryName, data.principalSubdivision, data.city || data.locality].filter(Boolean).join(' ');

interface Snapshot {
  location: string;
  coords: Coordinates | null;
  weatherText: string;
  precise: boolean;
  savedAt: number;
}

// 拿到的结果缓存 10 分钟：这段时间里来回翻页就不再打第三方接口，
// 也顺便记住"这是 IP 猜的还是用户自己点出来的"，刷新后按钮不会又冒出来。
// v2：v1 里可能存着换接口之前那次失败留下的「地球 / 天气未知」，别让它再挡 10 分钟。
const cacheKey = 'blog_location_weather_v2';
const cacheTtl = 10 * 60 * 1000;
const earth = '地球';

const readSnapshot = (): Snapshot | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Snapshot;
    if (typeof parsed?.location !== 'string' || typeof parsed?.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > cacheTtl) return null;

    return parsed;
  } catch {
    return null;
  }
};

const writeSnapshot = (snapshot: Snapshot) => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(snapshot));
  } catch {
    // 隐私模式/配额满：缓存写不进去不影响这一屏显示
  }
};

// 读天气；失败返回 null，让调用方保留上一次的文字，而不是把卡片改成"获取失败"。
const fetchWeather = async ({ latitude, longitude }: Coordinates): Promise<string | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    // 第三方接口卡住就别让卡片一直挂着「获取中...」
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as OpenMeteoResponse;
    const current = data.current;
    if (!current) return null;

    const weatherText = weatherCodeText(Number(current.weather_code));
    const temp = Number(current.temperature_2m).toFixed(1);
    const wind = Number(current.wind_speed_10m).toFixed(1);
    return `${weatherText} ${temp}°C · 风速${wind}km/h`;
  } catch {
    return null;
  }
};

const reverseGeocode = async ({ latitude, longitude }: Coordinates): Promise<string | null> => {
  try {
    const resp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
      { signal: AbortSignal.timeout(8000) },
    );
    const data = (await resp.json()) as ReverseGeocodeResponse;
    return regionFromReverseGeocode(data) || null;
  } catch {
    return null;
  }
};

export const useLocationWeather = () => {
  const [snapshot] = useState(readSnapshot);
  const [location, setLocation] = useState(snapshot?.location ?? earth);
  const [weather, setWeather] = useState(snapshot?.weatherText || '获取中...');
  const [coords, setCoords] = useState<Coordinates | null>(snapshot?.coords ?? null);
  const [isPrecise, setIsPrecise] = useState(snapshot?.precise ?? false);
  const [isLocating, setIsLocating] = useState(false);

  // IP 定位和"用当前位置"都走这一段：定坐标 → 取天气 → 记缓存。
  const applyLocation = useCallback(
    async (nextCoords: Coordinates | null, nextLocation: string, precise: boolean) => {
      setCoords(nextCoords);
      setLocation(nextLocation);
      setIsPrecise(precise);

      const weatherText = nextCoords ? (await fetchWeather(nextCoords)) ?? '天气获取失败' : '天气未知';
      setWeather(weatherText);
      writeSnapshot({ location: nextLocation, coords: nextCoords, weatherText, precise, savedAt: Date.now() });
    },
    [],
  );

  // 默认只按 IP 猜个大概位置：不再一进页面就弹定位授权框。
  useEffect(() => {
    if (snapshot) return;

    let active = true;

    void (async () => {
      try {
        // ipapi.co 现在对浏览器甩 Cloudflare 的机器人挑战页（不是 JSON），换成 ipwho.is。
        const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(8000) });
        const { label, coords: ipCoords } = parseIpLocation(await res.json());
        if (!active) return;

        await applyLocation(ipCoords, label || earth, false);
      } catch {
        if (!active) return;
        // IP 定位失败就老实说不知道，别编一个"晴"出来。
        setWeather((current) => (current === '获取中...' ? '天气未知' : current));
      }
    })();

    return () => {
      active = false;
    };
  }, [applyLocation, snapshot]);

  // 想要准一点的位置就自己点按钮，这时才请求精确定位。
  const requestPreciseLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const precise = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        void (async () => {
          const place =
            (await reverseGeocode(precise)) ??
            `经纬度 ${precise.latitude.toFixed(3)}, ${precise.longitude.toFixed(3)}`;
          await applyLocation(precise, place, true);
          setIsLocating(false);
        })();
      },
      () => setIsLocating(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [applyLocation]);

  // 页面一直开着的时候每 10 分钟对一次天气。
  useEffect(() => {
    if (!coords) return;

    const timer = window.setInterval(() => {
      void fetchWeather(coords).then((weatherText) => {
        if (!weatherText) return;
        setWeather(weatherText);
        writeSnapshot({ location, coords, weatherText, precise: isPrecise, savedAt: Date.now() });
      });
    }, cacheTtl);

    return () => window.clearInterval(timer);
  }, [coords, isPrecise, location]);

  return { location, weather, isPrecise, isLocating, requestPreciseLocation };
};
