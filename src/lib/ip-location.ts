export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface IpLocation {
  label: string;
  coords: Coordinates | null;
}

// ipwho.is 的返回形状（字段名和 ipapi 那套不同，别再照抄 ipapi 的字段）。
interface IpWhoIsResponse {
  success?: boolean;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// 解析 IP 归属地：拿到多少算多少。认不出来就回空 label，让调用方老实显示「地球」，
// 不要自己编一个地名出来。
export const parseIpLocation = (payload: unknown): IpLocation => {
  const data = (payload ?? {}) as IpWhoIsResponse;
  if (data.success === false) return { label: '', coords: null };

  const coords =
    isFiniteNumber(data.latitude) && isFiniteNumber(data.longitude)
      ? { latitude: data.latitude, longitude: data.longitude }
      : null;

  // city 缺了才用 region；两边都有的地方（新加坡）country 和 city 是同一个词，去个重。
  const parts = [data.country, data.city || data.region].filter((part): part is string => Boolean(part));

  return { label: [...new Set(parts)].join(' '), coords };
};
