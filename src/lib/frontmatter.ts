// Article frontmatter format: parsing lives here so the build-time loader
// (src/data/articles.ts) and the admin publisher (src/lib/github.ts) agree on one format.

export type FrontmatterValue = string | string[];
export type Frontmatter = Record<string, FrontmatterValue>;

const requiredFields = ['id', 'title', 'excerpt', 'category', 'date', 'readTime', 'tags'] as const;

const stripQuotes = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

export interface ParsedArticleSource {
  meta: Frontmatter;
  body: string;
}

export const parseArticleSource = (source: string, label: string): ParsedArticleSource => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`Article is missing frontmatter: ${label}`);
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
      throw new Error(`Article is missing "${field}": ${label}`);
    }
  }

  if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
    throw new Error(`Article tags must be a list: ${label}`);
  }

  const id = Number(meta.id);
  if (!Number.isInteger(id)) {
    throw new Error(`Article id must be an integer: ${label}`);
  }

  return { meta, body: match[2].trim() };
};

export interface ArticleFrontmatterInput {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  date: string;
  readTime: string;
  tags: string[];
  coverUrl?: string;
  body: string;
}

// Single-line values are always quoted: the parser strips one leading/trailing
// quote, so values that themselves contain quotes survive a round trip.
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
const quoted = (value: string) => `"${singleLine(value)}"`;

export const serializeArticle = (input: ArticleFrontmatterInput) => {
  const lines = [
    '---',
    `id: ${input.id}`,
    `title: ${quoted(input.title)}`,
    `excerpt: ${quoted(input.excerpt)}`,
    `category: ${quoted(input.category)}`,
  ];

  if (singleLine(input.subcategory ?? '')) {
    lines.push(`subcategory: ${quoted(input.subcategory ?? '')}`);
  }

  lines.push(`date: ${quoted(input.date)}`, `readTime: ${quoted(input.readTime)}`, 'tags:');

  const tags = [...new Set(input.tags.map(singleLine).filter(Boolean))];
  for (const tag of tags) {
    lines.push(`  - ${quoted(tag)}`);
  }

  if (singleLine(input.coverUrl ?? '')) {
    lines.push(`coverUrl: ${quoted(input.coverUrl ?? '')}`);
  }

  lines.push('---', '', input.body.trim(), '');
  return lines.join('\n');
};
