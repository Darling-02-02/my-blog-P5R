import type Database from 'better-sqlite3';
import type {
  Article,
  ArticleListQuery,
  ArticleListResponse,
  ArticleSummary,
  ArticleWritePayload,
} from './article.types.js';

type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  subcategory: string | null;
  read_time: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ArticleQueryRow = Omit<ArticleRow, 'content'> & { content?: string };

const now = () => new Date().toISOString();

export const createArticleRepository = (db: Database.Database) => {
  const tagRows = db.prepare(`
    SELECT t.name
    FROM tags t
    INNER JOIN article_tags at ON at.tag_id = t.id
    WHERE at.article_id = ?
    ORDER BY t.name COLLATE NOCASE
  `);

  const loadTagsByArticle = (rows: Array<{ id: number }>) => {
    if (!rows.length) return new Map<number, string[]>();

    const placeholders = rows.map(() => '?').join(', ');
    const tagRowsForPage = db.prepare(`
      SELECT at.article_id, t.name
      FROM article_tags at
      INNER JOIN tags t ON t.id = at.tag_id
      WHERE at.article_id IN (${placeholders})
      ORDER BY at.article_id, t.name COLLATE NOCASE
    `).all(...rows.map((row) => row.id)) as Array<{ article_id: number; name: string }>;

    const tagsByArticle = new Map<number, string[]>();
    for (const row of tagRowsForPage) {
      const tags = tagsByArticle.get(row.article_id) ?? [];
      tags.push(row.name);
      tagsByArticle.set(row.article_id, tags);
    }
    return tagsByArticle;
  };

  const mapRow = (row: ArticleQueryRow, tagsByArticle?: Map<number, string[]>): Article => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content ?? '',
    coverUrl: row.cover_url,
    category: row.category,
    subcategory: row.subcategory || undefined,
    date: row.published_at ?? row.created_at,
    readTime: row.read_time,
    tags: tagsByArticle?.get(row.id) ?? (tagRows.all(row.id) as Array<{ name: string }>).map((tag) => tag.name),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const fetchById = db.prepare('SELECT * FROM articles WHERE id = ?');
  const fetchBySlug = db.prepare('SELECT * FROM articles WHERE slug = ? AND status = \'published\'');

  const getById = (id: number) => {
    const row = fetchById.get(id) as ArticleRow | undefined;
    return row ? mapRow(row) : undefined;
  };

  const replaceTags = (articleId: number, tags: string[]) => {
    db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(articleId);
    const findTag = db.prepare('SELECT id FROM tags WHERE name = ?');
    const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');
    const linkTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');

    for (const name of [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]) {
      const existing = findTag.get(name) as { id: number } | undefined;
      const tagId = existing?.id ?? Number(insertTag.run(name).lastInsertRowid);
      linkTag.run(articleId, tagId);
    }
  };

  const toSummary = (article: Article): ArticleSummary => {
    const summary = { ...article } as Partial<Article>;
    delete summary.content;
    return summary as ArticleSummary;
  };

  const listPublished = (query: ArticleListQuery): ArticleListResponse => {
    const filters = ['a.status = \'published\''];
    const params: Array<string | number> = [];

    if (query.category) {
      filters.push('a.category = ?');
      params.push(query.category);
    }

    if (query.tag) {
      filters.push('EXISTS (SELECT 1 FROM article_tags at2 INNER JOIN tags t2 ON t2.id = at2.tag_id WHERE at2.article_id = a.id AND t2.name = ?)');
      params.push(query.tag);
    }

    const where = filters.join(' AND ');
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM articles a WHERE ${where}`).get(...params) as { count: number };
    const rows = db.prepare(`
      SELECT a.id, a.slug, a.title, a.excerpt, a.cover_url, a.category, a.subcategory,
             a.read_time, a.status, a.published_at, a.created_at, a.updated_at
      FROM articles a
      WHERE ${where}
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, query.pageSize, (query.page - 1) * query.pageSize) as ArticleQueryRow[];
    const tagsByArticle = loadTagsByArticle(rows);

    return {
      items: rows.map((row) => mapRow(row, tagsByArticle)).map(toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total: countRow.count,
    };
  };

  const listAll = (): Article[] => {
    const rows = db.prepare('SELECT * FROM articles ORDER BY updated_at DESC, id DESC LIMIT ?').all(200) as ArticleRow[];
    return rows.map((row) => mapRow(row));
  };

  const findPublishedBySlug = (slug: string) => {
    const row = fetchBySlug.get(slug) as ArticleRow | undefined;
    return row ? mapRow(row) : undefined;
  };

  const create = db.transaction((input: ArticleWritePayload) => {
    const createdAt = now();
    const publishedAt = input.status === 'published' ? createdAt : null;
    const result = db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, cover_url, category, subcategory, read_time, status, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.coverUrl,
      input.category,
      input.subcategory || null,
      input.readTime,
      input.status,
      publishedAt,
      createdAt,
      createdAt,
    );
    const id = Number(result.lastInsertRowid);
    replaceTags(id, input.tags);
    return getById(id) as Article;
  });

  const update = db.transaction((id: number, input: ArticleWritePayload) => {
    const existing = getById(id);
    if (!existing) return undefined;

    const updatedAt = now();
    const publishedAt = input.status === 'published' ? existing.publishedAt ?? updatedAt : null;
    const result = db.prepare(`
      UPDATE articles
      SET slug = ?, title = ?, excerpt = ?, content = ?, cover_url = ?, category = ?, subcategory = ?, read_time = ?, status = ?, published_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.slug,
      input.title,
      input.excerpt,
      input.content,
      input.coverUrl,
      input.category,
      input.subcategory || null,
      input.readTime,
      input.status,
      publishedAt,
      updatedAt,
      id,
    );

    if (!result.changes) return undefined;
    replaceTags(id, input.tags);
    return getById(id);
  });

  const remove = (id: number) => db.prepare('DELETE FROM articles WHERE id = ?').run(id).changes > 0;

  const setPublished = (id: number, published: boolean) => {
    const updatedAt = now();
    const publishedAt = published ? updatedAt : null;
    const result = db.prepare(`
      UPDATE articles
      SET status = ?, published_at = ?, updated_at = ?
      WHERE id = ?
    `).run(published ? 'published' : 'draft', publishedAt, updatedAt, id);

    return result.changes ? getById(id) : undefined;
  };

  return {
    listPublished,
    listAll,
    findPublishedBySlug,
    getById,
    create,
    update,
    remove,
    publish: (id: number) => setPublished(id, true),
    unpublish: (id: number) => setPublished(id, false),
  };
};

export type ArticleRepository = ReturnType<typeof createArticleRepository>;
