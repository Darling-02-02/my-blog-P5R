// 后台"专题换栏目"的请求检查。
//
// moveTopic 一次 Git 提交里同时做两件事：在新路径加一份、把老路径删掉（sha: null）。
// 这里断言真正发出去的那个 tree body：新路径有没有、老路径有没有被删、
// 有没有复用手里的 blob sha（不重新上传内容）、以及目标栏目撞名时是不是干脆什么都不写。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = mkdtempSync(path.join(root, 'node_modules', '.topic-move-check-'));
const entry = path.join(workDir, 'entry.ts');
const outfile = path.join(workDir, 'bundle.mjs');
writeFileSync(entry, "export { topicPublisher } from '../../src/lib/topic-publisher';\n");

await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  // yaml 是 CJS，打进 ESM 会变成不支持的 dynamic require；让 Node 自己按包解析它。
  external: ['yaml'],
  define: { 'import.meta.env.VITE_ARTICLE_SOURCE': '"static"', 'import.meta.env.VITE_API_BASE_URL': '""' },
  plugins: [{
    name: 'stub-category-source',
    setup(build) {
      build.onResolve({ filter: /data[\\/]category-source$/ }, () => ({ path: 'category-source-stub', namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const topicDirectories = {};\n', loader: 'ts' }));
    },
  }],
  logLevel: 'error',
});

const { topicPublisher } = await import(pathToFileURL(outfile).href);

const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
const directories = { 后端: 'backend', 机器学习: 'machine-learning' };
const topic = [
  { path: 'src/content/topics/backend/demo/topic.md', type: 'blob', sha: 'blob-topic' },
  { path: 'src/content/topics/backend/demo/sections/a.md', type: 'blob', sha: 'blob-a' },
  { path: 'src/content/topics/backend/demo/sections/b.md', type: 'blob', sha: 'blob-b' },
];
const neighbour = { path: 'src/content/topics/backend/other/topic.md', type: 'blob', sha: 'blob-other' };

let calls = [];
let treeResponse = { tree: [...topic, neighbour] };

globalThis.fetch = async (url, init = {}) => {
  const target = String(url);
  const method = (init.method ?? 'GET').toUpperCase();
  calls.push({
    method,
    raw: target,
    // GET 会带一次性的 t= 缓存穿透参数，断言里只看路径本身。
    url: target.replace('https://api.github.com', '').replace(/[?&]t=\d+$/, ''),
    body: init.body ? JSON.parse(init.body) : undefined,
  });
  if (target.includes('/git/trees/main')) return json(treeResponse);
  if (target.includes('/git/ref/heads/main')) return json({ object: { sha: 'commit-1' } });
  if (target.includes('/git/commits/commit-1')) return json({ tree: { sha: 'tree-1' } });
  if (target.endsWith('/git/trees')) return json({ sha: 'tree-2' });
  if (target.endsWith('/git/commits')) return json({ sha: 'commit-2' });
  if (target.includes('/git/refs/heads/main')) return json({ object: { sha: 'commit-2' } });
  return json({});
};

const written = () => calls.filter((call) => call.method !== 'GET');

test('moveTopic 用一次提交把老路径删掉、在新栏目下加回来', async () => {
  calls = [];
  treeResponse = { tree: [...topic, neighbour] };
  await topicPublisher.moveTopic('token', '后端', 'demo', '机器学习', directories);

  assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), [
    'GET /repos/Darling-02-02/my-blog-P5R/git/trees/main?recursive=1',
    'GET /repos/Darling-02-02/my-blog-P5R/git/ref/heads/main',
    'GET /repos/Darling-02-02/my-blog-P5R/git/commits/commit-1',
    'POST /repos/Darling-02-02/my-blog-P5R/git/trees',
    'POST /repos/Darling-02-02/my-blog-P5R/git/commits',
    'PATCH /repos/Darling-02-02/my-blog-P5R/git/refs/heads/main',
  ]);

  assert.ok(
    calls.filter((call) => call.method === 'GET').every((call) => /[?&]t=\d+$/.test(call.raw)),
    'GET 要带 t= 缓存穿透参数，否则 60 秒内会把仓库旧内容读回来',
  );

  const tree = calls[3].body;
  assert.equal(tree.base_tree, 'tree-1');
  const added = tree.tree.filter((entry) => entry.sha !== null).map((entry) => entry.path).sort();
  const removed = tree.tree.filter((entry) => entry.sha === null).map((entry) => entry.path).sort();
  assert.deepEqual(added, [
    'src/content/topics/machine-learning/demo/sections/a.md',
    'src/content/topics/machine-learning/demo/sections/b.md',
    'src/content/topics/machine-learning/demo/topic.md',
  ]);
  assert.deepEqual(removed, [
    'src/content/topics/backend/demo/sections/a.md',
    'src/content/topics/backend/demo/sections/b.md',
    'src/content/topics/backend/demo/topic.md',
  ]);
  // 新路径复用手里的 blob sha（内容不重新上传），更不能顺手把邻居专题删掉。
  assert.deepEqual(tree.tree.filter((entry) => entry.sha !== null).map((entry) => entry.sha).sort(), ['blob-a', 'blob-b', 'blob-topic']);
  assert.ok(!tree.tree.some((entry) => entry.path.includes('/other/')));

  assert.equal(calls[4].body.tree, 'tree-2');
  assert.deepEqual(calls[4].body.parents, ['commit-1']);
  assert.match(calls[4].body.message, /移动专题：demo → 机器学习/);
  assert.deepEqual(calls[5].body, { sha: 'commit-2', force: false });
});

test('目标栏目已经有同名专题时直接拦住，不写任何东西', async () => {
  calls = [];
  treeResponse = { tree: [...topic, { path: 'src/content/topics/machine-learning/demo/topic.md', type: 'blob', sha: 'blob-clash' }] };
  await assert.rejects(() => topicPublisher.moveTopic('token', '后端', 'demo', '机器学习', directories), /已经有同名专题/);
  assert.equal(written().length, 0);
});

test('专题不存在时报错，不写任何东西', async () => {
  calls = [];
  treeResponse = { tree: [neighbour] };
  await assert.rejects(() => topicPublisher.moveTopic('token', '后端', 'demo', '机器学习', directories), /专题未找到/);
  assert.equal(written().length, 0);
});

test('搬到同一个栏目是无效操作，连请求都不发', async () => {
  calls = [];
  await assert.rejects(() => topicPublisher.moveTopic('token', '后端', 'demo', '后端', directories), /已经在这个栏目里/);
  assert.equal(calls.length, 0);
});

process.on('exit', () => rmSync(workDir, { recursive: true, force: true }));
