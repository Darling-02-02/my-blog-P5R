import { lazy, Suspense, useState } from 'react';
import type { Topic, TopicSection } from '../data/topics';
import { parseMarkdownImport } from '../lib/markdown-import';
import { topicDirectories } from '../data/category-source';
import { createContentSlug } from '../lib/topic-content';
import type { TopicDraftInput, SectionDraftInput } from '../lib/topic-content';
import { topicPublisher } from '../lib/topic-publisher';

const MarkdownBody = lazy(() => import('./MarkdownBody'));
const emptyTopic = (category: string): TopicDraftInput => ({ category, slug: '', title: '', summary: '', cover: '', order: 1, tags: [], intro: '' });
const emptySection = (order = 1): SectionDraftInput => ({ slug: '', title: '', order, readTime: '', content: '' });
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '0.65rem', border: '1px solid var(--border-card)', borderRadius: 6, color: 'var(--text-body)', background: 'var(--bg-card)' };
const labelStyle = { display: 'grid', gap: '0.35rem', color: 'var(--text-body)' };

interface Props {
  token: string;
  topics: Topic[];
  refresh: () => Promise<void>;
  /**
   * 仓库里正在生效的「栏目名 -> 专题目录」。不传就用构建期那份（见 src/data/category-source.ts）。
   * 传了空对象表示实时栏目表里一个"用专题组织"的栏目都没有，此时不该拿构建期的旧栏目来发内容。
   */
  directories?: Record<string, string>;
}

