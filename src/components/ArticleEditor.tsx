import { lazy, Suspense, useState } from 'react';
import { parseMarkdownImport } from '../lib/markdown-import';
const MarkdownBody = lazy(() => import('./MarkdownBody'));
import type { Article } from '../../backend/src/articles/article.types';
import type { ArticleWriteInput } from '../lib/article-form';

interface ArticleEditorProps {
  initialArticle?: Article;
  categories: string[];
  busy: boolean;
  error: string | null;
  onSave: (input: ArticleWriteInput) => Promise<void>;
  onCancel: () => void;
}

const toInitialState = (article?: Article) => ({
  slug: article?.slug.split('/').pop() ?? '',
  title: article?.title ?? '',
  excerpt: article?.excerpt ?? '',
  content: article?.content ?? '',
  coverUrl: article?.coverUrl ?? '',
  category: article?.category ?? '',
  subcategory: article?.subcategory ?? '',
  readTime: article?.readTime ?? '',
  tagsText: article?.tags.join(', ') ?? '',
});

const ArticleEditor = ({ initialArticle, categories, busy, error, onSave, onCancel }: ArticleEditorProps) => {
  const [form, setForm] = useState(() => toInitialState(initialArticle));
  const [preview, setPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const importFile = async (file?: File) => {
    if (!file) return;
    if (form.content && !window.confirm('导入将替换当前正文和文件中提供的文章信息，是否继续？')) return;
    setImporting(true);
    setImportMessage('');
    try {
      if (!/\.(md|markdown)$/i.test(file.name)) throw new Error('请选择 .md 或 .markdown 文件');
      if (file.size > 2_000_000) throw new Error('文件不能超过 2 MB');
      const { fields, content } = parseMarkdownImport(await file.text());
      const { tags, ...textFields } = fields;
      setForm((current) => ({
        ...current,
        ...textFields,
        // Keep an existing article's URL stable when importing replacement content.
        slug: initialArticle ? current.slug : textFields.slug ?? current.slug,
        content,
        tagsText: tags ? tags.join(', ') : current.tagsText,
      }));
      setImportMessage(`已导入 ${file.name}，请核对分类、标签和 Slug 后保存。图片需要使用已上线的 URL 或站点路径。`);
    } catch (cause) {
      setImportMessage(cause instanceof Error ? cause.message : '文件读取失败');
    } finally {
      setImporting(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || importing) return;
    if (!form.content.trim()) { setImportMessage('Markdown 正文不能为空'); return; }
    await onSave({
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      coverUrl: form.coverUrl.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      readTime: form.readTime.trim(),
      tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
  };

  const fieldStyle = { display: 'grid', gap: '0.35rem' };
  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.8rem',
    border: '1px solid var(--border-card)',
    borderRadius: '8px',
    background: 'var(--bg-card)',
    color: 'var(--text-body)',
    boxSizing: 'border-box' as const,
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={busy || importing} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <label style={fieldStyle}>
          标题
          <input required value={form.title} onChange={(event) => update('title', event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          Slug
          <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => update('slug', event.target.value)} style={inputStyle} />
        </label>
        <label style={fieldStyle}>
          分类（栏目）
          <input required list="article-category-options" value={form.category} onChange={(event) => update('category', event.target.value)} style={inputStyle} placeholder="直接输入就是新栏目" />
          <datalist id="article-category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label style={fieldStyle}>
          阅读时长
          <input value={form.readTime} onChange={(event) => update('readTime', event.target.value)} style={inputStyle} placeholder="5 分钟" />
        </label>
      </div>

      <label style={fieldStyle}>
        摘要
        <textarea required value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} />
      </label>

      <label style={fieldStyle}>
        封面 URL
        <input value={form.coverUrl} onChange={(event) => update('coverUrl', event.target.value)} style={inputStyle} placeholder="/cover.png" />
      </label>

      <label style={fieldStyle}>
        标签（用逗号分隔）
        <input value={form.tagsText} onChange={(event) => update('tagsText', event.target.value)} style={inputStyle} placeholder="React, TypeScript" />
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <strong>Markdown 正文</strong>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ border: '1px solid var(--border-card)', borderRadius: '8px', padding: '0.55rem 0.8rem', cursor: importing ? 'wait' : 'pointer', color: 'var(--text-body)' }}>
            {importing ? '读取中…' : '导入 Markdown'}
            <input aria-label="选择 Markdown 文件" type="file" accept=".md,.markdown,text/markdown" disabled={busy || importing} onChange={(event) => { void importFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          </label>
          <button type="button" onClick={() => setPreview((value) => !value)} style={{ padding: '0.55rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: preview ? 'rgba(255,0,64,0.1)' : 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
            {preview ? '返回编辑' : '预览渲染'}
          </button>
        </div>
      </div>
      {importMessage && <p role="status" style={{ margin: 0, color: importMessage.includes('失败') || importMessage.includes('不能') || importMessage.includes('请选择') ? '#b00020' : 'var(--text-muted)' }}>{importMessage}</p>}
      {preview ? (
        <div style={{ minHeight: '360px', padding: '1rem', border: '1px solid var(--border-card)', borderRadius: '8px', overflow: 'auto' }}>
          <Suspense fallback={<p role="status">加载预览…</p>}>
            <MarkdownBody content={form.content} />
          </Suspense>
        </div>
      ) : (
        <textarea aria-label="Markdown 正文" required value={form.content} onChange={(event) => update('content', event.target.value)} style={{ ...inputStyle, minHeight: '360px', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }} />
      )}

      {error && <p role="alert" style={{ color: '#b00020', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" onClick={onCancel} disabled={busy} style={{ padding: '0.7rem 1.2rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
          取消
        </button>
        <button type="submit" disabled={busy} style={{ padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
          {busy ? '保存中…' : '保存文章'}
        </button>
      </div>
      </fieldset>
    </form>
  );
};

export default ArticleEditor;
