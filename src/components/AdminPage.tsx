import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleApiError } from '../lib/api';
import { activeArticleSource } from '../lib/article-source';
import type { Article } from '../../backend/src/articles/article.types';
import type { ArticleWriteInput } from '../lib/article-form';
import ArticleEditor from './ArticleEditor';
import CategoryManager from './CategoryManager';
import TopicEditor from './TopicEditor';
import type { Topic } from '../data/topics';
import { topicDirectoriesFrom } from '../lib/category-content';
import type { CategoryInput } from '../lib/category-content';
import { categoryPublisher } from '../lib/category-publisher';
import { topicPublisher } from '../lib/topic-publisher';

const TOKEN_KEY = 'blog_admin_token';

const toMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) {
    if (error.status === 401) {
      return activeArticleSource.kind === 'api'
        ? '后端管理令牌不正确，请核对服务器上的 ADMIN_TOKEN'
        : 'Token 无效或已过期，请重新生成一个';
    }
    if (error.status === 403) {
      return activeArticleSource.kind === 'api'
        ? '后端拒绝了这个来源（检查 CORS_ORIGIN 是否包含当前站点域名）'
        : 'Token 权限不足（需要 Contents 读写）或请求过于频繁';
    }
    if (error.status === 404) {
      return activeArticleSource.kind === 'api'
        ? '后端找不到这篇文章，可能已被删除'
        : '找不到仓库或分支，请确认 Token 勾选了本仓库';
    }
    if (error.status === 409) return '这个 Slug 已经存在，请换一个';
    if (error.status === 0) return '连不上后端接口（检查 VITE_API_BASE_URL 与 HTTPS/CORS）';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return '请求失败，请稍后重试';
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryInput[] | null>(null);
  const [categorySha, setCategorySha] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [adminMode, setAdminMode] = useState<'articles' | 'topics' | 'categories'>(activeArticleSource.kind === 'github' ? 'topics' : 'articles');
  const [selected, setSelected] = useState<Article | undefined>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  // 专题列表和发布都按"仓库里正在生效"的栏目表解析目录（见 topic-publisher 的 directories 参数），
  // 否则刚新建的栏目要等一次站点重建才能发专题。用 ref 是为了让 loadTopics 的依赖保持为空，
  // 不然 loadCategories 每次写入新数组都会让本 effect 重跑，形成"读完再读"的循环。
  const liveDirs = useRef<Record<string, string> | undefined>(undefined);

  const clearAdminSession = useCallback((nextMessage = '已退出后台，当前会话 Token 已清除') => {
    sessionStorage.removeItem(TOKEN_KEY);
    setTokenInput('');
    setToken('');
    setArticles([]);
    setTopics([]);
    setTopicsLoaded(false);
    liveDirs.current = undefined;
    setCategoryList(null);
    setCategorySha('');
    setCategoryError(null);
    setSelected(undefined);
    setEditorError(null);
    setMessage(nextMessage);
  }, []);

  const loadArticles = useCallback(async (activeToken: string) => {
    if (!activeToken) return;
    setLoading(true);
    setMessage(null);
    try {
      setArticles(await activeArticleSource.list(activeToken));
    } catch (error) {
      if (error instanceof ArticleApiError && (error.status === 401 || error.status === 403)) {
        clearAdminSession('Token 已失效或权限不足，已清除当前会话。');
        return;
      }
      setMessage(toMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clearAdminSession]);

  const loadTopics = useCallback(async (activeToken: string) => {
    if (activeArticleSource.kind !== 'github') return;
    try {
      setTopics(await topicPublisher.list(activeToken, liveDirs.current));
      setTopicsLoaded(true);
    } catch (error) {
      setTopicsLoaded(false);
      setMessage(toMessage(error));
    }
  }, []);

  // 读仓库里"正在生效"的栏目表：后台列表和专题下拉都以它为准，构建期那份只是站点渲染用的快照。
  const loadCategories = useCallback(async (activeToken: string) => {
    if (activeArticleSource.kind !== 'github') return;
    try {
      const snapshot = await categoryPublisher.load(activeToken);
      liveDirs.current = topicDirectoriesFrom(snapshot.categories);
      setCategoryList(snapshot.categories);
      setCategorySha(snapshot.sha);
      setCategoryError(null);
    } catch (error) {
      liveDirs.current = undefined;
      setCategoryList(null);
      setCategorySha('');
      setCategoryError(
        error instanceof ArticleApiError && (error.status === 401 || error.status === 403)
          ? toMessage(error)
          : error instanceof Error ? error.message : '栏目表读取失败',
      );
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void loadArticles(token);
      void loadTopics(token);
      void loadCategories(token);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles, loadCategories, loadTopics, token]);

  const handleTokenSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      setMessage(activeArticleSource.kind === 'api' ? '请输入后端管理令牌' : '请输入 GitHub Token');
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setMessage(null);
  };

  const handleSave = async (input: ArticleWriteInput) => {
    if (!token) return;
    const editing = Boolean(selected);
    setBusy(true);
    setEditorError(null);
    try {
      await activeArticleSource.save(token, input, selected);
      setSelected(undefined);
      await loadArticles(token);
      if (editing) {
        setMessage('已更新');
      } else if (activeArticleSource.supportsDraft) {
        setMessage('已保存为草稿，点「发布」后才会出现在公开接口里');
      } else {
        setMessage('已提交，约 1 分钟后自动上线');
      }
    } catch (error) {
      setEditorError(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (!token || !window.confirm(`确认删除“${article.title}”吗？`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await activeArticleSource.remove(token, article);
      if (selected?.slug === article.slug) setSelected(undefined);
      await loadArticles(token);
      setMessage(activeArticleSource.kind === 'api' ? '已删除' : '已提交删除，约 1 分钟后自动下线');
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSetPublished = async (article: Article, published: boolean) => {
    if (!token || !activeArticleSource.setPublished) return;
    setBusy(true);
    setMessage(null);
    try {
      await activeArticleSource.setPublished(token, article, published);
      await loadArticles(token);
      setMessage(published ? '已发布，公开接口现在能读到它' : '已下架为草稿，公开接口不再返回它');
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const panelStyle = {
    // 后台要读文字、要长时间打字：用不透明的卡片底色 + 和文章卡一样的背景模糊，
    // 别让墙纸插画透上来干扰（--bg-card 在半透明主题下只有 0.48）。
    background: 'var(--bg-article-content)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border-card)',
    borderRadius: '14px',
    padding: '1.25rem',
  };

  const categories = [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b, 'zh-CN'));

  return (
    <section style={{ minHeight: '100vh', padding: '6rem 1rem 3rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-heading)' }}>📝 内容小后台</h1>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)' }}>{activeArticleSource.panelHint}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {token && <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', borderRadius: '999px', border: '1px solid var(--border-card)', color: '#1a7f37' }}>已连接</span>}
            {token && <button type="button" onClick={() => clearAdminSession()} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>退出后台</button>}
            <button type="button" onClick={() => navigate('/')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
              返回网站
            </button>
          </div>
        </div>

        {!token && <form onSubmit={handleTokenSubmit} style={{ ...panelStyle, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="admin-token" style={{ flex: '1 1 280px', display: 'grid', gap: '0.35rem', color: 'var(--text-body)' }}>
            {activeArticleSource.tokenLabel}
            <input id="admin-token" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} style={{ padding: '0.7rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-body)' }} />
          </label>
          <button type="submit" style={{ alignSelf: 'end', padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            连接后台
          </button>
        </form>}

        {message && <p role="alert" style={{ ...panelStyle, color: message.includes('无效') || message.includes('失败') || message.includes('不足') ? '#b00020' : 'var(--text-body)', margin: 0 }}>{message}</p>}

        <style>{`
          .admin-tabs{display:flex;gap:.5rem;flex-wrap:wrap;background:var(--bg-article-content);border:1px solid var(--border-card);border-radius:14px;padding:.6rem;backdrop-filter:blur(10px)}
          .admin-tab{padding:.6rem 1.1rem;border:1px solid var(--border-card);border-radius:10px;background:var(--bg-card);color:var(--text-body);cursor:pointer;font:inherit}
          .admin-tab[data-active]{background:#ff0040;border-color:#ff0040;color:#fff;font-weight:700}
          .admin-grid{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.6fr);gap:1rem;align-items:flex-start}
          .admin-cols{display:grid;grid-template-columns:minmax(260px,1fr) minmax(0,1.2fr);gap:1.25rem;align-items:flex-start}
          @media (max-width:900px){.admin-grid,.admin-cols{grid-template-columns:minmax(0,1fr)}}
        `}</style>

        {token && <div role="tablist" aria-label="内容管理" className="admin-tabs">
          {([['articles', `📄 独立文章（${articles.length}）`], ['topics', `🌱 专题章节（${topics.length}）`], ['categories', `🗂 幕后栏目（${categoryList?.length ?? 0}）`]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={adminMode === id} onClick={() => setAdminMode(id)} className="admin-tab" data-active={adminMode === id ? 'true' : undefined}>{label}</button>
          ))}
        </div>}
        {token && adminMode === 'categories' && <div style={panelStyle}>
          {activeArticleSource.kind === 'github' ? (
            categoryList ? (
              <CategoryManager
                token={token}
                categories={categoryList}
                sha={categorySha}
                topics={topics}
                topicsLoaded={topicsLoaded}
                articles={articles}
                onChanged={() => loadCategories(token)}
              />
            ) : (
              <div style={{ display: 'grid', gap: '0.6rem', justifyItems: 'start' }}>
                <p role="status" style={{ margin: 0, color: 'var(--text-body)' }}>{categoryError ?? '正在读取仓库里的栏目表…'}</p>
                {categoryError && <button type="button" onClick={() => void loadCategories(token)} style={{ border: '1px solid var(--border-card)', borderRadius: 6, padding: '0.35rem 0.7rem', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>重新读取</button>}
              </div>
            )
          ) : (
            <p role="status" style={{ margin: 0, color: 'var(--text-body)' }}>当前后端数据库只存文章；幕后栏目表放在仓库里，请用 GitHub 模式管理。</p>
          )}
        </div>}
        {token && adminMode === 'topics' && <div style={panelStyle}>
          {activeArticleSource.kind === 'github' ? <TopicEditor token={token} topics={topics} refresh={() => loadTopics(token)} directories={categoryList ? topicDirectoriesFrom(categoryList) : undefined} /> :
            <p role="status" style={{ color: 'var(--text-body)' }}>当前后端数据库仅支持文章；专题仍由仓库 Markdown 构建。请使用 GitHub 模式管理专题，数据库专题接口尚未接入。</p>}
        </div>}
        {token && adminMode === 'articles' && (
          <div className="admin-grid">
            <div style={{ ...panelStyle, display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>文章列表</h2>
                <button type="button" onClick={() => { setSelected(undefined); setEditorError(null); }} style={{ border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', background: '#ff0040', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  ＋ 新建文章
                </button>
              </div>
              {loading && <p role="status" style={{ color: 'var(--text-muted)' }}>加载中…</p>}
              {!loading && articles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>这里还没有独立文章哦～专题章节请切换到上面的「🌱 专题章节」管理。</p>}
              {articles.map((article) => (
                <div key={article.slug} style={{ borderTop: '1px solid var(--border-section)', padding: '0.7rem', borderRadius: 10, background: selected?.slug === article.slug ? 'rgba(255,0,64,0.07)' : 'transparent' }}>
                  <button type="button" onClick={() => { setSelected(article); setEditorError(null); }} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer', padding: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{article.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{article.category} · {article.date}</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {activeArticleSource.supportsDraft && (
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid var(--border-card)', color: article.status === 'published' ? '#1a7f37' : 'var(--text-muted)' }}>
                        {article.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    )}
                    {activeArticleSource.setPublished && (
                      <button type="button" disabled={busy} onClick={() => void handleSetPublished(article, article.status !== 'published')} style={{ border: '1px solid #1a7f37', borderRadius: '8px', padding: '0.4rem 0.7rem', background: 'transparent', color: '#1a7f37', cursor: 'pointer' }}>
                        {article.status === 'published' ? '下架' : '发布'}
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void handleDelete(article)} style={{ border: '1px solid #b00020', borderRadius: '8px', padding: '0.4rem 0.7rem', background: 'transparent', color: '#b00020', cursor: 'pointer' }}>🗑 删除</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>{selected ? '编辑文章' : '新建文章'}</h2>
              <ArticleEditor key={selected?.slug ?? 'new'} initialArticle={selected} categories={categories} busy={busy} error={editorError} onSave={handleSave} onCancel={() => { setSelected(undefined); setEditorError(null); }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
