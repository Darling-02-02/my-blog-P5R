import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseArticleCount, parseLatestCommitDate } from '../src/lib/repo-stats.ts';

const treeOf = (entries) => ({ tree: entries });

test('只数 src/content/articles 下的 markdown（含子目录）', () => {
  const payload = treeOf([
    { path: 'src/content/articles/hello.md', type: 'blob' },
    { path: 'src/content/articles/2025/nested.md', type: 'blob' },
    { path: 'src/content/articles', type: 'tree' },
    { path: 'src/content/articles/cover.png', type: 'blob' },
    { path: 'src/content/topics/bio/topic.md', type: 'blob' },
    { path: 'src/data/articles.ts', type: 'blob' },
    // 目录名以 .md 结尾也必须按类型排除掉
    { path: 'src/content/articles/fake.md', type: 'tree' },
  ]);

  assert.equal(parseArticleCount(payload), 2);
  assert.equal(parseArticleCount(treeOf([])), 0);
});

test('拿到不认识的响应就返回 null，好让调用方留着构建期的数字', () => {
  assert.equal(parseArticleCount(null), null);
  assert.equal(parseArticleCount({}), null);
  assert.equal(parseArticleCount({ tree: 'oops' }), null);
  assert.equal(parseArticleCount(treeOf([{ type: 'blob' }])), 0);
});

test('取最近一次提交时间，取不到就是 null', () => {
  assert.equal(
    parseLatestCommitDate([{ commit: { committer: { date: '2026-01-02T03:04:05Z' } } }]),
    '2026-01-02T03:04:05Z',
  );
  // 有的提交没有 committer 时间，退到 author
  assert.equal(
    parseLatestCommitDate([{ commit: { author: { date: '2025-12-31T23:59:59Z' } } }]),
    '2025-12-31T23:59:59Z',
  );
  assert.equal(parseLatestCommitDate([]), null);
  assert.equal(parseLatestCommitDate(null), null);
  assert.equal(parseLatestCommitDate([{ commit: {} }]), null);
});
