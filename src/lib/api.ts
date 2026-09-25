import type { Article, ArticleListResponse } from './article-types';

const source = import.meta.env.VITE_ARTICLE_SOURCE ?? 'static';
const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const isArticleApiEnabled = source === 'api' && Boolean(apiBase);

export class ArticleApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ArticleApiError';
    this.status = status;
    this.code = code;
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  if (!apiBase) {
    throw new ArticleApiError(0, 'API_NOT_CONFIGURED', 'Article API is not configured');
  }

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | T
    | null;

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new ArticleApiError(
      response.status,
      error?.code ?? 'API_ERROR',
      error?.message ?? `Article API request failed (${response.status})`,
    );
  }

  return payload as T;
};

const encodeQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const articleApi = {
  listPublished: (params: { category?: string; tag?: string; page?: number; pageSize?: number } = {}) =>
    request<ArticleListResponse>(`/api/articles${encodeQuery(params)}`),
  listAllPublished: async () => {
    const items = [];
    let page = 1;
    let total = 0;

    while (items.length < total || page === 1) {
      const response = await articleApi.listPublished({ page, pageSize: 100 });
      items.push(...response.items);
      total = response.total;
      if (response.items.length === 0) break;
      page += 1;
    }

    return { items, page: 1, pageSize: items.length, total: items.length } satisfies ArticleListResponse;
  },
  findPublishedBySlug: (slug: string) => request<Article>(`/api/articles/${encodeURIComponent(slug)}`),
};
