export type ArticleStatus = 'draft' | 'published';

export interface ArticleRecord {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  subcategory?: string;
  date: string;
  readTime: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ArticleSummary = Omit<ArticleRecord, 'content'>;

export interface ArticleWriteInput {
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
  publishedAt?: string | null;
}

export interface ArticleListQuery {
  category?: string;
  tag?: string;
  page: number;
  pageSize: number;
}

export interface ArticleListResult {
  items: ArticleSummary[];
  page: number;
  pageSize: number;
  total: number;
}
