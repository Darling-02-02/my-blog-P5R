import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleApiError } from '../lib/api';
import { articlePublisher } from '../lib/github';
import type { Article, ArticleWriteInput } from '../lib/article-types';
import ArticleEditor from './ArticleEditor';

const TOKEN_KEY = 'blog_admin_token';

const toMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) {
    if (error.status === 401) return 'Token 无效或已过期，请重新生成一个';
    if (error.status === 403) return 'Token 权限不足（需要 Contents 读写）或请求过于频繁';
    if (error.status === 404) return '找不到仓库或分支，请确认 Token 勾选了本仓库';
    if (error.status === 409) return '这个 Slug 已经存在，请换一个';
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
      setArticles(await articlePublisher.list(activeToken));
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
      setMessage('请输入 GitHub Token');
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
      await articlePublisher.save(token, input, selected?.slug);
      setSelected(undefined);
      await loadArticles(token);
      setMessage(editing ? '已提交更新，约 1 分钟后自动上线' : '已提交，约 1 分钟后自动上线');
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
      await articlePublisher.remove(token, article.slug);
      if (selected?.slug === article.slug) setSelected(undefined);
      await loadArticles(token);
      setMessage('已提交删除，约 1 分钟后自动下线');
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
            <h1 style={{ margin: 0, color: 'var(--text-heading)' }}>文章后台</h1>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)' }}>保存即提交到 GitHub 仓库，约 1 分钟后自动上线；分类直接填，新栏目会自动出现在首页</p>
          </div>
          <button type="button" onClick={() => navigate('/')} style={{ padding: '0.6rem 1rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}>
            返回网站
          </button>
        </div>

        <form onSubmit={handleTokenSubmit} style={{ ...panelStyle, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="admin-token" style={{ flex: '1 1 280px', display: 'grid', gap: '0.35rem', color: 'var(--text-body)' }}>
            GitHub Token（Fine-grained，仅本仓库 Contents 读写；只保存在当前浏览器会话）
            <input id="admin-token" type="password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} style={{ padding: '0.7rem 0.8rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-body)' }} />
          </label>
          <button type="submit" style={{ alignSelf: 'end', padding: '0.7rem 1.2rem', border: 'none', borderRadius: '8px', background: '#ff0040', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            连接后台
          </button>
        </form>

        {message && <p role="alert" style={{ ...panelStyle, color: message.includes('无效') || message.includes('失败') || message.includes('不足') ? '#b00020' : 'var(--text-body)', margin: 0 }}>{message}</p>}

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
                <div key={article.slug} style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.75rem' }}>
                  <button type="button" onClick={() => { setSelected(article); setEditorError(null); }} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer', padding: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--text-heading)' }}>{article.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{article.category} · {article.date}</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
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
