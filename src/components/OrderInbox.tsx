// /admin 的「📋 接单」页签：读 orders 接口的列表、改状态。
// 用**独立的**管理令牌（Cloudflare 环境变量 ORDERS_ADMIN_TOKEN），和文章后台的 GitHub token 不共用，
// 所以这里自己管一份 sessionStorage，不碰 AdminPage 的 TOKEN_KEY。
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  OrderApiError,
  ORDER_BUDGET_LABELS,
  ORDER_KIND_LABELS,
  ORDER_STATUS_LABELS,
  listOrders,
  updateOrderStatus,
} from '../lib/order-client';
import type { OrderRecord, OrderStatus } from '../lib/order-client';

const TOKEN_KEY = 'blog-orders-token';

const STATUS_ORDER: OrderStatus[] = ['new', 'talking', 'accepted', 'rejected'];

const panelStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: '14px',
  padding: '1.25rem',
} as const;

const describeError = (error: unknown): string => {
  if (error instanceof OrderApiError) {
    if (error.status === 401) return '接单令牌不正确（对应 Cloudflare 环境变量 ORDERS_ADMIN_TOKEN）';
    if (error.status === 503) return '服务端还没配置 ORDERS_ADMIN_TOKEN，接单接口的管理端处于关闭状态';
    if (error.status === 0) return '连不上接单接口，请检查网络后重试';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return '请求失败，请稍后重试';
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const OrderInbox = () => {
  const [storedToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [token, setToken] = useState(storedToken);
  const [input, setInput] = useState(storedToken);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (activeToken: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await listOrders(activeToken);
      setOrders(data.items);
      setTotal(data.total);
      setTruncated(data.truncated);
    } catch (caught) {
      setError(describeError(caught));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const status of STATUS_ORDER) map[status] = 0;
    for (const order of orders) map[order.status] = (map[order.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  const handleTokenSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = input.trim();
    if (!next) {
      setError('先填接单令牌');
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, next);
    setToken(next);
    setNotice('');
    setError('');
  };

  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setInput('');
    setOrders([]);
    setTotal(0);
    setError('');
    setNotice('已清除接单令牌');
  };

  const changeStatus = async (order: OrderRecord, status: OrderStatus) => {
    if (status === order.status || busyId) return;
    setBusyId(order.id);
    setError('');
    setNotice('');
    try {
      const data = await updateOrderStatus(token, order.id, status);
      setOrders((current) => current.map((item) => (item.id === order.id ? data.item : item)));
      setNotice(`${order.ref} 已标为「${ORDER_STATUS_LABELS[status]}」`);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId('');
    }
  };

  if (!token) {
    return (
      <div style={{ ...panelStyle, display: 'grid', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>📋 接单</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          这里用**接单专用令牌**（Cloudflare Pages 环境变量 <code>ORDERS_ADMIN_TOKEN</code>），
          和上面的文章 Token 是两把钥匙。令牌只存在本标签页的 sessionStorage，关掉浏览器就没了。
        </p>
        <form onSubmit={handleTokenSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="password"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="接单令牌"
            aria-label="接单令牌"
            style={{ padding: '0.7rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-body)', minWidth: '16rem' }}
          />
          <button type="submit" style={{ padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: 'var(--accent-fill)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            进入
          </button>
        </form>
        {error && <p role="alert" style={{ margin: 0, color: 'var(--text-danger)' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <style>{`
        .order-tools{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
        .order-filter{padding:.45rem .9rem;border:1px solid var(--border-card);border-radius:999px;background:var(--bg-card);color:var(--text-body);cursor:pointer;font:inherit;font-size:.85rem}
        .order-filter[data-active]{background:var(--accent-fill);border-color:var(--accent-fill);color:#fff;font-weight:700}
        .order-card{border:1px solid var(--border-card);border-radius:12px;padding:1rem;background:var(--bg-card);display:grid;gap:.5rem}
        .order-head{display:flex;gap:.75rem;flex-wrap:wrap;align-items:baseline;justify-content:space-between}
        .order-meta{color:var(--text-muted);font-size:.8rem;line-height:1.7}
        .order-detail{margin:0;color:var(--text-body);font-size:.92rem;line-height:1.9;white-space:pre-wrap;word-break:break-word}
      `}</style>

      <div style={{ ...panelStyle, display: 'grid', gap: '0.75rem' }}>
        <div className="order-tools">
          <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>📋 接单（{orders.length}）</h2>
          <button type="button" onClick={() => void load(token)} disabled={loading} style={{ padding: '0.35rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: 8, background: 'transparent', color: 'var(--text-body)', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '刷新中…' : '刷新'}
          </button>
          <button type="button" onClick={signOut} style={{ padding: '0.35rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            清除令牌
          </button>
        </div>
        <div className="order-tools" role="tablist" aria-label="按状态筛选">
          {(['all', ...STATUS_ORDER] as const).map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              onClick={() => setFilter(status)}
              className="order-filter"
              data-active={filter === status ? 'true' : undefined}
            >
              {status === 'all' ? '全部' : ORDER_STATUS_LABELS[status]}（{counts[status] ?? 0}）
            </button>
          ))}
        </div>
        {truncated && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            只列出最近 50 条（表里共有 {total} 条）。
          </p>
        )}
        {notice && <p role="status" style={{ margin: 0, color: '#1a7f37' }}>{notice}</p>}
        {error && <p role="alert" style={{ margin: 0, color: 'var(--text-danger)' }}>{error}</p>}
      </div>

      {loading && orders.length === 0 && (
        <p role="status" style={{ ...panelStyle, margin: 0, color: 'var(--text-muted)' }}>正在读取订单…</p>
      )}

      {!loading && visible.length === 0 && (
        <p role="status" style={{ ...panelStyle, margin: 0, color: 'var(--text-muted)' }}>
          {orders.length === 0 ? '还没有订单。有人提交后会出现在这里。' : '这个状态下没有订单。'}
        </p>
      )}

      {visible.map((order) => (
        <article key={order.id} className="order-card">
          <div className="order-head">
            <div style={{ display: 'grid', gap: '.2rem' }}>
              <strong style={{ color: 'var(--text-heading)', fontSize: '1rem' }}>
                {order.topic}
                <span style={{ marginLeft: '.6rem', fontSize: '.72rem', fontWeight: 600, padding: '.15rem .55rem', borderRadius: 999, border: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  {ORDER_KIND_LABELS[order.kind] ?? order.kind}
                </span>
              </strong>
              <span className="order-meta">
                {order.ref} · {formatTime(order.createdAt)}
                {order.budget ? ` · ${ORDER_BUDGET_LABELS[order.budget] ?? order.budget}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busyId === order.id || status === order.status}
                  onClick={() => void changeStatus(order, status)}
                  className="order-filter"
                  data-active={status === order.status ? 'true' : undefined}
                  style={{ opacity: busyId === order.id ? 0.5 : 1 }}
                >
                  {ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <p className="order-meta" style={{ margin: 0 }}>
            {order.name} · {order.contact}
            {order.deadline ? ` · 期望 ${order.deadline}` : ''}
          </p>
          {order.dataNote && <p className="order-meta" style={{ margin: 0 }}>数据：{order.dataNote}</p>}
          {order.link && (
            <p className="order-meta" style={{ margin: 0 }}>
              链接：<a href={order.link} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--text-link)' }}>{order.link}</a>
            </p>
          )}
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.85rem' }}>查看详细需求</summary>
            <p className="order-detail">{order.details}</p>
          </details>
          <p className="order-meta" style={{ margin: 0 }}>
            联系方式可以直接复制：<code>{order.contact}</code>
          </p>
        </article>
      ))}
    </div>
  );
};

export default OrderInbox;
