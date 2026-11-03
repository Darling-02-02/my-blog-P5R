import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseCategoryDocument } from '../src/lib/category-content.ts';
import { findLocalImageProblems } from '../src/lib/article-images.ts';
import { parseMyselfDocument } from '../src/lib/myself-content.ts';
import { parsePhotoDocument } from '../src/lib/photo-content.ts';
import { parseNotesDocument } from '../src/lib/notes-content.ts';

const root = process.cwd();
const articlesRoot = path.join(root, 'src', 'content', 'articles');
const publicRoot = path.join(root, 'public');
// tags 可选（空标签是合法文章），所以不列在这里；下面只检查它"是列表"而不是单个字符串。
const requiredFields = ['id', 'title', 'excerpt', 'category', 'date', 'readTime'];
const categoriesFile = path.join(root, 'src', 'content', 'categories.json');
const myselfFile = path.join(root, 'src', 'content', 'myself.json');
const photosFile = path.join(root, 'src', 'content', 'photos.json');
const notesFile = path.join(root, 'src', 'content', 'notes.json');

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

// 个人简介配置同样是"后台能改的数据"：它坏了 /myself 那段文案就不对，
// 所以在构建期拦住（CI 里在 npm run build 之前跑这个脚本）。
try {
  parseMyselfDocument(readFileSync(myselfFile, 'utf8'));
} catch (error) {
  fail(`src/content/myself.json: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// 照片清单：解析之外还要确认本地图真的在 public/ 里存在。
// 少一张照片不会白屏（src/data/photos.ts 会回退空清单），但会变成一张占位卡，
// 那种"静默少一张"在部署后很难发现，所以在构建期直接拦。
try {
  const photos = parsePhotoDocument(readFileSync(photosFile, 'utf8'));
  for (const photo of photos) {
    if (!photo.src.startsWith('/')) continue;
    const filePath = path.join(publicRoot, photo.src);
    if (!statSync(filePath, { throwIfNoEntry: false })) {
      fail(`src/content/photos.json: 照片「${photo.title}」指向的 public${photo.src} 不存在`);
    }
  }
} catch (error) {
  fail(`src/content/photos.json: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

// 碎碎念：允许空（这块本来就是空的），只校验结构。
// 空内容不报错，但写成数组/写错字段名这种"看起来没坏、实际不显示"的情况要在构建期拦住。
try {
  parseNotesDocument(readFileSync(notesFile, 'utf8'));
} catch (error) {
  fail(`src/content/notes.json: ${error instanceof Error ? error.message : String(error)}`);
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

    // 正文里的本地图片：相对路径在 /article/<分类>/<slug> 下一定解析错，public 里没有的文件也不会凭空出现。
    // 2026-10-12 的 datadownload.md 三张图就是这么等到上线才发现全 404 的。
    const imageProblems = findLocalImageProblems(
      body,
      (pathUnderPublic) => statSync(path.join(publicRoot, pathUnderPublic), { throwIfNoEntry: false })?.isFile() === true,
    );
    for (const problem of imageProblems) {
      fail(
        problem.reason === 'relative'
          ? `${relativePath}: 图片 "${problem.src}" 是相对路径，文章页在 /article/<分类>/<slug> 下会解析错；请把图放进 public/ 并用 / 开头的路径引用（例如 /images/${category}/xxx.png）`
          : `${relativePath}: 图片 "${problem.src}" 在 public/ 下没有这个文件（图片没跟着文章一起进仓库？）`,
      );
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
