// 侧栏的「文章数目 / 更新时间」以仓库为准：站点内容是构建期固化的，
// 后台刚提交的那篇文章要等一次重建才会出现在正文里，数字提前跟着仓库走才不显得"没生效"。

const repo = 'Darling-02-02/my-blog-P5R';
// 与 src/data/articles.ts 的 import.meta.glob('../content/articles/**/*.md') 同口径（含子目录）。
const articlePathPattern = /^src\/content\/articles\/.*\.md$/;

interface TreePayload {
  // 条目特别多的仓库会被 GitHub 截断（truncated: true），到那时这个数只少不多。
  tree?: Array<{ path?: string; type?: string }>;
}

interface CommitPayload {
  commit?: {
    committer?: { date?: string };
    author?: { date?: string };
  };
}

export interface RepoStats {
  articleCount: number;
  /** 最近一次改到 src/content/articles 的提交时间（ISO），取不到就是 null */
  updatedAt: string | null;
}

export const parseArticleCount = (payload: unknown): number | null => {
  const tree = (payload as TreePayload | null)?.tree;
  if (!Array.isArray(tree)) return null;

  return tree.filter(
    (entry) => entry?.type === 'blob' && typeof entry.path === 'string' && articlePathPattern.test(entry.path),
  ).length;
};

export const parseLatestCommitDate = (payload: unknown): string | null => {
  if (!Array.isArray(payload)) return null;

  const commit = (payload[0] as CommitPayload | undefined)?.commit;
  const date = commit?.committer?.date ?? commit?.author?.date;
  return typeof date === 'string' && date ? date : null;
};

const fetchJson = async (url: string): Promise<unknown> => {
  // GitHub 的内容接口带 60 秒 Cache-Control，加个时间戳才拿得到刚提交的结果。
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  return response.json();
};

/** 免鉴权读公开仓库（一次两个请求）。限流、断网、改接口都只是返回 null，让调用方留着构建期的数字。 */
export const fetchRepoStats = async (): Promise<RepoStats | null> => {
  try {
    const [tree, commits] = await Promise.all([
      fetchJson(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`),
      fetchJson(`https://api.github.com/repos/${repo}/commits?path=src/content/articles&per_page=1`),
    ]);
    const articleCount = parseArticleCount(tree);
    if (articleCount === null) return null;

    return { articleCount, updatedAt: parseLatestCommitDate(commits) };
  } catch {
    return null;
  }
};
