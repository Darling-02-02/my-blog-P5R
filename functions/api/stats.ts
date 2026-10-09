// 站点计数器：POST /api/stats?firstVisit=1|0 → { pv, uv }
// 绑定来自仓库根目录的 wrangler.toml（[[kv_namespaces]] binding = "BLOG_STATS"）；
// 没有绑定时返回 503，前端 src/lib/site-visits.ts 会退化成「—」，不显示编出来的 0。
//
// 故意不装 @cloudflare/workers-types：tsconfig.app.json 只 include 了 src，这份文件不参与 tsc -b，
// 本地结构化类型足够描述用到的 KV 读写。

interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  BLOG_STATS?: KvLike;
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const toCount = (raw: string | null | undefined): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  const kv = context.env.BLOG_STATS;
  if (!kv) return json({ error: 'BLOG_STATS 未绑定' }, 503);

  const firstVisit = new URL(context.request.url).searchParams.get('firstVisit') === '1';

  const pv = toCount(await kv.get('pv')) + 1;
  const uv = toCount(await kv.get('uv')) + (firstVisit ? 1 : 0);

  // 这里是「读-改-写」，KV 又是最终一致的：个人博客的量级没问题，真高并发会丢计数。
  // 写失败就让它抛出去（Pages 回 500），前端拿到非 ok 会显示「—」，而不是一个没存下来的数。
  await kv.put('pv', String(pv));
  if (firstVisit) await kv.put('uv', String(uv));

  return json({ pv, uv }, 200);
};
