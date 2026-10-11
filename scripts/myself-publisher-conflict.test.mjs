// 个人简介配置的并发冲突检查：写回整份 myself.json 时 sha 对不上（409/422）会怎样。
//
// 与 category-publisher-conflict.test.mjs 同一套路（esbuild 打包 + 打桩 fetch），
// 因为这条路径的失败模式是一样的：把冲突拍成普通 Error 就丢了 status/code，
// 界面分不出"另一个窗口改过"和"真失败"，用户只能一直点、一直失败。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workDir = mkdtempSync(path.join(root, 'node_modules', '.myself-conflict-check-'));
const entry = path.join(workDir, 'entry.ts');
const outfile = path.join(workDir, 'bundle.mjs');
writeFileSync(
  entry,
  "export { myselfPublisher, isProfileConflict } from '../../src/lib/myself-publisher';\n" +
    "export { parseMyselfDocument, serializeMyselfDocument } from '../../src/lib/myself-content';\n",
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

const { myselfPublisher, isProfileConflict, parseMyselfDocument, serializeMyselfDocument } = await import(
  pathToFileURL(outfile).href
);

const MYSELF_PATH = '/repos/Darling-02-02/my-blog-P5R/contents/src/content/myself.json';
const document = { mystic: 'Ciallo～(∠・ω< )⌒★' };

let calls = [];
let putStatus = 200;

globalThis.fetch = async (url, init = {}) => {
  const method = init.method ?? 'GET';
  calls.push({ url: String(url), method, body: init.body ? JSON.parse(init.body) : undefined });
  if (method === 'GET') {
    const content = Buffer.from(serializeMyselfDocument(document), 'utf8').toString('base64');
    return new Response(JSON.stringify({ path: 'src/content/myself.json', sha: 'sha-old', content }), {
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

// assert.rejects 只给出 undefined，拿不到错误对象本身；这里手动接住。
const saveFailure = async (sha) => {
  try {
    await myselfPublisher.save('token', document, sha, '更新个人简介：神秘力量文案');
  } catch (error) {
    return error;
  }
  throw new Error('save 本该失败，却成功了');
};

test('load reads the live document and hands back the sha it was read at', async () => {
  calls = [];
  const snapshot = await myselfPublisher.load('token');
  assert.equal(calls[0].url.replace(/[?&]t=\d+$/, ''), `https://api.github.com${MYSELF_PATH}?ref=main`);
  assert.match(calls[0].url, /[?&]t=\d+$/, '读配置要带 t= 缓存穿透参数，否则 60 秒内会把旧文案读回来');
  assert.equal(snapshot.sha, 'sha-old');
  assert.deepEqual(snapshot.content, document);
});

test('save writes the whole document back with the read-time sha and branch main', async () => {
  calls = [];
  putStatus = 200;
  await myselfPublisher.save('token', { mystic: '改过的文案' }, 'sha-old', '更新个人简介：神秘力量文案');
  const put = calls.find((call) => call.method === 'PUT');
  assert.equal(put.body.sha, 'sha-old');
  assert.equal(put.body.branch, 'main');
  assert.match(put.body.message, /个人简介/);
  // 中文必须活着：内容要是 UTF-8 的 base64，不是被截断的字节。
  assert.equal(Buffer.from(put.body.content, 'base64').toString('utf8'), serializeMyselfDocument({ mystic: '改过的文案' }));
  assert.deepEqual(parseMyselfDocument(Buffer.from(put.body.content, 'base64').toString('utf8')), { mystic: '改过的文案' });
});

test('409 and 422 are reported as a conflict, keeping the status', async () => {
  for (const status of [409, 422]) {
    calls = [];
    putStatus = status;
    const error = await saveFailure('sha-stale');
    assert.equal(error.code, 'PROFILE_CONFLICT');
    assert.equal(error.status, status);
    assert.equal(isProfileConflict(error), true);
    // GitHub 的英文原文不能漏出去；这句是可读的中文。
    assert.match(error.message, /已经被改过/);
    assert.doesNotMatch(error.message, /does not match/);
  }
});

test('other failures stay ordinary errors instead of being blamed on another window', async () => {
  calls = [];
  putStatus = 500;
  const error = await saveFailure('sha-old');
  assert.equal(isProfileConflict(error), false);
  assert.equal(error.status, 500);
});

test('isProfileConflict ignores anything that is not a publisher conflict', () => {
  assert.equal(isProfileConflict(new Error('boom')), false);
  assert.equal(isProfileConflict(undefined), false);
});

test('a dead network is reported as unreachable instead of the raw English "Failed to fetch"', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    let error;
    try {
      await myselfPublisher.load('token');
    } catch (caught) {
      error = caught;
    }
    assert.ok(error, 'load 本该失败，却成功了');
    assert.equal(error.status, 0);
    assert.equal(error.code, 'GITHUB_UNREACHABLE');
    assert.match(error.message, /api\.github\.com/);
    assert.doesNotMatch(error.message, /Failed to fetch/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

process.on('exit', () => rmSync(workDir, { recursive: true, force: true }));
