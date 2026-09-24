import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleApiError, articleApi } from '../lib/api';
import type { Article, ArticleWriteInput } from '../lib/article-types';
import ArticleEditor from './ArticleEditor';

const TOKEN_KEY = 'blog_admin_token';

const toMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) {
    if (error.status === 401) return '管理密钥无效或未提供';
    if (error.status === 403) return '当前密钥没有管理权限';
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
  const [selected, setSelected] = useState<Article | undefined>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadArticles = useCallback(async (activeToken: string) => {
    if (!activeToken) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await articleApi.listAdmin(activeToken);
      setArticles(response.items);
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void loadArticles(token);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles, token]);

  const handleTokenSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      setMessage('请输入管理密钥');
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setMessage(null);
  };

  const handleSave = async (input: ArticleWriteInput) => {
    if (!token) return;
    setBusy(true);
    setEditorError(null);
    try {
      if (selected) {
        await articleApi.update(token, selected.id, input);
      } else {
        await articleApi.create(token, input);
      }
      setSelected(undefined);
      await loadArticles(token);
      setMessage('文章已保存');
    } catch (error) {
      setEditorError(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (article: Article) => {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await articleApi.publish(token, article.id);
      await loadArticles(token);
      setMessage('文章已发布');
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async (article: Article) => {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      await articleApi.unpublish(token, article.id);
      await loadArticles(token);
      setMessage('文章已下线');
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (!token || !window.confirm(`确认删除“${article.title}”吗？`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await articleApi.remove(token, article.id);
      if (selected?.id === article.id) setSelected(undefined);
      await loadArticles(token);
      setMessage('文章已删除');
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

  return (
    <section style={{ minHeight: '100vh', padding: '6rem 1rem 3rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-heading)' }}>文章后台</h1>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)' }}>管理草稿、发布状态和文章内容</p>
          </div>
          <button type="button" onClick={() => navigate('/')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
            返回网站
          </button>
        </div>

        <form onSubmit={handleTokenSubmit} style={{ ...panelStyle, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="admin-token" style={{ flex: '1 1 280px', display: 'grid', gap: '0.35rem', color: 'var(--text-body)' }}>
            管理密钥（仅保存在当前浏览器会话）
            <input id="admin-token" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} style={{ padding: '0.7rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-body)' }} />
          </label>
          <button type="submit" style={{ alignSelf: 'end', padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            连接后台
          </button>
        </form>

        {message && <p role="alert" style={{ ...panelStyle, color: message.includes('无效') || message.includes('失败') ? '#b00020' : 'var(--text-body)', margin: 0 }}>{message}</p>}

        {token && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.8fr) minmax(0, 1.6fr)', gap: '1rem', alignItems: 'start' }}>
            <div style={{ ...panelStyle, display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>文章列表</h2>
                <button type="button" onClick={() => { setSelected(undefined); setEditorError(null); }} style={{ border: 'none', borderRadius: '6px', padding: '0.35rem 0.6rem', background: 'rgba(255,0,64,0.1)', color: '#ff0040', cursor: 'pointer' }}>
                  新建
                </button>
              </div>
              {loading && <p role="status" style={{ color: 'var(--text-muted)' }}>加载中…</p>}
              {!loading && articles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>暂无文章</p>}
              {articles.map((article) => (
                <div key={article.id} style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.75rem' }}>
                  <button type="button" onClick={() => { setSelected(article); setEditorError(null); }} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer', padding: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{article.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{article.status === 'published' ? '已发布' : '草稿'} · {article.category}</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {article.status === 'published' ? (
                      <button type="button" disabled={busy} onClick={() => void handleUnpublish(article)} style={{ border: '1px solid var(--border-card)', borderRadius: '6px', padding: '0.3rem 0.55rem', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>下线</button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => void handlePublish(article)} style={{ border: 'none', borderRadius: '6px', padding: '0.3rem 0.55rem', background: '#ff0040', color: '#fff', cursor: 'pointer' }}>发布</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void handleDelete(article)} style={{ border: '1px solid #b00020', borderRadius: '6px', padding: '0.3rem 0.55rem', background: 'transparent', color: '#b00020', cursor: 'pointer' }}>删除</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={panelStyle}>
              <h2 style={{ marginTop: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>{selected ? '编辑文章' : '新建文章'}</h2>
              <ArticleEditor key={selected?.id ?? 'new'} initialArticle={selected} busy={busy} error={editorError} onSave={handleSave} onCancel={() => { setSelected(undefined); setEditorError(null); }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPage;
