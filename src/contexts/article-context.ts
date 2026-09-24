import { createContext } from 'react';
import type { ArticleSummary } from '../lib/article-types';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface ArticleContextValue {
  articles: ArticleSummary[];
  status: LoadStatus;
  error: string | null;
  refresh: () => Promise<void>;
}

export const ArticleContext = createContext<ArticleContextValue | null>(null);
export type { LoadStatus };
