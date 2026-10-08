import { useState } from 'react';
import { moveCategory, parseCategoryDocument, removeCategory, serializeCategoryDocument, upsertCategory } from '../lib/category-content';
import type { CategoryInput } from '../lib/category-content';
import { categoryPublisher, isCategoryConflict } from '../lib/category-publisher';

const presetColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#7c5cff', '#96ceb4', '#f39c12', '#8e44ad', '#2ecc71', '#e67e22'];

const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '0.65rem', border: '1px solid var(--border-card)', borderRadius: 6, color: 'var(--text-body)', background: 'var(--bg-card)' };
const labelStyle: React.CSSProperties = { display: 'grid', gap: '0.35rem', color: 'var(--text-body)' };
const warnStyle: React.CSSProperties = { margin: '-0.35rem 0 0', color: '#b26a00', fontSize: '0.82rem' };
const smallButtonStyle: React.CSSProperties = { border: '1px solid var(--border-card)', borderRadius: 8, padding: '0.4rem 0.7rem', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' };

interface Draft {
  name: string;
  description: string;
  color: string;
}

const emptyDraft = (): Draft => ({ name: '', description: '', color: presetColors[0] });

const toDraft = (category: CategoryInput): Draft => ({
  name: category.name,
  description: category.description,
  color: category.color,
});

interface Props {
  token: string;
  /** 仓库里正在生效的栏目表（后台每次打开/保存后都重新读一遍） */
  categories: CategoryInput[];
  /** 这份表读出来时的 sha：写回要带同一个，对不上说明别的窗口已经改过，宁可报错。 */
  sha: string;
  articles: Array<{ category: string }>;
  onChanged: () => Promise<void>;
}

// 幕后栏目的增删改：整份 categories.json 一次提交，提交后由 GitHub Actions 重新构建站点。
export default function CategoryManager({ token, categories, sha, articles, onChanged }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // 表单默认收起来：右边先给一句"怎么改"，别让"新建栏目"和"编辑栏目"看起来像同一件事。
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const openForm = (category: CategoryInput | null) => {
    setEditing(category?.name ?? null);
    setDraft(category ? toDraft(category) : emptyDraft());
    setMessage('');
    setFormOpen(true);
  };

  const articleCount = (name: string) => articles.filter((article) => article.category === name).length;
  const field = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const draftInput = (): CategoryInput => ({
    name: draft.name.trim(),
    description: draft.description.trim(),
    color: draft.color.trim(),
  });

  const commit = async (list: CategoryInput[], note: string): Promise<boolean> => {
    setBusy(true);
    setMessage('');
    try {
      // 用发布器同一套解析校验候选表，后台不再重复实现一份规则。
      await categoryPublisher.save(token, parseCategoryDocument(serializeCategoryDocument(list)), sha, note);
    } catch (error) {
      setBusy(false);
      // 并发冲突：仓库里的表比手里这份新。读回最新表（sha 随之更新），再让用户点一次，
      // 不然这句"已经被改过"就是个死胡同——用户会一遍遍点，一遍遍失败。
      if (isCategoryConflict(error)) {
        try {
          await onChanged();
          setMessage('仓库里的栏目表刚被别的窗口改过，已经读回最新内容，请再点一次刚才的操作。');
        } catch {
          setMessage('仓库里的栏目表刚被别的窗口改过，重新读取也失败了，按 F5 刷新页面后再试。');
        }
        return false;
      }
      setMessage(error instanceof Error ? error.message : '保存失败');
      return false;
    }
    // 提交已经落地了，后面刷列表失败不能再报成"保存失败"。
    try {
      await onChanged();
      setMessage(`${note}：已提交到 GitHub，约 1 分钟后站点重建生效（连着改很多次时，以最后一次为准）。`);
    } catch {
      setMessage(`${note}：已提交到 GitHub，约 1 分钟后站点重建生效（连着改很多次时，以最后一次为准。列表刷新失败了，刷新页面就能看到最新栏目表）。`);
    }
    setBusy(false);
    return true;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const next = draftInput();
    const saved = await commit(upsertCategory(categories, next, editing), `${editing === null ? '新建' : '更新'}栏目：${next.name}`);
    if (!saved) return;
    setEditing(next.name);
    setDraft(toDraft(next));
  };

  const remove = async (category: CategoryInput) => {
    const articleTotal = articleCount(category.name);
    const confirmText = [
      `确认删除栏目「${category.name}」吗？`,
      articleTotal ? `· ${articleTotal} 篇文章会退回"按分类自动生成"的同名栏目（颜色和简介会变成默认值）。` : '',
      '提交后约 1 分钟站点重建生效（连续提交以最后一次为准）。',
    ].filter(Boolean).join('\n');
    if (!window.confirm(confirmText)) return;
    const saved = await commit(removeCategory(categories, category.name), `删除栏目：${category.name}`);
    if (saved && editing === category.name) {
      setEditing(null);
      setDraft(emptyDraft());
      setFormOpen(false);
    }
  };

  const move = async (index: number, delta: number) => {
    const list = moveCategory(categories, index, delta);
    if (list === categories) return;
    await commit(list, '调整栏目顺序');
  };

  return (
    <div className={formOpen ? 'admin-cols' : undefined}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>幕后栏目（{categories.length}）</h2>
          <button type="button" onClick={() => openForm(null)} style={{ border: 'none', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#ff0040', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>＋ 新建栏目</button>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          栏目决定首页卡片和 /category/&lt;栏目名&gt; 页面，这里的顺序就是首页卡片顺序；还没有文章的栏目也会显示。
        </p>
        {categories.length === 0 && <p style={{ margin: 0, color: 'var(--text-muted)' }}>仓库里的栏目表是空的，先点「＋ 新建栏目」加一个。</p>}
        {categories.map((category, index) => {
          const articleTotal = articleCount(category.name);
          return (
            <div key={category.name} style={{ borderTop: '1px solid var(--border-section)', padding: '0.7rem', borderRadius: 10, display: 'grid', gap: '0.4rem', background: editing === category.name ? 'rgba(255,0,64,0.07)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: category.color, display: 'inline-block' }} />
                <strong style={{ color: 'var(--text-heading)' }}>{category.name}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {articleTotal} 篇文章
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => openForm(category)} style={smallButtonStyle}>✏️ 编辑</button>
                  <button type="button" disabled={busy || index === 0} onClick={() => void move(index, -1)} style={smallButtonStyle} aria-label={`把「${category.name}」上移`}>↑ 上移</button>
                  <button type="button" disabled={busy || index === categories.length - 1} onClick={() => void move(index, 1)} style={smallButtonStyle} aria-label={`把「${category.name}」下移`}>↓ 下移</button>
                  <button type="button" disabled={busy} onClick={() => void remove(category)} style={{ ...smallButtonStyle, borderColor: 'rgba(176,0,32,0.5)', color: '#b00020' }}>🗑 删除</button>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{category.description || '（还没有简介）'}</p>
              {articleTotal === 0 && <p style={warnStyle}>空栏目：还没有文章，首页卡片会显示「还没有内容」。</p>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
      {formOpen && <form onSubmit={(event) => { void submit(event); }} style={{ display: 'grid', gap: '0.85rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-heading)' }}>{editing === null ? '新建栏目' : `编辑栏目：${editing}`}</h3>
        <label style={labelStyle}>栏目名称
          <input required value={draft.name} onChange={(event) => field('name', event.target.value)} style={inputStyle} placeholder="例如：前端" />
        </label>
        {editing !== null && draft.name.trim() !== editing && (
          <p style={warnStyle}>改名后，原来按「{editing}」归档的文章还留在旧栏目名下（文章的分类写在各自的 Markdown 里），要挨个改成新栏目名。</p>
        )}
        <label style={labelStyle}>一句话简介
          <textarea value={draft.description} onChange={(event) => field('description', event.target.value)} style={inputStyle} placeholder="会显示在首页卡片上" />
        </label>
        <div style={labelStyle}>卡片颜色
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {presetColors.map((color) => (
              <button key={color} type="button" aria-label={`使用颜色 ${color}`} onClick={() => field('color', color)} style={{ width: 26, height: 26, borderRadius: '50%', background: color, border: draft.color.toLowerCase() === color ? '2px solid var(--text-heading)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
            <input value={draft.color} onChange={(event) => field('color', event.target.value)} style={{ ...inputStyle, width: '8rem' }} aria-label="颜色值" placeholder="#ff6b6b" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy} style={{ ...inputStyle, width: 'auto', border: 0, background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{busy ? '提交中…' : editing === null ? '新建栏目' : '保存修改'}</button>
          <button type="button" disabled={busy} onClick={() => { setEditing(null); setDraft(emptyDraft()); setFormOpen(false); }} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>取消</button>
        </div>
      </form>}
      {message && <p role="status" style={{ margin: 0, color: 'var(--text-body)' }}>{message}</p>}
      </div>
    </div>
  );
}
