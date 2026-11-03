// 接单接口：POST 提交（公开）、GET 列表（管理端）、PATCH 改状态（管理端）。
//
// 为什么放 Pages Function 而不是 backend/（Fastify 那套）：接单页和站点同源，
// 同源请求既不用配 CORS，也不用把管理令牌暴露给浏览器以外的任何地方；
// 站点本身就是 Cloudflare Pages（functions/api/stats.ts 已经在用 KV）。
//
// 存储复用 wrangler.toml 里已有的 BLOG_STATS 绑定，键前缀分开：
//   order:<epochMs>-<rand>  订单（无 TTL，长期保留）
//   rl:m:<ip>:<分钟>        每分钟限流（TTL 180s）
//   rl:d:<ip>:<yyyy-mm-dd>  每日限流（TTL 172800s）
// 量大了再换独立命名空间或 D1 —— 换的时候只改这里和 wrangler.toml，前端不用动。
//
// 故意不装 @cloudflare/workers-types：tsconfig.app.json 只 include 了 src，这份文件不参与 tsc -b，
// 本地结构化类型足够描述用到的 KV 读写（与 stats.ts 同一套约定）。

interface KvListResult {
  keys: { name: string }[];
  list_complete: boolean;
  cursor?: string;
}

interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options: { prefix?: string; limit?: number; cursor?: string }): Promise<KvListResult>;
}

interface Env {
  BLOG_STATS?: KvLike;
  /** 管理端令牌；没配时管理端接口回 503，公开提交照常可用 */
  ORDERS_ADMIN_TOKEN?: string;
  /** 可选：订单摘要转发地址（Telegram Bot / Bark / Server酱 之类的通用 JSON 入口） */
  ORDER_WEBHOOK_URL?: string;
}

const ORDER_PREFIX = 'order:';

// 请求体上限：正常需求描述 4000 字符，留足 JSON 转义余量。
const MAX_BODY_BYTES = 12_000;
// 页面挂载到提交的最短间隔：真人填表不可能两秒内完成，机器人常常是。
const MIN_ELAPSED_MS = 2_000;
const RATE_PER_MINUTE = 3;
const RATE_PER_DAY = 20;

export const ORDER_KINDS = ['bioinfo', 'dev', 'data-viz', 'other'] as const;
export const ORDER_BUDGETS = ['lt1k', '1k-3k', '3k-8k', 'gt8k', 'talk'] as const;
export const ORDER_STATUSES = ['new', 'talking', 'accepted', 'rejected'] as const;

export type OrderKind = (typeof ORDER_KINDS)[number];
export type OrderBudget = (typeof ORDER_BUDGETS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// 文本字段：长度上限就是防滥用边界，别只在前端 maxLength 上做。
const TEXT_FIELDS = [
  { key: 'name', label: '称呼', max: 40, required: true },
  { key: 'contact', label: '联系方式', max: 120, required: true },
  { key: 'topic', label: '项目一句话', max: 120, required: true },
  { key: 'details', label: '详细需求', max: 4000, required: true },
  { key: 'dataNote', label: '数据情况', max: 1000, required: false },
  { key: 'deadline', label: '期望交付时间', max: 80, required: false },
  { key: 'link', label: '数据或网盘链接', max: 300, required: false },
] as const;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const fail = (status: number, code: string, message: string) =>
  json({ error: { code, message } }, status);

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);

/** 只接受纯字节数以内的请求体：先看长度再 parse，别让超大 body 进 JSON.parse。 */
const readJsonBody = async (request: Request): Promise<{ ok: true; value: unknown } | { ok: false; reason: string }> => {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return { ok: false, reason: '请求体过大' };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, reason: '请求体不是合法的 JSON' };
  }
};

const clientIp = (request: Request): string =>
  request.headers.get('cf-connecting-ip')?.trim() || 'unknown';

const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);

/** 读-改-写计数；KV 最终一致，高并发会漏计——个人接单的量级够用。 */
const bumpCounter = async (kv: KvLike, key: string, ttl: number): Promise<number> => {
  const current = Number(await kv.get(key)) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: ttl });
  return next;
};

const validateOrder = (
  raw: unknown,
): { ok: true; value: Record<string, string> } | { ok: false; message: string } => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, message: '请求体必须是一个对象' };
  const source = raw as Record<string, unknown>;
  const value: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    const input = source[field.key];
    if (input === undefined || input === null) {
      if (field.required) return { ok: false, message: `缺少「${field.label}」` };
      value[field.key] = '';
      continue;
    }
    if (typeof input !== 'string') return { ok: false, message: `「${field.label}」必须是文本` };
    const text = input.trim();
    if (field.required && !text) return { ok: false, message: `「${field.label}」不能为空` };
    if (text.length > field.max) return { ok: false, message: `「${field.label}」最多 ${field.max} 个字符` };
    value[field.key] = text;
  }

  value.kind = isOneOf(source.kind, ORDER_KINDS) ? source.kind : 'other';
  value.budget = isOneOf(source.budget, ORDER_BUDGETS) ? source.budget : 'talk';
  return { ok: true, value };
};

const orderSummaryText = (order: Record<string, unknown>, ref: string): string =>
  [
    `📥 新单 #${ref}`,
    `类型：${order.kind}`,
    `称呼：${order.name}`,
    `联系：${order.contact}`,
    `一句话：${order.topic}`,
    order.budget ? `预算：${order.budget}` : '',
    order.deadline ? `期望交付：${order.deadline}` : '',
    '',
    String(order.details ?? '').slice(0, 1200),
  ]
    .filter((line) => line !== '')
    .join('\n');

