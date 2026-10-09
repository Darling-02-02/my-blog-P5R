// 访客数/访问量来自站点自带的计数器（Cloudflare Pages Function + KV，见 functions/api/stats.ts）。
// 本地 dev、计数器还没接上、或请求失败时返回 null —— 侧栏显示「—」，绝不显示编出来的 0。

const visitFlagKey = 'blog_has_visited';

export interface SiteVisits {
  /** 访问量：每次打开页面都算一次 */
  pv: number;
  /** 访客数：同一浏览器只算第一次 */
  uv: number;
}

export const recordVisit = async (): Promise<SiteVisits | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const firstVisit = localStorage.getItem(visitFlagKey) ? '0' : '1';
    const response = await fetch(`${import.meta.env.BASE_URL}api/stats?firstVisit=${firstVisit}`, { method: 'POST' });
    if (!response.ok) return null;

    const data = (await response.json()) as Partial<SiteVisits>;
    if (typeof data.pv !== 'number' || typeof data.uv !== 'number') return null;

    localStorage.setItem(visitFlagKey, '1');
    return { pv: data.pv, uv: data.uv };
  } catch {
    return null;
  }
};
