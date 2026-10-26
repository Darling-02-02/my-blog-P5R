// 「中转站」：把同域路径 /opc/* 反代到 Omni Router 的源站（需求文档放在那儿）。
//
// 为什么走 Pages Function 而不是 DNS：darling-02.cn 整域已经指到 Cloudflare Pages，
// 根域不可能同时又是另一台机器；同域子路径则是 Cloudflare 侧一跳转发，博客完全不受影响。
// 源站地址放环境变量 OPC_ORIGIN（Pages → Settings → Environment variables），
// 没配就回 503 并说清楚缺什么，绝不静默转到一个空站。
//
// 注意（实测坑）：被反代的应用如果写死了以 / 开头的绝对资源路径（/assets/x.js），
// 在 /opc 子路径下会 404——要么源站支持 base path，要么改用子域名。这不是这里能修的。

export interface ProxyEnv {
  OPC_ORIGIN?: string;
}

export const PREFIX = '/opc';

/** /opc/a/b?x=1 → <origin>/<originPath>/a/b?x=1；origin 必须是带协议的绝对地址。 */
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

/** 上游返回的 Location 要换成本站的 /opc/...：
 *  - 指向源站的绝对地址 → 剥掉源站路径后加 /opc；
 *  - 相对地址（`/dashboard`）是同源写法，不换的话它落在本站根目录，Pages 直接 404；
 *  - 第三方绝对地址原样放行。 */
export const rewriteLocation = (location: string, requestUrl: string, origin: string): string => {
  try {
    const next = new URL(location, requestUrl);
    const target = new URL(origin);
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(location) || location.startsWith('//');
    if (isAbsolute && next.origin !== target.origin) return location;

    const base = target.pathname.replace(/\/+$/, '');
    const stripped = base && next.pathname.startsWith(base) ? next.pathname.slice(base.length) : next.pathname;
    const path = stripped.startsWith('/') ? stripped : `/${stripped}`;
    const prefixed = path === PREFIX || path.startsWith(`${PREFIX}/`) ? path : `${PREFIX}${path}`;
    return `${prefixed}${next.search}${next.hash}`;
  } catch {
    return location;
  }
};

const text = (body: string, status: number): Response =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });

const proxy = async (request: Request, env: ProxyEnv): Promise<Response> => {
  const origin = (env.OPC_ORIGIN ?? '').trim();
  if (!origin) {
    return text('中转站还没接上：给 Pages 项目配一个环境变量 OPC_ORIGIN（Omni Router 的源站地址），再重新部署。', 503);
  }

  let upstream: string;
  try {
    upstream = resolveProxyUrl(request.url, origin);
  } catch {
    return text('OPC_ORIGIN 不是合法地址（需要 https://host 这样的绝对地址）。', 500);
  }

  const headers = new Headers(request.headers);
  // Host 必须让 fetch 按上游地址自己填，原样带过去会被某些反代判成非法虚拟主机
  headers.delete('host');

  const init: RequestInit = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body;

  const upstreamResponse = await fetch(upstream, init);
  const outHeaders = new Headers(upstreamResponse.headers);
  const location = outHeaders.get('location');
  if (location) outHeaders.set('location', rewriteLocation(location, request.url, origin));

  return new Response(upstreamResponse.body, { status: upstreamResponse.status, headers: outHeaders });
};

export const onRequest = (context: { request: Request; env: ProxyEnv }): Promise<Response> =>
  proxy(context.request, context.env);
