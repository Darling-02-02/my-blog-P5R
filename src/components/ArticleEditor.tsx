import { useState } from 'react';
import type { Article, ArticleWriteInput } from '../lib/article-types';

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

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
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
          子分类（可留空）
          <input value={form.subcategory} onChange={(event) => update('subcategory', event.target.value)} style={inputStyle} />
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

      <label style={fieldStyle}>
        Markdown 正文
        <textarea required value={form.content} onChange={(event) => update('content', event.target.value)} style={{ ...inputStyle, minHeight: '360px', resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }} />
      </label>

      {error && <p role="alert" style={{ color: '#b00020', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" onClick={onCancel} disabled={busy} style={{ padding: '0.7rem 1.2rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
          取消
        </button>
        <button type="submit" disabled={busy} style={{ padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
          {busy ? '保存中…' : '保存文章'}
        </button>
      </div>
    </form>
  );
};

export default ArticleEditor;
