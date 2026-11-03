// 接单接口的浏览器客户端：接单页提交 + /admin 的「📋 接单」页签。
//
// 接口是 Cloudflare Pages Function（functions/api/orders.ts），和站点同源：
// 路径走 BASE_URL，部署在子路径也不会跑偏。
import type { OrderBudget, OrderKind, OrderStatus } from '../../functions/api/orders';

// 转出去，页面组件只认这一个模块，不用再各自去 functions/ 里翻类型。
export type { OrderBudget, OrderKind, OrderStatus };

const endpoint = () => `${import.meta.env.BASE_URL}api/orders`.replace(/\/{2,}/g, '/');

export class OrderApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OrderApiError';
    this.status = status;
  }
}

export interface OrderSubmission {
  kind: OrderKind;
  name: string;
  contact: string;
  topic: string;
  details: string;
  dataNote?: string;
  deadline?: string;
  budget: OrderBudget;
  link?: string;
  /** 蜜罐：真人看不见这个字段，永远留空 */
  company: string;
  /** 页面挂载到点提交的毫秒数，服务端用来过滤秒提交的机器人 */
  elapsedMs: number;
}

export interface OrderRecord {
  id: string;
  ref: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  kind: OrderKind;
  name: string;
  contact: string;
  topic: string;
  details: string;
  dataNote?: string;
  deadline?: string;
  budget?: OrderBudget;
  link?: string;
}

export const ORDER_KIND_LABELS: Record<OrderKind, string> = {
  bioinfo: '生物信息分析',
  dev: '开发 / 工具',
  'data-viz': '数据可视化',
  other: '其他',
};

export const ORDER_BUDGET_LABELS: Record<OrderBudget, string> = {
  lt1k: '1000 元以内',
  '1k-3k': '1000–3000 元',
  '3k-8k': '3000–8000 元',
  gt8k: '8000 元以上',
  talk: '面议 / 还不确定',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: '新单',
  talking: '沟通中',
  accepted: '已接单',
  rejected: '已谢绝',
};

const request = async <T>(init: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(endpoint(), init);
  } catch {
    throw new OrderApiError('连不上接单接口，请检查网络后重试', 0);
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok) {
    throw new OrderApiError(payload?.error?.message ?? `提交失败（${response.status}）`, response.status);
  }
  if (!payload) throw new OrderApiError('接口返回了无法解析的内容', response.status);
  return payload;
};

export const submitOrder = (input: OrderSubmission) =>
  request<{ ok: true; ref: string }>({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

export const listOrders = (token: string) =>
  request<{ items: OrderRecord[]; total: number; truncated: boolean }>({
    method: 'GET',
    headers: { 'x-admin-token': token },
  });

export const updateOrderStatus = (token: string, id: string, status: OrderStatus) =>
  request<{ ok: true; item: OrderRecord }>({
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ id, status }),
  });
