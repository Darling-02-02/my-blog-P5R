// Admin publishing: commits article Markdown straight to the repository with a
// fine-grained GitHub token. GitHub Actions then rebuilds the static site, so the
// blog needs no server and no public API.
import type { Article } from '../../backend/src/articles/article.types';
import type { ArticleWriteInput } from './article-form';
import { ArticleApiError } from './api';
import { parseArticleSource, serializeArticle } from './frontmatter';

const OWNER = 'Darling-02-02';
const REPO = 'my-blog-P5R';
const BRANCH = 'main';
const ARTICLES_DIR = 'src/content/articles';

interface TreeEntry {
  path: string;
  type: string;
}

interface ContentFile {
  path: string;
  sha: string;
  content: string;
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

// Blobs come back base64-encoded; encode/decode through UTF-8 so Chinese text survives.
export const encodeBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export const decodeBase64 = (value: string) => {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const errorCodeFor = (status: number) => {
  if (status === 401) return 'BAD_TOKEN';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'GITHUB_ERROR';
};

// GitHub 的读接口（contents、git/trees…）响应带 `Cache-Control: public, max-age=60`，浏览器在这 60 秒里
// 会直接吃缓存不再问服务器：后台刚删掉的栏目，紧接着的「重新读取」会把旧内容读回来，看着像没删掉
// （前台用的是构建期数据，所以那边已经生效了）。给每个 GET 拼一个一次性参数让缓存永远打不中——
// 只有 GET，写请求（PUT/POST/PATCH/DELETE）不动，读页面、读 sha 也就都是仓库当前的样子。
const cacheBuster = (path: string) => `${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`;

export const request = async <T>(token: string, path: string, init: RequestInit = {}): Promise<T | undefined> => {
  const target = (init.method ?? 'GET').toUpperCase() === 'GET' ? cacheBuster(path) : path;

  // 连不上的时候浏览器只会抛一句 "Failed to fetch"（DNS 被污染、被防火墙挂住、需要代理都会这样），
  // 后台把它原样显示出来等于没说：用户看不出是哪台机器、哪一步的问题。这里换成能照着做的提示。
  let response: Response;
  try {
    response = await fetch(`https://api.github.com${target}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new ArticleApiError(
      0,
      'GITHUB_UNREACHABLE',
      '连不上 api.github.com：这台机器的网络或 DNS 把它挡住了（也可能需要代理/VPN）。换条网络或用代理后再试。',
    );
  }

  if (response.status === 404) return undefined;

  const payload = (await response.json().catch(() => null)) as { message?: string } | null;

  if (!response.ok) {
    throw new ArticleApiError(
      response.status,
      errorCodeFor(response.status),
      payload?.message ?? `GitHub 请求失败（${response.status}）`,
    );
  }

  return payload as T;
};

export const contentsUrl = (path: string) => `/repos/${OWNER}/${REPO}/contents/${encodePath(path)}`;

export const getFile = async (token: string, path: string): Promise<ContentFile | undefined> => {
  const file = await request<{ path: string; sha: string; content?: string }>(
    token,
    `${contentsUrl(path)}?ref=${BRANCH}`,
  );

  if (!file || typeof file.content !== 'string') return undefined;
  return { path: file.path, sha: file.sha, content: file.content };
};

const listArticlePaths = async (token: string) => {
  const tree = await request<{ tree?: TreeEntry[] }>(
    token,
    `/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`,
  );

  return (tree?.tree ?? [])
    .filter((entry) => entry.type === 'blob' && entry.path.startsWith(`${ARTICLES_DIR}/`) && entry.path.endsWith('.md'))
    .map((entry) => entry.path);
};

const toArticle = (path: string, content: string): Article => {
  const { meta, body } = parseArticleSource(content, path);

  return {
    id: Number(meta.id),
    slug: path.slice(ARTICLES_DIR.length + 1, -'.md'.length),
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
};

// A category is both the frontmatter value and the folder name, so strip
// characters that cannot appear in a path.
const toFolder = (category: string) => category.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();

const toPath = (category: string, slug: string) => `${ARTICLES_DIR}/${toFolder(category)}/${slug}.md`;
const toPathFromSlug = (slug: string) => `${ARTICLES_DIR}/${slug}.md`;

const list = async (token: string): Promise<Article[]> => {
  const paths = await listArticlePaths(token);
  const files = await Promise.all(paths.map((path) => getFile(token, path)));

  return files
    .filter((file): file is ContentFile => Boolean(file))
    .map((file) => toArticle(file.path, decodeBase64(file.content)))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);
};

export const articlePublisher = {
  list,

  save: async (token: string, input: ArticleWriteInput, previousSlug?: string): Promise<void> => {
    const nextPath = toPath(input.category, input.slug);
    const previous = previousSlug ? await getFile(token, toPathFromSlug(previousSlug)) : undefined;
    const previousArticle = previous ? toArticle(previous.path, decodeBase64(previous.content)) : undefined;

    const sha = previousArticle && previous && previous.path === nextPath ? previous.sha : undefined;

    if (!sha && (await getFile(token, nextPath))) {
      throw new ArticleApiError(409, 'SLUG_EXISTS', '这个栏目下已经有同名 Slug 的文章了，换一个吧');
    }

    const id = previousArticle?.id ?? Math.max(0, ...(await list(token)).map((item) => item.id)) + 1;
    const date = previousArticle?.date ?? new Date().toISOString().slice(0, 10);

    const text = serializeArticle({
      id,
      date,
      title: input.title,
      excerpt: input.excerpt,
      category: input.category,
      subcategory: input.subcategory,
      tags: input.tags,
      coverUrl: input.coverUrl,
      body: input.content,
    });

    await request(token, contentsUrl(nextPath), {
      method: 'PUT',
      body: JSON.stringify({
        message: `${previousArticle ? '更新' : '发布'}文章：${input.title}`,
        content: encodeBase64(text),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (previousArticle && previous && previous.path !== nextPath) {
      await request(token, contentsUrl(previous.path), {
        method: 'DELETE',
        body: JSON.stringify({ message: `调整栏目：${input.title}`, sha: previous.sha, branch: BRANCH }),
      });
    }
  },

  remove: async (token: string, slug: string): Promise<void> => {
    const path = toPathFromSlug(slug);
    const file = await getFile(token, path);

    if (!file) throw new ArticleApiError(404, 'NOT_FOUND', '找不到这篇文章，可能已经被删除了');

    await request(token, contentsUrl(path), {
      method: 'DELETE',
      body: JSON.stringify({ message: `删除文章：${slug}`, sha: file.sha, branch: BRANCH }),
    });
  },
};
