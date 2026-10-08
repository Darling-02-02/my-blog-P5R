// 栏目的并发冲突检查：写回整份 categories.json 时 sha 对不上（409/422）会怎样。
//
// 这条路径曾经把错误拍成一个普通 Error，status/code 全丢了，界面没法分辨"冲突"和"真失败"，
// 只能干喊"请刷新页面重新读取后再提交"——用户就一直点、一直失败。现在 publisher 保留 status/code，
// 界面靠 isCategoryConflict 认出冲突后自动读回最新表再让用户重试，所以这里把分类断言死：
// 409/422 必须被认成冲突（且原文案不丢），别的状态码不许被误认成冲突。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = mkdtempSync(path.join(root, 'node_modules', '.category-conflict-check-'));
const entry = path.join(workDir, 'entry.ts');
const outfile = path.join(workDir, 'bundle.mjs');
writeFileSync(
  entry,
  "export { categoryPublisher, isCategoryConflict } from '../../src/lib/category-publisher';\n" +
    "export { parseCategoryDocument, serializeCategoryDocument } from '../../src/lib/category-content';\n",
);

await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'node',
  // yaml 是 CJS（github.ts → frontmatter），打进 ESM 会变成不支持的 dynamic require。
  external: ['yaml'],
  define: { 'import.meta.env.VITE_ARTICLE_SOURCE': '"static"', 'import.meta.env.VITE_API_BASE_URL': '""' },
  logLevel: 'error',
});

const { categoryPublisher, isCategoryConflict, parseCategoryDocument, serializeCategoryDocument } = await import(
  pathToFileURL(outfile).href
);

const CATEGORY_PATH = '/repos/Darling-02-02/my-blog-P5R/contents/src/content/categories.json';
const table = [{ name: '后端', description: '服务端笔记', color: '#ff0040' }];

let calls = [];
let putStatus = 200;

globalThis.fetch = async (url, init = {}) => {
  const method = init.method ?? 'GET';
  calls.push({ url: String(url), method, body: init.body ? JSON.parse(init.body) : undefined });
  if (method === 'GET') {
    // 读回来的 content 是 base64 编码的整份表，和 GitHub 给的一致。
    const content = Buffer.from(serializeCategoryDocument(table), 'utf8').toString('base64');
    return new Response(JSON.stringify({ path: 'src/content/categories.json', sha: 'sha-old', content }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (putStatus !== 200) {
    return new Response(JSON.stringify({ message: 'sha does not match' }), {
      status: putStatus,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ content: { sha: 'sha-new' } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

const save = async (sha = 'sha-old') => {
  calls = [];
  putStatus = 200;
  await categoryPublisher.save('token', parseCategoryDocument(serializeCategoryDocument(table)), sha, '删除栏目：后端');
  return calls.find((call) => call.method === 'PUT');
};

// assert.rejects 只给出 undefined，拿不到错误对象本身；这里手动接住。
const saveFailure = async (sha) => {
  try {
    await categoryPublisher.save('token', table, sha, '更新栏目：后端');
  } catch (error) {
    return error;
  }
  throw new Error('save 本该失败，却成功了');
};

test('load reads the live table and hands back the sha it was read at', async () => {
  const snapshot = await categoryPublisher.load('token');
  assert.equal(calls[0].url.replace(/[?&]t=\d+$/, ''), `https://api.github.com${CATEGORY_PATH}?ref=main`);
assert.match(calls[0].url, /[?&]t=\d+$/, '读栏目表要带 t= 缓存穿透参数，否则 60 秒内会把删掉的栏目读回来');
  assert.equal(snapshot.sha, 'sha-old');
  assert.deepEqual(snapshot.categories, table);
});

test('save writes the whole table back with the read-time sha and branch main', async () => {
  const put = await save();
  assert.equal(put.body.sha, 'sha-old');
  assert.equal(put.body.branch, 'main');
  assert.match(put.body.message, /删除栏目：后端/);
  // 内容必须是中文能活下来的 base64，不是被截断的字节。
  assert.equal(Buffer.from(put.body.content, 'base64').toString('utf8'), serializeCategoryDocument(table));
});

test('409 and 422 are reported as a conflict, keeping the status', async () => {
  for (const status of [409, 422]) {
    calls = [];
    putStatus = status;
    const error = await saveFailure('sha-stale');
    assert.equal(error.code, 'CATEGORY_CONFLICT');
    assert.equal(error.status, status);
    assert.equal(isCategoryConflict(error), true);
    // GitHub 的英文原文不能漏出去；这句是可读的中文。
    assert.match(error.message, /已经被改过/);
    assert.doesNotMatch(error.message, /does not match/);
  }
});

test('other failures stay ordinary errors instead of being blamed on another window', async () => {
  calls = [];
  putStatus = 500;
  const error = await saveFailure('sha-old');
  assert.equal(isCategoryConflict(error), false);
  assert.equal(error.status, 500);
});

test('isCategoryConflict ignores anything that is not a publisher conflict', () => {
  assert.equal(isCategoryConflict(new Error('boom')), false);
  assert.equal(isCategoryConflict(undefined), false);
});

process.on('exit', () => rmSync(workDir, { recursive: true, force: true }));
