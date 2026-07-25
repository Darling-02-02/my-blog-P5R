import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRoot = path.join(root, 'src', 'content', 'articles');
const requiredFields = ['id', 'title', 'excerpt', 'category', 'date', 'readTime', 'tags'];
const taxonomy = new Map([
  [
    '生物信息',
    ['转录组', '代谢组', '蛋白组', '网络药理学', 'lncRNA', 'ScRNA-seq', '线粒体', '比较基因组', 'meta分析'],
  ],
  ['三维重建', ['单帧作物点云数据处理流程', 'MVS(多视角重建)', '开源算法总结和使用']],
  ['机器学习', []],
  ['随笔', []],
]);

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

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

if (!statSync(contentRoot, { throwIfNoEntry: false })?.isDirectory()) {
  fail(`Missing content directory: ${path.relative(root, contentRoot)}`);
  process.exit();
}

const files = walkMarkdown(contentRoot);
if (!files.length) {
  fail('No markdown articles found under src/content/articles');
  process.exit();
}

const ids = new Set();
const slugs = new Set();

for (const filePath of files) {
  const relativePath = path.relative(contentRoot, filePath).replace(/\\/g, '/');
  const slug = relativePath.replace(/\.md$/, '');
  const source = readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(source, relativePath);

  for (const field of requiredFields) {
    if (meta[field] === undefined || meta[field] === '') {
      fail(`${relativePath}: missing required field "${field}"`);
    }
  }

  if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
    fail(`${relativePath}: "tags" must contain at least one item`);
  }

  if (!taxonomy.has(String(meta.category))) {
    fail(`${relativePath}: unknown category "${meta.category}"`);
  }

  if (meta.subcategory) {
    const subcategories = taxonomy.get(String(meta.category)) ?? [];
    if (!subcategories.includes(String(meta.subcategory))) {
      fail(`${relativePath}: subcategory "${meta.subcategory}" is not valid for category "${meta.category}"`);
    }
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

if (!process.exitCode) {
  console.log(`Validated ${files.length} markdown article(s).`);
}
