import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { activeArticleReader } from '../lib/article-reader';
import type { ArticleSummary } from '../../backend/src/articles/article.types';
import { ArticleContext } from './article-context';

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<ArticleSummary[]>(activeArticleReader.initial);
  const [status, setStatus] = useState(activeArticleReader.initialStatus);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (activeArticleReader.loadsAsync) {
      setStatus('loading');
      setError(null);
    }

    const { items, error: readError } = await activeArticleReader.list();
    setArticles(items);
    setError(readError ?? null);
    setStatus(readError ? 'error' : 'ready');
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const value = useMemo(() => ({ articles, status, error, refresh }), [articles, status, error, refresh]);
  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
};