const notifyWebhook = async (env: Env, order: Record<string, unknown>, ref: string): Promise<void> => {
  const url = env.ORDER_WEBHOOK_URL?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: orderSummaryText(order, ref), order }),
    });
  } catch (error) {
    // 通知失败不能让客户看到错误：单子已经落库了，漏的是提醒不是订单。
    console.error('[orders] webhook 发送失败：', error);
  }
};

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const kv = context.env.BLOG_STATS;
  if (!kv) return fail(503, 'STORAGE_UNAVAILABLE', '接单存储暂不可用');

  const body = await readJsonBody(context.request);
  if (!body.ok) return fail(400, 'INVALID_BODY', body.reason);

  const payload = body.value as Record<string, unknown>;

  // 蜜罐：真人看不到这个输入框。命中了就假装成功，别给机器人任何反馈。
  if (typeof payload.company === 'string' && payload.company.trim()) {
    return json({ ok: true, ref: 'OK' }, 201);
  }

  const elapsed = Number(payload.elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) {
    return fail(400, 'TOO_FAST', '提交得太快了，请刷新页面后重试');
  }

  const validated = validateOrder(payload);
  if (!validated.ok) return fail(400, 'INVALID_INPUT', validated.message);

  const ip = clientIp(context.request);
  const now = Date.now();

  const minuteCount = await bumpCounter(kv, `rl:m:${ip}:${Math.floor(now / 60_000)}`, 180);
  if (minuteCount > RATE_PER_MINUTE) return fail(429, 'RATE_LIMITED', '提交太频繁了，请稍后再试');

  const dayCount = await bumpCounter(kv, `rl:d:${ip}:${dayKey(now)}`, 172_800);
  if (dayCount > RATE_PER_DAY) return fail(429, 'RATE_LIMITED', '今天提交得太多了，请明天再试');

  const id = `${ORDER_PREFIX}${now}-${crypto.randomUUID().slice(0, 8)}`;
  const ref = id.slice(-8).toUpperCase();
  const order = {
    id,
    ref,
    createdAt: new Date(now).toISOString(),
    status: 'new' satisfies OrderStatus,
    ...validated.value,
    ip,
  };

  await kv.put(id, JSON.stringify(order));
  await notifyWebhook(context.env, order, ref);

  return json({ ok: true, ref }, 201);
};

const isAdmin = (request: Request, env: Env): boolean => {
  const expected = env.ORDERS_ADMIN_TOKEN?.trim();
  return Boolean(expected) && request.headers.get('x-admin-token') === expected;
};

const parseOrder = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/** 管理端列表：取最新的 50 条（KV 键按 epochMs 字典序 = 时间序，倒着读）。 */
export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const kv = context.env.BLOG_STATS;
  if (!kv) return fail(503, 'STORAGE_UNAVAILABLE', '接单存储暂不可用');
  if (!context.env.ORDERS_ADMIN_TOKEN?.trim()) {
    return fail(503, 'ADMIN_NOT_CONFIGURED', '管理端令牌未配置（ORDERS_ADMIN_TOKEN）');
  }
  if (!isAdmin(context.request, context.env)) return fail(401, 'UNAUTHORIZED', '管理令牌不正确');

  const names: string[] = [];
  let cursor: string | undefined;
  // 上限两页 × 1000 键：个人接单不会有这么多存量，超过就视为 truncated。
  for (let page = 0; page < 2; page += 1) {
    const result: KvListResult = await kv.list({ prefix: ORDER_PREFIX, limit: 1000, cursor });
    names.push(...result.keys.map((key) => key.name));
    if (result.list_complete) break;
    cursor = result.cursor;
  }

  names.sort().reverse();
  const picked = names.slice(0, 50);
  const raws = await Promise.all(picked.map((name) => kv.get(name)));
  const items = raws.map(parseOrder).filter((item): item is Record<string, unknown> => Boolean(item));

  return json({ items, total: names.length, truncated: names.length > picked.length }, 200);
};

export const onRequestPatch = async (context: { request: Request; env: Env }): Promise<Response> => {
  const kv = context.env.BLOG_STATS;
  if (!kv) return fail(503, 'STORAGE_UNAVAILABLE', '接单存储暂不可用');
  if (!context.env.ORDERS_ADMIN_TOKEN?.trim()) {
    return fail(503, 'ADMIN_NOT_CONFIGURED', '管理端令牌未配置（ORDERS_ADMIN_TOKEN）');
  }
  if (!isAdmin(context.request, context.env)) return fail(401, 'UNAUTHORIZED', '管理令牌不正确');

  const body = await readJsonBody(context.request);
  if (!body.ok) return fail(400, 'INVALID_BODY', body.reason);
  const payload = body.value as Record<string, unknown>;

  // 只允许改自己命名空间下的键：别让一个错令牌变成任意 KV 写入。
  const id = typeof payload.id === 'string' ? payload.id : '';
  if (!id.startsWith(ORDER_PREFIX)) return fail(400, 'INVALID_ID', '订单编号不合法');
  if (!isOneOf(payload.status, ORDER_STATUSES)) return fail(400, 'INVALID_STATUS', '状态不合法');

  const current = parseOrder(await kv.get(id));
  if (!current) return fail(404, 'ORDER_NOT_FOUND', '找不到这条订单');

  const updated = { ...current, status: payload.status, updatedAt: new Date().toISOString() };
  await kv.put(id, JSON.stringify(updated));
  return json({ ok: true, item: updated }, 200);
};
