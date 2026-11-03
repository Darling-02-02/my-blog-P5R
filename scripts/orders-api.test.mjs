// 接单接口的回归测试：内存假 KV + 假 Request，直接 import Pages Function。
// 重点是"防滥用"和"管理端鉴权"这两条线——它们坏了不会白屏，只会悄悄收不到单或被刷爆。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequestGet, onRequestPatch, onRequestPost } from '../functions/api/orders.ts';

const makeKv = () => {
  const store = new Map();
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async list({ prefix = '', limit = 1000, cursor } = {}) {
      const names = [...store.keys()].filter((key) => key.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const page = names.slice(start, start + limit);
      const next = start + page.length;
      return {
        keys: page.map((name) => ({ name })),
        list_complete: next >= names.length,
        cursor: String(next),
      };
    },
  };
};

const TOKEN = 'test-orders-token';

const makeEnv = (overrides = {}) => ({ BLOG_STATS: makeKv(), ORDERS_ADMIN_TOKEN: TOKEN, ...overrides });

let seq = 0;
const baseOrder = (overrides = {}) => ({
  kind: 'bioinfo',
  name: '王老师',
  contact: 'wang@example.com',
  topic: '小鼠肝脏转录组差异分析',
  details: '60 个样本，3 组，想要火山图、热图和 GO/KEGG 富集。',
  budget: '3k-8k',
  company: '',
  elapsedMs: 30_000,
  ...overrides,
});

const request = (method, body, headers = {}) => {
  seq += 1;
  return new Request('https://darling-02.cn/api/orders', {
    method,
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

const postOrder = async (env, payload, headers) => {
  const response = await onRequestPost({ request: request('POST', payload, headers), env });
  return { status: response.status, body: await response.json() };
};

test('正常提交：201 + 参考编号，订单落库且状态是 new', async () => {
  const env = makeEnv();
  const { status, body } = await postOrder(env, baseOrder());

  assert.equal(status, 201);
  assert.equal(body.ok, true);
  assert.match(body.ref, /^[0-9A-F]{8}$/);

  const keys = [...env.BLOG_STATS.store.keys()].filter((key) => key.startsWith('order:'));
  assert.equal(keys.length, 1);
  const saved = JSON.parse(env.BLOG_STATS.store.get(keys[0]));
  assert.equal(saved.status, 'new');
  assert.equal(saved.name, '王老师');
  assert.equal(saved.ref, body.ref);
});

test('蜜罐命中：假装成功，但一条都不落库', async () => {
  const env = makeEnv();
  const { status, body } = await postOrder(env, baseOrder({ company: '机器人有限公司' }));

  assert.equal(status, 201);
  assert.equal(body.ref, 'OK');
  assert.equal([...env.BLOG_STATS.store.keys()].filter((key) => key.startsWith('order:')).length, 0);
});

test('两秒内提交：TOO_FAST', async () => {
  const env = makeEnv();
  const { status, body } = await postOrder(env, baseOrder({ elapsedMs: 400 }));
  assert.equal(status, 400);
  assert.equal(body.error.code, 'TOO_FAST');
});

test('漏必填字段：INVALID_INPUT 且指出是哪一项', async () => {
  const env = makeEnv();
  const { status, body } = await postOrder(env, baseOrder({ details: '   ' }));
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_INPUT');
  assert.match(body.error.message, /详细需求/);
});

test('超长字段：按上限拦住，不落库', async () => {
  const env = makeEnv();
  const { status, body } = await postOrder(env, baseOrder({ topic: 'x'.repeat(121) }));
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_INPUT');
  assert.equal([...env.BLOG_STATS.store.keys()].filter((key) => key.startsWith('order:')).length, 0);
});

test('每分钟第 4 次提交被限流', async () => {
  const env = makeEnv();
  for (let index = 0; index < 3; index += 1) {
    const ok = await postOrder(env, baseOrder());
    assert.equal(ok.status, 201);
  }
  const limited = await postOrder(env, baseOrder());
  assert.equal(limited.status, 429);
  assert.equal(limited.body.error.code, 'RATE_LIMITED');
});

test('没配 BLOG_STATS：503 STORAGE_UNAVAILABLE', async () => {
  const { status, body } = await postOrder(makeEnv({ BLOG_STATS: undefined }), baseOrder());
  assert.equal(status, 503);
  assert.equal(body.error.code, 'STORAGE_UNAVAILABLE');
});

test('管理端列表：无令牌 401、错令牌 401、没配令牌 503', async () => {
  const env = makeEnv();
  await postOrder(env, baseOrder());

  const anonymous = await onRequestGet({ request: request('GET', undefined), env });
  assert.equal(anonymous.status, 401);

  const wrong = await onRequestGet({ request: request('GET', undefined, { 'x-admin-token': 'nope' }), env });
  assert.equal(wrong.status, 401);

  const unconfigured = await onRequestGet({ request: request('GET', undefined), env: makeEnv({ ORDERS_ADMIN_TOKEN: '' }) });
  assert.equal(unconfigured.status, 503);
});

test('管理端列表：按时间倒序，字段完整', async () => {
  const env = makeEnv();
  await postOrder(env, baseOrder({ topic: '第一单' }));
  await new Promise((resolve) => setTimeout(resolve, 5));
  await postOrder(env, baseOrder({ topic: '第二单' }));

  const response = await onRequestGet({ request: request('GET', undefined, { 'x-admin-token': TOKEN }), env });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.items.length, 2);
  assert.equal(data.items[0].topic, '第二单');
  assert.equal(data.items[1].topic, '第一单');
  assert.equal(data.truncated, false);
  assert.equal(data.total, 2);
  // 限流键不能被当成订单出现在列表里。
  assert.ok(data.items.every((item) => item.id.startsWith('order:')));
});

test('改状态：成功写入 updatedAt；非法状态 / 越界键 / 不存在都拒绝', async () => {
  const env = makeEnv();
  const created = await postOrder(env, baseOrder());
  const keys = [...env.BLOG_STATS.store.keys()].filter((key) => key.startsWith('order:'));
  const id = keys[0];

  const patched = await onRequestPatch({
    request: request('PATCH', { id, status: 'accepted' }, { 'x-admin-token': TOKEN }),
    env,
  });
  assert.equal(patched.status, 200);
  const data = await patched.json();
  assert.equal(data.item.status, 'accepted');
  assert.equal(data.item.ref, created.body.ref);
  assert.ok(data.item.updatedAt);
  assert.equal(JSON.parse(env.BLOG_STATS.store.get(id)).status, 'accepted');

  const badStatus = await onRequestPatch({
    request: request('PATCH', { id, status: 'paid' }, { 'x-admin-token': TOKEN }),
    env,
  });
  assert.equal(badStatus.status, 400);

  const escaped = await onRequestPatch({
    request: request('PATCH', { id: 'pv:2026-11-03', status: 'accepted' }, { 'x-admin-token': TOKEN }),
    env,
  });
  assert.equal(escaped.status, 400);
  assert.equal((await escaped.json()).error.code, 'INVALID_ID');

  const missing = await onRequestPatch({
    request: request('PATCH', { id: 'order:1-missing', status: 'accepted' }, { 'x-admin-token': TOKEN }),
    env,
  });
  assert.equal(missing.status, 404);
});
