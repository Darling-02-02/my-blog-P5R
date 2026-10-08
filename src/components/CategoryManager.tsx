import { useState } from 'react';
import type { Topic } from '../data/topics';
import { categoryDirPattern, moveCategory, parseCategoryDocument, removeCategory, serializeCategoryDocument, upsertCategory } from '../lib/category-content';
import type { CategoryInput } from '../lib/category-content';
import { categoryPublisher, isCategoryConflict } from '../lib/category-publisher';

const presetColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#7c5cff', '#96ceb4', '#f39c12', '#8e44ad', '#2ecc71', '#e67e22'];

const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '0.65rem', border: '1px solid var(--border-card)', borderRadius: 6, color: 'var(--text-body)', background: 'var(--bg-card)' };
const labelStyle: React.CSSProperties = { display: 'grid', gap: '0.35rem', color: 'var(--text-body)' };
const hintStyle: React.CSSProperties = { margin: '-0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' };
const warnStyle: React.CSSProperties = { margin: '-0.35rem 0 0', color: '#b26a00', fontSize: '0.82rem' };
const smallButtonStyle: React.CSSProperties = { border: '1px solid var(--border-card)', borderRadius: 8, padding: '0.4rem 0.7rem', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' };

interface Draft {
  name: string;
  description: string;
  color: string;
  mode: 'dir' | 'plain';
  dir: string;
}

const emptyDraft = (): Draft => ({ name: '', description: '', color: presetColors[0], mode: 'dir', dir: '' });

const toDraft = (category: CategoryInput): Draft => ({
  name: category.name,
  description: category.description,
  color: category.color,
  mode: category.dir ? 'dir' : 'plain',
  dir: category.dir ?? '',
});

interface Props {
  token: string;
  /** 仓库里正在生效的栏目表（后台每次打开/保存后都重新读一遍） */
  categories: CategoryInput[];
  /** 这份表读出来时的 sha：写回要带同一个，对不上说明别的窗口已经改过，宁可报错。 */
  sha: string;
  topics: Topic[];
  /** 专题列表是否读成功；没读成功就无法判断"某栏目下没有专题"，这时不许丢 dir。 */
  topicsLoaded: boolean;
  articles: Array<{ category: string }>;
  onChanged: () => Promise<void>;
}

// 幕后栏目的增删改：整份 categories.json 一次提交，提交后由 GitHub Actions 重新构建站点。
export default function CategoryManager({ token, categories, sha, topics, topicsLoaded, articles, onChanged }: Props) {
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

  const topicCount = (name: string) => topics.filter((topic) => topic.category === name).length;
  const articleCount = (name: string) => articles.filter((article) => article.category === name).length;
  const field = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const editingCategory = categories.find((category) => category.name === editing) ?? null;
  const editingTopics = editingCategory ? topicCount(editingCategory.name) : 0;

  // 丢掉 dir 会让 src/content/topics/<dir>/ 下的专题变成"未知栏目"（首页显示英文目录名、专题列表接口报错），
  // 所以只要有文件就不许丢：要么先搬走专题，要么别动这个栏目。
  const dirDropBlocker = (category: CategoryInput | null): string | null => {
    if (!category?.dir) return null;
    const total = topicCount(category.name);
    if (total > 0) return `「${category.name}」下还有 ${total} 个专题在 src/content/topics/${category.dir}/ 里。请到「🌱 专题章节」选中栏目「${category.name}」，再用「搬到别的栏目」把它们挪到别的栏目，或「🗑 删除专题」删掉，然后回来改这个栏目。`;
    if (!topicsLoaded) return `专题列表没读成功，无法确认 src/content/topics/${category.dir}/ 下是否还有文件；请在仓库里确认该目录已删（或先修好「🌱 专题章节」的列表），再来改这个栏目。`;
    return null;
  };

  const draftInput = (): CategoryInput => ({
    name: draft.name.trim(),
    description: draft.description.trim(),
    color: draft.color.trim(),
    ...(draft.mode === 'dir' ? { dir: draft.dir.trim() } : {}),
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
      setMessage(`${note}：已提交到 GitHub，约 1 分钟后站点重建生效。`);
    } catch {
      setMessage(`${note}：已提交到 GitHub，约 1 分钟后站点重建生效（列表刷新失败了，刷新页面就能看到最新栏目表）。`);
    }
    setBusy(false);
    return true;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const next = draftInput();
    if (!next.dir) {
      const blocker = dirDropBlocker(editingCategory);
      if (blocker) { setMessage(blocker); return; }
    }
    const saved = await commit(upsertCategory(categories, next, editing), `${editing === null ? '新建' : '更新'}栏目：${next.name}`);
    if (!saved) return;
    setEditing(next.name);
    setDraft(toDraft(next));
  };

  const remove = async (category: CategoryInput) => {
    const articleTotal = articleCount(category.name);
    const blocker = dirDropBlocker(category);
    if (blocker) { setMessage(blocker); return; }
    const confirmText = [
      `确认删除栏目「${category.name}」吗？`,
      articleTotal ? `· ${articleTotal} 篇文章会退回"按分类自动生成"的同名栏目（颜色和简介会变成默认值）。` : '',
      category.dir ? `· src/content/topics/${category.dir}/ 目录保留不动（现在里面没有专题）。` : '',
      '提交后约 1 分钟站点重建生效。',
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
          首页只显示有文章或专题的栏目，这里的顺序就是首页卡片顺序。
        </p>
        {categories.length === 0 && <p style={{ margin: 0, color: 'var(--text-muted)' }}>仓库里的栏目表是空的，先点「＋ 新建栏目」加一个。</p>}
        {categories.map((category, index) => {
          const topicTotal = topicCount(category.name);
          const articleTotal = articleCount(category.name);
          const isEmpty = topicTotal === 0 && articleTotal === 0;
          return (
            <div key={category.name} style={{ borderTop: '1px solid var(--border-section)', padding: '0.7rem', borderRadius: 10, display: 'grid', gap: '0.4rem', background: editing === category.name ? 'rgba(255,0,64,0.07)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: category.color, display: 'inline-block' }} />
                <strong style={{ color: 'var(--text-heading)' }}>{category.name}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {category.dir ? `专题目录 ${category.dir}` : '按文章分类'} · {topicTotal} 专题 · {articleTotal} 文章
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => openForm(category)} style={smallButtonStyle}>✏️ 编辑</button>
                  <button type="button" disabled={busy || index === 0} onClick={() => void move(index, -1)} style={smallButtonStyle} aria-label={`把「${category.name}」上移`}>↑ 上移</button>
                  <button type="button" disabled={busy || index === categories.length - 1} onClick={() => void move(index, 1)} style={smallButtonStyle} aria-label={`把「${category.name}」下移`}>↓ 下移</button>
                  <button type="button" disabled={busy} onClick={() => void remove(category)} style={{ ...smallButtonStyle, borderColor: 'rgba(176,0,32,0.5)', color: '#b00020' }}>🗑 删除</button>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{category.description || '（还没有简介）'}</p>
              {isEmpty && <p style={warnStyle}>空栏目：先给它加一个专题或文章，首页才会显示。</p>}
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
          <p style={warnStyle}>改名后，按「{editing}」归档的文章仍会留在旧栏目名下；专题不受影响（它们跟着目录走）。</p>
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
        <fieldset style={{ border: '1px solid var(--border-card)', borderRadius: 8, padding: '0.75rem', display: 'grid', gap: '0.6rem', minWidth: 0 }}>
          <legend style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>这个栏目怎么装内容</legend>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-body)' }}>
            <input type="radio" name="category-mode" checked={draft.mode === 'dir'} onChange={() => field('mode', 'dir')} />
            用专题组织（像「机器学习」）
          </label>
          {draft.mode === 'dir' && <>
            <input
              value={draft.dir}
              required
              disabled={Boolean(editingCategory?.dir)}
              pattern={categoryDirPattern.source}
              onChange={(event) => field('dir', event.target.value)}
              style={inputStyle}
              aria-label="专题目录名"
              placeholder="仓库目录名，例如 frontend"
            />
            <p style={hintStyle}>{editingCategory?.dir ? '目录名保存后不能改：改了会让仓库里的专题文件留在老目录。' : '保存后「🌱 专题章节」的栏目下拉里就会多出这一项。'}</p>
          </>}
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-body)', opacity: editingCategory?.dir ? 0.55 : 1 }}>
            <input type="radio" name="category-mode" disabled={Boolean(editingCategory?.dir)} checked={draft.mode === 'plain'} onChange={() => field('mode', 'plain')} />
            按文章分类归档（像「生物信息」）
          </label>
          {editingCategory?.dir && <p style={hintStyle}>
            「{editingCategory.name}」现在用专题目录 {editingCategory.dir} 装内容{editingTopics ? `（${editingTopics} 个专题）` : ''}，不能改成按文章归档：
            改成不带目录后，仓库里 src/content/topics/{editingCategory.dir}/ 下的专题会变成"未知栏目"。要拆的话先搬走那些专题。
          </p>}
        </fieldset>
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
