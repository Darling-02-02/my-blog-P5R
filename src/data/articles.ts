export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

type FrontmatterValue = string | string[];
type Frontmatter = Record<string, FrontmatterValue>;

const articleModules = import.meta.glob('../content/articles/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const requiredFields = ['id', 'title', 'excerpt', 'category', 'date', 'readTime', 'tags'] as const;

const stripQuotes = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const slugFromPath = (path: string) =>
  path
    .replace('../content/articles/', '')
    .replace(/\.md$/, '')
    .replace(/\\/g, '/');

const parseFrontmatter = (source: string, path: string) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`Article is missing frontmatter: ${path}`);
  }

  const meta: Frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);

    if (!pair) continue;

    const [, key, rawValue] = pair;

    if (rawValue) {
      meta[key] = stripQuotes(rawValue);
      continue;
    }

    const values: string[] = [];
    while (lines[index + 1]?.startsWith('  - ')) {
      index += 1;
      values.push(stripQuotes(lines[index].slice(4)));
    }
    meta[key] = values;
  }

  for (const field of requiredFields) {
    if (!meta[field]) {
      throw new Error(`Article is missing "${field}": ${path}`);
    }
  }

  if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
    throw new Error(`Article tags must be a list: ${path}`);
  }

  const id = Number(meta.id);
  if (!Number.isInteger(id)) {
    throw new Error(`Article id must be an integer: ${path}`);
  }

  return {
    meta,
    body: match[2].trim(),
  };
};

export const articles: Article[] = Object.entries(articleModules)
  .map(([path, source]) => {
    const { meta, body } = parseFrontmatter(source, path);

    return {
      id: Number(meta.id),
      slug: slugFromPath(path),
      title: String(meta.title),
      excerpt: String(meta.excerpt),
      category: String(meta.category),
      date: String(meta.date),
      readTime: String(meta.readTime),
      tags: meta.tags as string[],
      content: body,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);

export const getArticlePath = (article: Pick<Article, 'slug'>) => `/article/${article.slug}`;

export const findArticle = (articleKey: string | undefined) => {
  const decodedKey = decodeURIComponent(articleKey ?? '').replace(/^\/+|\/+$/g, '');
  const numericId = Number(decodedKey);

  if (Number.isInteger(numericId)) {
    return articles.find((article) => article.id === numericId);
  }

  return articles.find((article) => article.slug === decodedKey);
};
