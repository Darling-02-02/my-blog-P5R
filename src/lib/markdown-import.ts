import { parseDocument } from 'yaml';
import type { ArticleWriteInput } from './article-form';

/** Import only editable fields; identity, dates and publication state stay with storage. */
export const parseMarkdownImport = (source: string) => {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  let content = normalized;
  let meta: Record<string, unknown> = {};
  if (normalized.startsWith('---\n')) {
    const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
    if (!match) throw new Error('Frontmatter 缺少结束分隔符 ---');
    const document = parseDocument(match[1]);
    if (document.errors.length) throw new Error(`Frontmatter 格式错误：${document.errors[0].message}`);
    const parsed: unknown = document.toJS({ maxAliasCount: 20 });
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Frontmatter 必须是字段映射');
    meta = parsed as Record<string, unknown>;
    content = match[2];
  }
  if (!content.trim()) throw new Error('Markdown 正文不能为空');
  if (content.length > 500_000) throw new Error('Markdown 正文不能超过 500,000 个字符');
  const fields: Partial<Omit<ArticleWriteInput, 'content'>> = {};
  for (const key of ['slug', 'title', 'excerpt', 'category', 'subcategory', 'readTime', 'coverUrl'] as const) {
    if (meta[key] !== undefined) {
      if (typeof meta[key] !== 'string') throw new Error(`${key} 必须是文本`);
      fields[key] = meta[key].trim();
    }
  }
  if (meta.tags !== undefined) {
    if (!Array.isArray(meta.tags) || meta.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) throw new Error('tags 必须是非空文本组成的列表');
    fields.tags = [...new Set((meta.tags as string[]).map((tag) => tag.trim()))];
  }
  const withoutCode = content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
  const heading = withoutCode.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!fields.title && heading) fields.title = heading;
  if (!fields.slug && fields.title) {
    const slug = fields.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/, '');
    if (slug) fields.slug = slug;
  }
  fields.excerpt ??= withoutCode.split(/\n\s*\n/).find((part) => part.trim() && !/^\s*[#>|]/.test(part))?.trim().slice(0, 500) ?? '';
  return { fields, content: content.trim() };
};
