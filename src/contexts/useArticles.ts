import { useContext, useEffect, useState } from 'react';
import { activeArticleReader } from '../lib/article-reader';
import type { Article } from '../../backend/src/articles/article.types';
import { ArticleContext } from './article-context';
import type { LoadStatus } from './article-context';

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
      const decodedKey = decodeURIComponent(articleKey ?? '');
      const summary = summaries.find((item) => item.slug === decodedKey);
      const preview = summary && activeArticleReader.preview ? activeArticleReader.preview(summary) : undefined;

      if (preview) {
        setArticle(preview);
        setStatus('loading');
        setError(null);
      }

      const { article: nextArticle, error: readError } = await activeArticleReader.find(articleKey);
      if (cancelled) return;
      setArticle(nextArticle);
      setError(readError ?? null);
      setStatus(readError ? 'error' : 'ready');
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [articleKey, summaries]);

  return { article, status, error };
};
