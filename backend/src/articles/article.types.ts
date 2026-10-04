// 文章类型的唯一定义处，前后端都 import 这个文件。
//
// 这里以前是两份手抄的副本（前端 src/lib/article-types.ts 一份、这份一份），
// 两边的字段可选性已经漂移过，所以现在只留这一份：前端用 `import type` 引用，
// 因为整份文件没有任何运行时 import，打包时会被 esbuild 整段擦除，不进 bundle。
//
// 只有真正属于“API 契约”的形状放这里；后台自己的查询参数、SQL 行映射等留在各自模块。
export type ArticleStatus = 'draft' | 'published';

/**
 * 一篇文章往外传的形状：后端从 SQLite 映射出来的记录、以及 /api 的响应体。
 * 前端构建期固化的 Markdown 和 GitHub 来源也构造这个形状，但它们没有发布状态，
 * 所以 status / publishedAt / createdAt / updatedAt / coverUrl 都是可选的。
 */
export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl?: string;
  category: string;
  subcategory?: string;
  date: string;
  readTime: string;
  tags: string[];
  status?: ArticleStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ArticleSummary = Omit<Article, 'content'>;

/**
 * 写接口的请求体。status 必须显式携带：后端的 articleWriteSchema 缺省补 draft，
 * 更新时漏传会把已发布的文章悄悄下架（scripts/check-admin-api.mjs 盯着这条）。
 */
export interface ArticleWritePayload {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  subcategory?: string;
  readTime: string;
  tags: string[];
  status: ArticleStatus;
}

export interface ArticleListResponse {
  items: ArticleSummary[];
  page: number;
  pageSize: number;
  total: number;
}

/** 仅后端使用：仓储层收到的已解析查询参数（page/pageSize 已经过默认值和范围校验）。 */
export interface ArticleListQuery {
  category?: string;
  tag?: string;
  page: number;
  pageSize: number;
}
