// functions/api/stats.ts 的最小回归测试：计数逻辑（访客数只算首访）+ 没绑定时的 503。
// 用假的 KV（Map）驱动，不打网络、不需要 wrangler。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/stats.ts';

const fakeKv = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => void store.set(key, value),
  };
};

const post = (firstVisit, env) =>
  onRequestPost({
    request: new Request(`https://blog.test/api/stats?firstVisit=${firstVisit}`, { method: 'POST' }),
    env,
  });

test('没绑定 BLOG_STATS 时返回 503', async () => {
  const res = await post('1', {});
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('首次访问：访问量 +1、访客数 +1，并且写回 KV', async () => {
  const kv = fakeKv();
  const res = await post('1', { BLOG_STATS: kv });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { pv: 1, uv: 1 });
  assert.equal(kv.store.get('pv'), '1');
  assert.equal(kv.store.get('uv'), '1');
});

test('同一浏览器再来一次：访问量 +1、访客数不动', async () => {
  const kv = fakeKv({ pv: '7', uv: '3' });
  assert.deepEqual(await (await post('0', { BLOG_STATS: kv })).json(), { pv: 8, uv: 3 });
  assert.equal(kv.store.get('uv'), '3');
});

test('KV 里是脏数据时不产生 NaN', async () => {
  const kv = fakeKv({ pv: 'abc', uv: '-5' });
  assert.deepEqual(await (await post('1', { BLOG_STATS: kv })).json(), { pv: 1, uv: 1 });
});
