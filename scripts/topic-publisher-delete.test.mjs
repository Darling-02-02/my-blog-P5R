// 后台"删除专题 / 删除章节"的请求序列检查。
//
// topic-publisher 依赖 Vite 的 import.meta.glob（栏目目录表）和真实 GitHub API，
// 所以这里用 esbuild 把模块打出来（把栏目表 stub 掉），再把 globalThis.fetch 换成假的，
// 断言真正发出去的请求：删哪些文件、按什么顺序、带没带 sha。
//
// 顺序是有意义的：先删章节、最后删 topic.md，中途失败时仓库里不会只剩没有专题的孤儿 sections
// （validate:content 要求每个专题目录都有 sections/ 且至少一节）。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = mkdtempSync(path.join(root, 'node_modules', '.topic-delete-check-'));
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
const tree = (paths) => ({ tree: paths.map((p) => ({ path: p, type: 'blob' })) });
const directories = { 后端: 'backend' };
const topicPaths = [
  'src/content/topics/backend/demo/topic.md',
  'src/content/topics/backend/demo/sections/b.md',
  'src/content/topics/backend/demo/sections/a.md',
  'src/content/topics/backend/demo/notes/readme.md',
  'src/content/topics/backend/other/topic.md',
];

let calls = [];
let treeResponse = tree(topicPaths);

globalThis.fetch = async (url, init = {}) => {
  const method = init.method ?? 'GET';
  const body = init.body ? JSON.parse(init.body) : undefined;
  calls.push({ path: decodeURIComponent(new URL(String(url)).pathname.split('/contents/')[1] ?? ''), method, body });
  if (method === 'DELETE') return json({});
  if (String(url).includes('/git/trees/')) return json(treeResponse);
  return json({ path: 'x', sha: 'sha-1', content: '' });
};

test('removeTopic deletes every file of the topic, sections before topic.md', async () => {
  calls = [];
  treeResponse = tree(topicPaths);
  await topicPublisher.removeTopic('token', '后端', 'demo', directories);
  const deleted = calls.filter((call) => call.method === 'DELETE');
  const paths = deleted.map((call) => call.path);
  // sections/ 和 notes/ 的顺序不重要（沿用 git tree 的顺序），要紧的是 topic.md 必须最后删。
  assert.equal(paths.at(-1), 'src/content/topics/backend/demo/topic.md');
  assert.deepEqual([...paths].sort(), [
    'src/content/topics/backend/demo/notes/readme.md',
    'src/content/topics/backend/demo/sections/a.md',
    'src/content/topics/backend/demo/sections/b.md',
    'src/content/topics/backend/demo/topic.md',
  ]);
  assert.ok(deleted.every((call) => call.body.sha === 'sha-1' && call.body.branch === 'main'));
  assert.ok(deleted.every((call) => call.body.message.startsWith('删除专题：demo')));
  // 别的专题一个文件都不许碰。
  assert.ok(!paths.some((item) => item.includes('/other/')));
});

test('removeSection deletes exactly one section file', async () => {
  calls = [];
  await topicPublisher.removeSection('token', '后端', 'demo', 'a', directories);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ['GET', 'src/content/topics/backend/demo/sections/a.md'],
    ['DELETE', 'src/content/topics/backend/demo/sections/a.md'],
  ]);
  assert.match(calls[1].body.message, /删除章节：a/);
});

test('removeTopic reports a missing topic instead of silently doing nothing', async () => {
  calls = [];
  treeResponse = tree(['src/content/topics/backend/other/topic.md']);
  await assert.rejects(() => topicPublisher.removeTopic('token', '后端', 'demo', directories), /专题未找到/);
  assert.equal(calls.filter((call) => call.method === 'DELETE').length, 0);
});

process.on('exit', () => rmSync(workDir, { recursive: true, force: true }));
