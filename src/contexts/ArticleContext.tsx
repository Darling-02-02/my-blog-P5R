import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { articles as staticArticles } from '../data/articles';
import { articleApi, ArticleApiError, isArticleApiEnabled } from '../lib/api';
import type { ArticleSummary } from '../lib/article-types';
import { ArticleContext } from './article-context';

const getErrorMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) return error.message;
  if (error instanceof Error) return error.message;
  return '文章加载失败';
};

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<ArticleSummary[]>(isArticleApiEnabled ? [] : staticArticles);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(isArticleApiEnabled ? 'loading' : 'ready');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isArticleApiEnabled) {
      setArticles(staticArticles);
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await articleApi.listPublished();
      setArticles(response.items);
      setStatus('ready');
    } catch (requestError) {
      setArticles(staticArticles);
      setStatus('error');
      setError(getErrorMessage(requestError));
    }
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
