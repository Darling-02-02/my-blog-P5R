// 接单页（/hire）的文案，唯一数据源：src/content/hire.json。
//
// 和栏目表、个人简介、碎碎念同一套约定：构建期把 JSON 编译进来（见 src/data/hire.ts），
// 构建期校验走 scripts/validate-content.mjs。这个模块刻意保持纯函数（不 import Vite 专有的
// ?raw / import.meta），node 脚本才能直接 import 做校验。
//
// 这里没有 serialize：接单页的文案只靠改仓库里的 JSON 维护，后台不写它（写它还得再造一套后台）。

export interface HireService {
  title: string;
  desc: string;
  items: string[];
}

export interface HireStep {
  title: string;
  desc: string;
}

export interface HireFaq {
  q: string;
  a: string;
}

export interface HireContent {
  headline: string;
  intro: string;
  availability: string;
  email: string;
  services: HireService[];
  process: HireStep[];
  pricing: { note: string; hints: string[] };
  faq: HireFaq[];
}

/** JSON 读不到或坏了时的兜底：页面还能显示一句人话 + 邮箱，不至于白屏（PRODUCT.md 约束 #4/#8）。 */
export const defaultHireContent: HireContent = {
  headline: '接单中',
  intro: '需求描述暂时没读到，直接邮件联系也一样能找到我。',
  availability: '排期以沟通结果为准',
  email: '19503862693@163.com',
  services: [],
  process: [],
  pricing: { note: '', hints: [] },
  faq: [],
};

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}必须是一个对象`);
  return value as Record<string, unknown>;
};

const requireText = (value: unknown, label: string, max = 600): string => {
  if (typeof value !== 'string') throw new Error(`${label}必须是文本`);
  const text = value.trim();
  if (!text) throw new Error(`${label}不能为空`);
  if (text.length > max) throw new Error(`${label}太长了（最多 ${max} 字）`);
  return text;
};

const optionalText = (value: unknown, label: string, max = 600): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error(`${label}必须是文本`);
  const text = value.trim();
  if (text.length > max) throw new Error(`${label}太长了（最多 ${max} 字）`);
  return text;
};

const requireList = (value: unknown, label: string, min: number): unknown[] => {
  if (!Array.isArray(value)) throw new Error(`${label}必须是列表`);
  if (value.length < min) throw new Error(`${label}至少要有一条`);
  return value;
};

const textList = (value: unknown, label: string, max: number): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${label}必须是列表`);
  return value.map((item, index) => requireText(item, `${label}第 ${index + 1} 条`, max));
};

/** 解析接单页配置；任何一处不合法都抛中文错，让构建期立刻暴露，而不是线上少一块内容。 */
export const parseHireDocument = (raw: string): HireContent => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`接单页配置不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  const source = asRecord(parsed, '接单页配置');

  const services = requireList(source.services, 'services', 1).map((item, index) => {
    const service = asRecord(item, `services 第 ${index + 1} 项`);
    return {
      title: requireText(service.title, `services 第 ${index + 1} 项的 title`, 60),
      desc: optionalText(service.desc, `services 第 ${index + 1} 项的 desc`, 300),
      items: textList(service.items, `services 第 ${index + 1} 项的 items`, 80),
    };
  });

  const process = requireList(source.process, 'process', 1).map((item, index) => {
    const step = asRecord(item, `process 第 ${index + 1} 项`);
    return {
      title: requireText(step.title, `process 第 ${index + 1} 项的 title`, 40),
      desc: requireText(step.desc, `process 第 ${index + 1} 项的 desc`, 300),
    };
  });

  const pricing = asRecord(source.pricing, 'pricing');
  const faq = requireList(source.faq, 'faq', 1).map((item, index) => {
    const entry = asRecord(item, `faq 第 ${index + 1} 项`);
    return {
      q: requireText(entry.q, `faq 第 ${index + 1} 项的 q`, 120),
      a: requireText(entry.a, `faq 第 ${index + 1} 项的 a`, 600),
    };
  });

  const email = requireText(source.email, 'email', 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email 不是合法的邮箱地址');

  return {
    headline: requireText(source.headline, 'headline', 120),
    intro: requireText(source.intro, 'intro', 400),
    availability: optionalText(source.availability, 'availability', 120),
    email,
    services,
    process,
    pricing: {
      note: optionalText(pricing.note, 'pricing.note', 600),
      hints: textList(pricing.hints, 'pricing.hints', 200),
    },
    faq,
  };
};
