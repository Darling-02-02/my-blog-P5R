import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleApiError } from '../lib/api';
import { activeArticleSource } from '../lib/article-source';
import type { Article } from '../../backend/src/articles/article.types';
import type { ArticleWriteInput } from '../lib/article-form';
import ArticleEditor from './ArticleEditor';
import TopicEditor from './TopicEditor';
import type { Topic } from '../data/topics';
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
  const [adminMode, setAdminMode] = useState<'articles' | 'topics'>(activeArticleSource.kind === 'github' ? 'topics' : 'articles');
  const [selected, setSelected] = useState<Article | undefined>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  const clearAdminSession = useCallback((nextMessage = '已退出后台，当前会话 Token 已清除') => {
    sessionStorage.removeItem(TOKEN_KEY);
    setTokenInput('');
    setToken('');
    setArticles([]);
    setTopics([]);
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
      setTopics(await topicPublisher.list(activeToken));
    } catch (error) {
      setMessage(toMessage(error));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void loadArticles(token);
      void loadTopics(token);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles, loadTopics, token]);

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
    background: 'var(--bg-card)',
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
          <button type="button" onClick={() => navigate('/')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
            返回网站
          </button>
        </div>

        <form onSubmit={handleTokenSubmit} style={{ ...panelStyle, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="admin-token" style={{ flex: '1 1 280px', display: 'grid', gap: '0.35rem', color: 'var(--text-body)' }}>
            {activeArticleSource.tokenLabel}
            <input id="admin-token" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} style={{ padding: '0.7rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-body)' }} />
          </label>
          <button type="submit" style={{ alignSelf: 'end', padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            连接后台
          </button>
        </form>

        {message && <p role="alert" style={{ ...panelStyle, color: message.includes('无效') || message.includes('失败') || message.includes('不足') ? '#b00020' : 'var(--text-body)', margin: 0 }}>{message}</p>}

        {token && <div role="tablist" aria-label="内容管理" style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" role="tab" aria-selected={adminMode === 'articles'} onClick={() => setAdminMode('articles')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', background: adminMode === 'articles' ? '#ff0040' : 'var(--bg-card)', color: adminMode === 'articles' ? '#fff' : 'var(--text-body)' }}>📄 独立文章</button>
          <button type="button" role="tab" aria-selected={adminMode === 'topics'} onClick={() => setAdminMode('topics')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', background: adminMode === 'topics' ? '#ff0040' : 'var(--bg-card)', color: adminMode === 'topics' ? '#fff' : 'var(--text-body)' }}>🌱 专题章节</button>
        </div>}
        {token && adminMode === 'topics' && <div style={panelStyle}>
          {activeArticleSource.kind === 'github' ? <TopicEditor token={token} topics={topics} refresh={() => loadTopics(token)} /> :
            <p role="status" style={{ color: 'var(--text-body)' }}>当前后端数据库仅支持文章；专题仍由仓库 Markdown 构建。请使用 GitHub 模式管理专题，数据库专题接口尚未接入。</p>}
        </div>}
        {token && adminMode === 'articles' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(0, 1.6fr)', gap: '1rem', alignItems: 'start' }}>
            <div style={{ ...panelStyle, display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>文章列表</h2>
                <button type="button" onClick={() => { setSelected(undefined); setEditorError(null); }} style={{ border: 'none', borderRadius: '6px', padding: '0.35rem 0.6rem', background: 'rgba(255,0,64,0.1)', color: '#ff0040', cursor: 'pointer' }}>
                  新建
                </button>
              </div>
              <button type="button" onClick={() => clearAdminSession()} style={{ alignSelf: 'start', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '0.35rem 0.6rem', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>退出后台</button>
              {loading && <p role="status" style={{ color: 'var(--text-muted)' }}>加载中…</p>}
              {!loading && articles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>这里还没有独立文章哦～专题章节请切换到上面的「🌱 专题章节」管理。</p>}
              {articles.map((article) => (
                <div key={article.slug} style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.75rem' }}>
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
                      <button type="button" disabled={busy} onClick={() => void handleSetPublished(article, article.status !== 'published')} style={{ border: '1px solid #1a7f37', borderRadius: '6px', padding: '0.3rem 0.55rem', background: 'transparent', color: '#1a7f37', cursor: 'pointer' }}>
                        {article.status === 'published' ? '下架' : '发布'}
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void handleDelete(article)} style={{ border: '1px solid #b00020', borderRadius: '6px', padding: '0.3rem 0.55rem', background: 'transparent', color: '#b00020', cursor: 'pointer' }}>删除</button>
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
