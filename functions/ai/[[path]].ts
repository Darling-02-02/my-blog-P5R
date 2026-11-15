// 「白饭摊」接口额度 · 边缘反代（Cloudflare Pages Function）
//
//   https://darling-02.cn/ai/v1/chat/completions
//        └─ 本函数 ─→ AI_ORIGIN（记账层 new-api）→ 上游
//
// 和 functions/opc/[[path]].ts 是同一套路子，差别只有三点：
//   1. 前缀是 /ai，环境变量是 AI_ORIGIN（两套互不干扰，/opc 那边照旧）
//   2. 只放行 /ai/v1/* 与 /ai/api/usage：控制台、登录、注册、渠道管理一律 404，
//      连转发都不做——记账层就算裸奔在公网，这一层也不会把后台入口递出去
//   3. 不改写 Location（接口没有跳转语义），改成透传流式响应 + 补上 CORS
//
// 源站地址放 Pages → Settings → Environment variables 的 AI_ORIGIN，
// 值必须带协议（https://host 或 http://host:port）。没配就 503 并说清缺什么。

export interface ProxyEnv {
  AI_ORIGIN?: string;
}

export const PREFIX = '/ai';

/** 只有这些路径会被转发出去。写白名单而不是黑名单：多一个没列到的入口也不会漏。 */
const ALLOWED = [/^\/v1\/[A-Za-z0-9._\-/]*$/, /^\/api\/usage$/];

/** /ai/v1/a?x=1 → <origin>/v1/a?x=1 */
export const resolveProxyUrl = (requestUrl: string, origin: string): string => {
  const target = new URL(origin);
  const forwarded = new URL(requestUrl);
  const rest = forwarded.pathname.slice(PREFIX.length);
  const base = target.pathname.replace(/\/+$/, '');
  forwarded.protocol = target.protocol;
  forwarded.host = target.host;
  forwarded.pathname = `${base}${rest.startsWith('/') ? rest : `/${rest}`}` || '/';
  return forwarded.toString();
};

const text = (body: string, status: number): Response =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });

const json = (payload: unknown, status: number): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** 买家页是同域调用，本来不需要 CORS；本地脚本、别人嵌的前端要跨域时才用得上。 */
const withCors = (headers: Headers): Headers => {
  const out = new Headers(headers);
  out.set('access-control-allow-origin', '*');
  out.set('access-control-allow-headers', '*');
  out.set('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  return out;
};

const proxy = async (request: Request, env: ProxyEnv): Promise<Response> => {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: withCors(new Headers()) });
  }

  const rest = url.pathname.slice(PREFIX.length) || '/';
  if (!ALLOWED.some((re) => re.test(rest))) {
    // 控制台/登录/注册/后台：404 且不带任何提示，不给扫描器留指纹
    return text('Not Found', 404);
  }

  const origin = (env.AI_ORIGIN ?? '').trim();
  if (!origin) {
    return text(
      '接口还没接上：给 Pages 项目配环境变量 AI_ORIGIN（记账层的源站地址），再重新部署。',
      503,
    );
  }

  let upstream: string;
  try {
    upstream = resolveProxyUrl(request.url, origin);
  } catch {
    return text('AI_ORIGIN 不是合法地址（需要 https://host 这种绝对地址）。', 500);
  }

  const headers = new Headers(request.headers);
  // Host 交给 fetch 按上游地址自己填，原样带过去会被某些反代判成非法虚拟主机
  headers.delete('host');
  // CF 自己的头带过去会让上游把真实来源当成 Cloudflare 内网
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

  let res: Response;
  try {
    res = await fetch(upstream, init);
  } catch (err) {
    return json(
      { error: { message: `上游连不上：${(err as Error).message}`, type: 'upstream_unreachable' } },
      502,
    );
  }

  const outHeaders = withCors(res.headers);
  outHeaders.delete('content-encoding'); // 交给 CF 重新压，原编码透传会让客户端解不开
  outHeaders.delete('content-length');
  outHeaders.set('cache-control', 'no-store');

  // body 原样透传（ReadableStream），SSE 流式输出不会被缓冲成一大坨
  return new Response(res.body, { status: res.status, headers: outHeaders });
};

export const onRequest = (context: { request: Request; env: ProxyEnv }): Promise<Response> =>
  proxy(context.request, context.env);
