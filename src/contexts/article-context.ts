import { createContext } from 'react';
import type { ArticleSummary } from '../../backend/src/articles/article.types';
import type { ArticleReadStatus } from '../lib/article-reader';

// 状态定义归读路径所有，这里只转出去，免得两个模块各维护一份联合类型。
type LoadStatus = ArticleReadStatus;

export interface ArticleContextValue {
  articles: ArticleSummary[];
  status: LoadStatus;
  error: string | null;
  refresh: () => Promise<void>;
}

export const ArticleContext = createContext<ArticleContextValue | null>(null);
export type { LoadStatus };
