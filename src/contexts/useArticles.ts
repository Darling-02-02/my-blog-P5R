import { useContext, useEffect, useState } from 'react';
import { findArticle as findStaticArticle } from '../data/articles';
import { articleApi, ArticleApiError, isArticleApiEnabled } from '../lib/api';
import type { Article } from '../lib/article-types';
import { ArticleContext } from './article-context';
import type { LoadStatus } from './article-context';

const getErrorMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) return error.message;
  if (error instanceof Error) return error.message;
  return '文章加载失败';
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (!context) throw new Error('useArticles must be used within ArticleProvider');
  return context;
};

export const useArticle = (articleKey: string | undefined) => {
  const { articles: summaries } = useArticles();
  const [article, setArticle] = useState<Article | undefined>();
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const staticArticle = findStaticArticle(articleKey);

      if (!articleKey) {
        if (cancelled) return;
        setArticle(undefined);
        setStatus('ready');
        setError(null);
        return;
      }

      if (!isArticleApiEnabled) {
        if (cancelled) return;
        setArticle(staticArticle);
        setStatus('ready');
        setError(null);
        return;
      }

      const decodedKey = decodeURIComponent(articleKey);
      const summary = summaries.find((item) => item.slug === decodedKey);
      if (!cancelled) {
        setArticle(summary ? { ...summary, content: '' } : undefined);
        setStatus('loading');
        setError(null);
      }

      try {
        const nextArticle = await articleApi.findPublishedBySlug(decodedKey);
        if (cancelled) return;
        setArticle(nextArticle);
        setStatus('ready');
      } catch (requestError) {
        if (cancelled) return;
        if (requestError instanceof ArticleApiError && requestError.status === 404) {
          setArticle(staticArticle);
          setStatus('ready');
          setError(null);
          return;
        }
        setArticle(staticArticle);
        setStatus('error');
        setError(getErrorMessage(requestError));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [articleKey, summaries]);

  return { article, status, error };
};