export default function TopicEditor({ token, topics, refresh, directories }: Props) {
  const table = directories ?? topicDirectories;
  const categories = Object.keys(table);
  const [category, setCategory] = useState(() => categories[0]);
  // 实时栏目表可能删掉了当前选中的栏目，这时回落到第一个，避免下拉框变成空值。
  const activeCategory = categories.includes(category) ? category : categories[0];
  const [selected, setSelected] = useState('');
  const [sectionSlug, setSectionSlug] = useState('');
  const [topic, setTopic] = useState<TopicDraftInput>(() => emptyTopic(categories[0]));
  const [section, setSection] = useState<SectionDraftInput>(() => emptySection());
  const [tab, setTab] = useState<'topic' | 'section'>('topic');
  const [tagsText, setTagsText] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const matching = topics.filter((item) => item.category === activeCategory);
  const active = matching.find((item) => item.slug === selected);

  const chooseTopic = (slug: string) => {
    const found = matching.find((item) => item.slug === slug);
    setSelected(slug);
    setSectionSlug('');
    setTab('topic');
    setPreview(false);
    setMessage('');
    setTopic(found ? { category: activeCategory, slug: found.slug, title: found.title, summary: found.summary, cover: found.cover, order: found.order, tags: found.tags, intro: found.intro } : emptyTopic(activeCategory));
    setTagsText(found?.tags.join(', ') ?? '');
    setSection(emptySection(found ? Math.max(0, ...found.sections.map((item) => item.order)) + 1 : 1));
  };

  const chooseSection = (slug: string) => {
    const found = active?.sections.find((item) => item.slug === slug);
    setSectionSlug(slug);
    setSection(found ? { slug: found.slug, title: found.title, order: found.order, readTime: found.readTime, content: found.content } : emptySection(Math.max(0, ...(active?.sections.map((item) => item.order) ?? [])) + 1));
    setTab('section');
    setPreview(false);
    setMessage('');
  };

  const importMarkdown = async (file?: File, target: 'topic' | 'section' = tab) => {
    if (!file) return;
    if ((target === 'topic' ? topic.intro : section.content) && !window.confirm('导入将替换当前正文，是否继续？')) return;
    try {
      if (!/\.(md|markdown)$/i.test(file.name) || file.size > 2_000_000) throw new Error('仅支持不超过 2 MB 的 .md 或 .markdown 文件');
      const { fields, content } = parseMarkdownImport(await file.text());
      if (target === 'topic') setTopic((current) => ({ ...current, title: fields.title || current.title, summary: fields.excerpt || current.summary, intro: content }));
      else setSection((current) => ({ ...current, title: fields.title || current.title, readTime: fields.readTime || current.readTime, content }));
      setMessage('已导入 Markdown，请核对标题和其他字段后保存。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '文件读取失败'); }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (tab === 'topic') {
        const input = { ...topic, slug: topic.slug || createContentSlug(topic.title, 'topic'), tags: [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))] };
        const firstSection = { ...section, slug: section.slug || createContentSlug(section.title, 'section') };
        if (selected) await topicPublisher.saveTopic(token, input, table);
        else await topicPublisher.create(token, input, firstSection, table);
        setSelected(input.slug);
      } else {
        const input = { ...section, slug: section.slug || createContentSlug(section.title, 'section') };
        await topicPublisher.saveSection(token, activeCategory, selected, input, !sectionSlug, table);
        setSectionSlug(input.slug);
      }
      await refresh();
      setMessage('已提交到 GitHub，站点重新构建后即可访问。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '保存失败'); }
    finally { setBusy(false); }
  };

  const topicField = <K extends keyof TopicDraftInput>(key: K, value: TopicDraftInput[K]) => setTopic((current) => ({ ...current, [key]: value }));
  const sectionField = <K extends keyof SectionDraftInput>(key: K, value: SectionDraftInput[K]) => setSection((current) => ({ ...current, [key]: value }));
  const markdown = tab === 'topic' ? topic.intro : section.content;

  if (!categories.length) return <p role="status" style={{ margin: 0, color: 'var(--text-body)' }}>
    仓库里还没有「用专题组织」的栏目，所以这里没法发专题。请先到「🗂 幕后栏目」新建一个（模式选「用专题组织」并填目录名），再回来。
  </p>;

  return <div style={{ display: 'grid', gap: '1rem' }}>
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
      <label style={{ ...labelStyle, flex: '1 1 130px' }}>幕后栏目
        <select value={activeCategory} style={inputStyle} onChange={(event) => { const next = event.target.value; setCategory(next); setSelected(''); setSectionSlug(''); setTopic(emptyTopic(next)); setSection(emptySection()); setTagsText(''); setTab('topic'); setMessage(''); }}>
          {categories.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <label style={{ ...labelStyle, flex: '2 1 180px' }}>专题
        <select value={selected} style={inputStyle} onChange={(event) => chooseTopic(event.target.value)}>
          <option value="">新建专题</option>
          {matching.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => chooseTopic('')} style={inputStyle}>＋ 新建专题</button>
    </div>
    {selected && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', flexWrap: 'wrap' }}>
      <button type="button" onClick={() => setTab('topic')} aria-pressed={tab === 'topic'} style={inputStyle}>专题信息</button>
      <label style={labelStyle}>章节
        <select value={sectionSlug} style={inputStyle} onChange={(event) => chooseSection(event.target.value)}>
          <option value="">新建章节</option>
          {active?.sections.map((item: TopicSection) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => chooseSection('')} style={inputStyle}>＋ 新建章节</button>
    </div>}
    <form onSubmit={(event) => { void submit(event); }} style={{ display: 'grid', gap: '0.85rem' }}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '0.85rem', minWidth: 0 }}>
        <h3 style={{ margin: 0, color: 'var(--text-heading)' }}>{tab === 'topic' ? selected ? '编辑专题' : '新建专题' : sectionSlug ? '编辑章节' : '新建章节'}</h3>
        {tab === 'topic' ? <>
          <label style={labelStyle}>专题名称<input required value={topic.title} onChange={(event) => topicField('title', event.target.value)} style={inputStyle} placeholder="例如：从零开始学机器学习" /></label>
          <p style={{ margin: '-0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>🔗 专题网址会根据名称自动生成 Slug，不需要手填；中文名称会使用短 ID。</p>
          <label style={labelStyle}>一句话简介<textarea required value={topic.summary} onChange={(event) => topicField('summary', event.target.value)} style={inputStyle} placeholder="让读者一眼知道这个专题讲什么" /></label>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>更多设置（可选）</summary>
            <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.7rem' }}>
              <label style={labelStyle}>封面路径<input value={topic.cover} onChange={(event) => topicField('cover', event.target.value)} style={inputStyle} placeholder="https://... 或站点路径" /></label>
              <label style={labelStyle}>标签（逗号分隔）<input value={tagsText} onChange={(event) => setTagsText(event.target.value)} style={inputStyle} placeholder="机器学习, 入门" /></label>
            </div>
          </details>
          {!selected && <div style={{ display: 'grid', gap: '0.7rem', borderTop: '1px solid var(--border-card)', paddingTop: '0.8rem' }}>
            <strong>🌱 首个章节</strong>
            <label style={labelStyle}>章节标题<input required value={section.title} onChange={(event) => sectionField('title', event.target.value)} style={inputStyle} placeholder="例如：认识监督学习" /></label>
            <p style={{ margin: '-0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>章节网址也会自动生成 Slug，保存后可以继续添加更多章节。</p>
            <label style={labelStyle}>首章正文<textarea required value={section.content} onChange={(event) => sectionField('content', event.target.value)} style={{ ...inputStyle, minHeight: 130, fontFamily: 'monospace' }} placeholder="支持 Markdown、代码块、公式和 Mermaid 流程图" /></label>
            <label style={{ ...inputStyle, width: 'fit-content', cursor: 'pointer' }}>📄 导入首章 Markdown<input type="file" accept=".md,.markdown,text/markdown" aria-label="导入首章 Markdown" onChange={(event) => { void importMarkdown(event.target.files?.[0], 'section'); event.currentTarget.value = ''; }} /></label>
          </div>}
        </> : <>
          <label style={labelStyle}>章节标题<input required value={section.title} onChange={(event) => sectionField('title', event.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>           <p style={{ margin: '-0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>🔗 章节网址会根据标题自动生成 Slug。</p></label>
          <label style={labelStyle}>排序<input required type="number" min="0" step="1" value={section.order} onChange={(event) => sectionField('order', Number(event.target.value))} style={inputStyle} /></label>
          <label style={labelStyle}>阅读时长<input value={section.readTime} onChange={(event) => sectionField('readTime', event.target.value)} style={inputStyle} /></label>
        </>}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{tab === 'topic' ? '专题介绍' : '章节正文'}</strong>
            <label style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>导入 Markdown<input type="file" accept=".md,.markdown,text/markdown" aria-label="导入专题 Markdown" onChange={(event) => { void importMarkdown(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
            <button type="button" onClick={() => setPreview((value) => !value)} style={{ ...inputStyle, width: 'auto' }}>{preview ? '返回编辑' : '预览渲染'}</button>
          </div>
          {preview ? <div style={{ ...inputStyle, minHeight: 230, overflow: 'auto' }}><Suspense fallback="加载预览…"><MarkdownBody content={markdown} /></Suspense></div> :
            <textarea required aria-label={tab === 'topic' ? '专题介绍' : '章节正文'} value={markdown} onChange={(event) => tab === 'topic' ? topicField('intro', event.target.value) : sectionField('content', event.target.value)} style={{ ...inputStyle, minHeight: 230, fontFamily: 'monospace' }} />}
        </div>
        {message && <p role="status" style={{ margin: 0, color: 'var(--text-body)' }}>{message}</p>}
        <button type="submit" style={{ ...inputStyle, width: 'auto', justifySelf: 'end', background: '#ff0040', color: '#fff', cursor: 'pointer' }}>{busy ? '保存中…' : tab === 'topic' ? '保存专题' : '保存章节'}</button>
      </fieldset>
    </form>
  </div>;
}
