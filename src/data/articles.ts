import type { Article } from '../lib/article-types';
import { parseArticleSource } from '../lib/frontmatter';

export type { Article } from '../lib/article-types';

const articleModules = import.meta.glob('../content/articles/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const slugFromPath = (path: string) =>
  path
    .replace('../content/articles/', '')
    .replace(/\.md$/, '')
    .replace(/\\/g, '/');

export const articles: Article[] = Object.entries(articleModules)
  .map(([path, source]) => {
    const { meta, body } = parseArticleSource(source, path);

    return {
      id: Number(meta.id),
      slug: slugFromPath(path),
      title: String(meta.title),
      excerpt: String(meta.excerpt),
      category: String(meta.category),
      subcategory: meta.subcategory ? String(meta.subcategory) : undefined,
      date: String(meta.date),
      readTime: String(meta.readTime),
      tags: meta.tags as string[],
      content: body,
      coverUrl: meta.coverUrl ? String(meta.coverUrl) : undefined,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);

// Slugs are category-prefixed ("生物信息/xxx"), so encode per segment.
export const getArticlePath = (article: Pick<Article, 'slug'>) =>
  `/article/${article.slug.split('/').map(encodeURIComponent).join('/')}`;

export const findArticle = (articleKey: string | undefined) => {
  const decodedKey = decodeURIComponent(articleKey ?? '').replace(/^\/+|\/+$/g, '');
  const numericId = Number(decodedKey);

  if (Number.isInteger(numericId) && decodedKey !== '') {
    return articles.find((article) => article.id === numericId);
  }

  return articles.find((article) => article.slug === decodedKey);
};
