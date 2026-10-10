import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseCategoryDocument } from '../src/lib/category-content.ts';

const root = process.cwd();
const articlesRoot = path.join(root, 'src', 'content', 'articles');
// tags 可选（空标签是合法文章），所以不列在这里；下面只检查它"是列表"而不是单个字符串。
const requiredFields = ['id', 'title', 'excerpt', 'category', 'date', 'readTime'];
const categoriesFile = path.join(root, 'src', 'content', 'categories.json');

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

// 栏目表是数据（后台 /admin 可以增删），校验它比什么都重要：这张表坏了首页就整个空掉。
try {
  parseCategoryDocument(readFileSync(categoriesFile, 'utf8'));
} catch (error) {
  fail(`src/content/categories.json: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const walkMarkdown = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(fullPath);
    if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath];
    return [];
  });
};

const parseFrontmatter = (source, filePath) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    fail(`${filePath}: missing frontmatter block`);
    return { meta: {}, body: source };
  }

  const meta = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    if (rawValue) {
      meta[key] = rawValue.replace(/^['"]|['"]$/g, '');
      continue;
    }

    const values = [];
    while (lines[index + 1]?.startsWith('  - ')) {
      index += 1;
      values.push(lines[index].slice(4).trim().replace(/^['"]|['"]$/g, ''));
    }
    meta[key] = values;
  }

  return { meta, body: match[2] };
};

const requireFields = (meta, fields, label) => {
  for (const field of fields) {
    if (meta[field] === undefined || meta[field] === '') {
      fail(`${label}: missing required field "${field}"`);
    }
  }
};

let articleCount = 0;

if (statSync(articlesRoot, { throwIfNoEntry: false })?.isDirectory()) {
  const files = walkMarkdown(articlesRoot);
  const ids = new Set();
  const slugs = new Set();

  for (const filePath of files) {
    const relativePath = path.relative(articlesRoot, filePath).replace(/\\/g, '/');
    const slug = relativePath.replace(/\.md$/, '');
    const source = readFileSync(filePath, 'utf8');
    const { meta, body } = parseFrontmatter(source, relativePath);

    requireFields(meta, requiredFields, relativePath);

    if (meta.tags !== undefined && !Array.isArray(meta.tags)) {
      fail(`${relativePath}: "tags" must be a list`);
    }

    // Columns are free-form, so only require that the name can also be a folder.
    const category = String(meta.category).trim();
    if (!category || /[\\/:*?"<>|]/.test(category)) {
      fail(`${relativePath}: category "${meta.category}" cannot be used as a folder name`);
    }

    if (!body.trim()) {
      fail(`${relativePath}: article body is empty`);
    }

    if (ids.has(String(meta.id))) {
      fail(`${relativePath}: duplicate article id "${meta.id}"`);
    }
    ids.add(String(meta.id));

    if (slugs.has(slug)) {
      fail(`${relativePath}: duplicate slug "${slug}"`);
    }
    slugs.add(slug);
  }

  articleCount = files.length;
}

if (!process.exitCode) {
  console.log(`Validated ${articleCount} markdown article(s).`);
}
