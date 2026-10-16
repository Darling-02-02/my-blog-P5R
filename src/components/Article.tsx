import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MarkdownBody from './MarkdownBody';
import { useState, useEffect, useMemo } from 'react';
import { useArticle } from '../contexts/useArticles';
import { extractHeadings } from '../lib/heading-id';

const Article = () => {
  const params = useParams<{ '*': string }>();
  const navigate = useNavigate();
  const { article, status, error } = useArticle(params['*']);
  // 目录从 Markdown 源码推导出来，不读 DOM、也不额外 setState，所以第一帧就带着目录一起画。
  const toc = useMemo(() => extractHeadings(article?.content ?? ''), [article]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 50) {
        const pageUrl = window.location.href;
        const source = `\n\n---\n转载请注明来源：灵敏度加满の博客\n原文链接：${pageUrl}`;
        e.clipboardData?.setData('text/plain', selection.toString() + source);
        e.preventDefault();
      }
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const timer = window.setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [article]);

  // 滚动时高亮当前小节。IntersectionObserver 的回调是异步的，不算「在 effect 里同步改状态」。
  // 只有落在「视口顶部往下 15% 到往上 70%」这条带子里的标题算正在读，取最靠上的那个，
  // 这样滚动时高亮不会在两个标题之间来回抖。
  useEffect(() => {
    const headings = toc
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (headings.length === 0) return undefined;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        });
        const current = headings.find((node) => visible.has(node.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );

    headings.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [toc]);

  // 目录点击：滚到标题上。页头是 fixed 的，让开多少交给 index.css 的 scroll-margin-top，别在这里量高度。
  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    setActiveId(id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', color: 'var(--text-muted)' }} role="status">
        正在加载文章…
      </div>
    );
  }

  if (status === 'error' && !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--accent)', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>文章加载失败</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error ?? '请稍后重试'}</p>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ padding: '0.8rem 1.5rem', background: 'var(--accent-fill)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 }}
          >
            重新加载
          </motion.button>
        </div>
      </div>
    );
  }
  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'var(--bg-card)',
            padding: '3rem',
            borderRadius: 'var(--radius-card)',
            border: '2px solid var(--accent)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '2rem' }}>
            文章未找到
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            你在寻找的文章可能已被删除或不存在
          </p>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '1rem 2rem',
              background: 'var(--accent-fill)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '700',
            }}
          >
            返回首页
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="article-shell"
      style={{
        minHeight: '100vh',
        /* 顶上不留 padinng：文章页本来就没有固定页头（这一页不渲染 Header），
           那 5rem 是给一个不存在的栏让位的，只会把标题卡从顶边推开一段空白。
           卡片现在从 y=0 起，返回键叠在卡片左上角。 */
        padding: '0 2rem 4rem',
      }}
    >
      <div className="article-container" style={{
        maxWidth: '1160px',
        margin: '0 auto',
      }}>
        <motion.button
          className="article-back"
          onClick={() => navigate('/#blog')}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -5 }}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-card)',
            color: 'var(--text-link)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ← 返回幕后
        </motion.button>

        {status === 'error' && error && (
          <p role="alert" style={{ color: 'var(--text-danger)', marginBottom: '1rem' }}>文章 API 暂不可用，当前显示本地内容：{error}</p>
        )}

        <motion.header
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="article-header"
          style={{
            marginBottom: '3rem',
            textAlign: 'center',
            /* 标题栏自己一块黑布（跟顶栏是同一族的做法）：半透明黑 + 模糊，背后的插画化成一片暗影。
               布是黑的，所以这里面的字一律自己配浅色——不能再用跟主题走的墨色令牌，
               浅色主题的 --text-primary 是 #1a1a1a，压在这块布上等于看不见。 */
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-card)',
            padding: '2.4rem 1.5rem 2rem',
          }}
        >
          <div style={{
            display: 'inline-block',
            /* 深红压黑布发闷，黑底上换品牌亮红（跟 logo 同一个红） */
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.4rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            borderRadius: 'var(--radius-card)',
          }}>
            {article.category}
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            lineHeight: 1.3,
            color: '#fff',
          }}>
            {article.title}
          </h1>
          
          <div className="article-meta" style={{
            display: 'flex',
            gap: '1.5rem',
            color: 'rgba(255, 255, 255, 0.78)',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <span>📅 {article.date}</span>
            <span>⏱️ {article.readTime}</span>
          </div>
        </motion.header>

        {toc.length > 0 && (
          <nav className="article-toc" aria-label="文章目录">
            <p style={{
              margin: '0 0 0.7rem',
              fontSize: '0.9rem',
              fontWeight: '700',
              color: 'var(--text-heading)',
            }}>
              目录
            </p>
            <ol style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {toc.map((item) => (
                <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.9rem' : 0 }}>
                  <button
                    type="button"
                    className={`article-toc-link${activeId === item.id ? ' is-active' : ''}`}
                    aria-current={activeId === item.id ? 'location' : undefined}
                    onClick={() => jumpTo(item.id)}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="article-content-card article-body"
          style={{
            background: 'var(--bg-article-content)',
            borderRadius: 'var(--radius-card)',
            padding: '3rem',
            color: 'var(--text-body)',
            border: '1px solid var(--border-card)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <MarkdownBody content={article.content} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="article-tags"
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {article.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'var(--bg-tag)',
                border: '1px solid var(--border-tag)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                color: 'var(--text-link)',
              }}
            >
              #{tag}
            </span>
          ))}
        </motion.div>
      </div>

      <style>{`
        /* 左边一栏目录、右边一栏正文：返回键、错误提示、标题头横跨两栏，
           所以标题的居中是对整页居中，而不是对右栏居中。 */
        .article-container {
          position: relative;
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          column-gap: 2rem;
          align-items: start;
        }

        .article-header,
        .article-container > [role='alert'] {
          grid-column: 1 / -1;
        }

        /* 返回键不再自己占一行，改成叠在标题卡左上角——卡片上沿因此能顶到页头下沿，
           把原来那条空白整个盖掉。absolute 不参与 grid 排布，所以标题卡升成了第一行。 */
        .article-back {
          position: absolute;
          top: 1.1rem;
          left: 1.1rem;
          z-index: 2;
        }

        .article-toc,
        .article-content-card,
        .article-tags {
          grid-column: 2;
        }

        .article-toc {
          grid-column: 1;
          position: sticky;
          top: 5.5rem;
          padding: 1.1rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: var(--radius-card);
          font-size: 0.85rem;
        }

        .article-toc-link {
          display: block;
          width: 100%;
          padding: 0;
          background: none;
          border: 0;
          font: inherit;
          text-align: left;
          color: var(--text-muted);
          line-height: 1.5;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .article-toc-link:hover {
          color: var(--text-link);
        }

        .article-toc-link.is-active {
          color: var(--accent);
          font-weight: 600;
        }

        @media (max-width: 1100px) {
          .article-container {
            display: block !important;
          }

          .article-toc {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .article-shell {
            padding: 0 1rem 2.4rem !important;
          }

          .article-header {
            margin-bottom: 2rem !important;
          }

          .article-meta {
            gap: 0.8rem !important;
            font-size: 0.82rem !important;
          }

          .article-content-card {
            padding: 1.35rem !important;
            border-radius: var(--radius-card) !important;
          }
        }

        @media (max-width: 560px) {
          .article-shell {
            padding: 0 0.75rem 2rem !important;
          }

          .article-content-card {
            padding: 1rem !important;
          }

          .article-tags {
            gap: 0.35rem !important;
          }
        }
      `}</style>
    </motion.article>
  );
};

export default Article;
