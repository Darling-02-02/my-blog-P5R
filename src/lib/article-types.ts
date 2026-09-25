export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
  coverUrl?: string;
  status?: ArticleStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ArticleSummary = Omit<Article, 'content'>;

export interface ArticleWriteInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  subcategory: string;
  readTime: string;
  tags: string[];
}

export interface ArticleListResponse {
  items: ArticleSummary[];
  page: number;
  pageSize: number;
  total: number;
}
