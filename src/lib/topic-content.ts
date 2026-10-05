import { parseDocument, stringify } from 'yaml';

export interface TopicDraftInput {
  category: string;
  slug: string;
  title: string;
  summary: string;
  cover: string;
  order: number;
  tags: string[];
  intro: string;
}

export interface SectionDraftInput {
  slug: string;
  title: string;
  order: number;
  readTime: string;
  content: string;
}

export const topicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createContentSlug = (title: string, kind: 'topic' | 'section') => {
  const ascii = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return ascii || `${kind}-${Date.now().toString(36)}`;
};

export const parseTopicDocument = (source: string, label: string) => {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`Topic document is missing frontmatter: ${label}`);
  const document = parseDocument(match[1]);
  if (document.errors.length) throw new Error(`Invalid topic frontmatter: ${label}: ${document.errors[0].message}`);
  const meta: unknown = document.toJS({ maxAliasCount: 20 });
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error(`Invalid topic frontmatter: ${label}`);
  return { meta: meta as Record<string, unknown>, body: match[2].trim() };
};

const requireText = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} 不能为空`);
  if (/[\r\n]/.test(value)) throw new Error(`${label} 不能包含换行`);
  return value.trim();
};

const requireBody = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} 不能为空`);
  return value.trim();
};

export const serializeTopic = (input: TopicDraftInput) => {
  // 栏目表现在是数据（src/content/categories.json），本模块要保持无 Vite 依赖（node 测试直接 import），
  // 所以这里只挡空值；「栏目存在且有专题目录」由 topic-publisher 的 pathFor 用实时栏目表判断。
  requireText(input.category, '幕后栏目');
  if (!topicSlugPattern.test(input.slug)) throw new Error('专题 Slug 只能包含小写字母、数字和连字符');
  if (!Number.isSafeInteger(input.order) || input.order < 0) throw new Error('专题排序必须是非负整数');
  return `---\n${stringify({
    title: requireText(input.title, '专题名称'),
    summary: requireText(input.summary, '专题简介'),
    order: input.order,
    ...(input.cover.trim() ? { cover: requireText(input.cover, '封面路径') } : {}),
    tags: input.tags.map((tag) => requireText(tag, '标签')),
  }).trimEnd()}\n---\n\n${requireBody(input.intro, '专题介绍')}\n`;
};

export const serializeSection = (input: SectionDraftInput) => {
  if (!topicSlugPattern.test(input.slug)) throw new Error('章节 Slug 只能包含小写字母、数字和连字符');
  if (!Number.isSafeInteger(input.order) || input.order < 0) throw new Error('章节排序必须是非负整数');
  return `---\n${stringify({
    title: requireText(input.title, '章节标题'),
    order: input.order,
    readTime: input.readTime.trim(),
  }).trimEnd()}\n---\n\n${requireBody(input.content, '章节正文')}\n`;
};
