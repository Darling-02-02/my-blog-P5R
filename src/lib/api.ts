import type { Article, ArticleListResponse, ArticleWritePayload } from '../../backend/src/articles/article.types';

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

// 管理端用后端自己的令牌鉴权；公开接口不需要。
const adminRequest = <T>(token: string, path: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('X-Admin-Token', token);
  return request<T>(path, { ...options, headers });
};

interface AdminArticleList {
  items: Article[];
  truncated: boolean;
  maxItems: number;
}

export const articleApi = {
  listPublished: (params: { category?: string; tag?: string; page?: number; pageSize?: number } = {}) =>
    request<ArticleListResponse>(`/api/articles${encodeQuery(params)}`),
  listAllPublished: async () => {
    const items = [];
    let page = 1;
    let total = 0;

    // pageSize 上限由后端 zod 定死（backend/src/articles/article.schema.ts 的 .max(50)），
    // 传更大值会被 400 挡回来，读路径也就永远只能走回退。
    while (items.length < total || page === 1) {
      const response = await articleApi.listPublished({ page, pageSize: 50 });
      items.push(...response.items);
      total = response.total;
      if (response.items.length === 0) break;
      page += 1;
    }

    return { items, page: 1, pageSize: items.length, total: items.length } satisfies ArticleListResponse;
  },
  findPublishedBySlug: (slug: string) => request<Article>(`/api/articles/${encodeURIComponent(slug)}`),
};

// 写接口是后端独有的能力：GitHub 通道靠提交文件，没有草稿与发布状态。
// payload 必须显式带 status —— 后端的 articleWriteSchema 会用默认值 draft 覆盖，
// 少传这一项会把已发布的文章在编辑时悄悄下架。
export const articleAdminApi = {
  list: (token: string) => adminRequest<AdminArticleList>(token, '/api/admin/articles'),
  create: (token: string, payload: ArticleWritePayload) =>
    adminRequest<Article>(token, '/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (token: string, id: number, payload: ArticleWritePayload) =>
    adminRequest<Article>(token, `/api/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (token: string, id: number) => adminRequest<null>(token, `/api/admin/articles/${id}`, { method: 'DELETE' }),
  setPublished: (token: string, id: number, published: boolean) =>
    adminRequest<Article>(token, `/api/admin/articles/${id}/${published ? 'publish' : 'unpublish'}`, {
      method: 'POST',
    }),
};
