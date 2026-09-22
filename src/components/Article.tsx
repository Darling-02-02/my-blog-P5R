import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { findArticle } from '../data/articles';
import MarkdownBody from './MarkdownBody';
import { useState, useEffect } from 'react';

const Article = () => {
  const params = useParams<{ '*': string }>();
  const navigate = useNavigate();
  const article = findArticle(params['*']);
  const [readingProgress, setReadingProgress] = useState(0);

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
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setReadingProgress(0);
        return;
      }

      const nextProgress = (window.scrollY / scrollableHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, nextProgress)));
    };

    updateReadingProgress();
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('resize', updateReadingProgress);

    return () => {
      window.removeEventListener('scroll', updateReadingProgress);
      window.removeEventListener('resize', updateReadingProgress);
    };
  }, []);

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
            borderRadius: '10px',
            border: '2px solid #ff0040',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: '#ff0040', marginBottom: '1rem', fontSize: '2rem' }}>
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
              background: '#ff0040',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
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
        padding: '5rem 2rem 4rem',
      }}
    >
      <div className="article-container" style={{
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <motion.button
          onClick={() => navigate('/')}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -5 }}
          style={{
            marginBottom: '2rem',
            padding: '0.6rem 1.2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '20px',
            color: '#ff0040',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ← 返回
        </motion.button>

        <motion.header
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="article-header"
          style={{
            marginBottom: '3rem',
          }}
        >
          <div style={{
            display: 'inline-block',
            background: '#ff0040',
            color: '#fff',
            padding: '0.4rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            borderRadius: '20px',
          }}>
            {article.category}
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            lineHeight: 1.3,
            color: 'var(--text-primary)',
          }}>
            {article.title}
          </h1>
          
          <div className="article-meta" style={{
            display: 'flex',
            gap: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}>
            <span>📅 {article.date}</span>
            <span>⏱️ {article.readTime}</span>
          </div>

          <div
            className="article-progress-track"
            style={{
              marginTop: '1.35rem',
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${readingProgress}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #ff0040 0%, #ff7a59 100%)',
                boxShadow: '0 0 18px rgba(255, 0, 64, 0.28)',
                transition: 'width 0.15s ease-out',
              }}
            />
          </div>
        </motion.header>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="article-content-card article-body"
          style={{
            background: 'var(--bg-article-content)',
            borderRadius: '16px',
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
                borderRadius: '15px',
                fontSize: '0.85rem',
                color: '#ff0040',
              }}
            >
              #{tag}
            </span>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .article-shell {
            padding: 4.6rem 1rem 2.4rem !important;
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
            border-radius: 14px !important;
          }
        }

        @media (max-width: 560px) {
          .article-shell {
            padding: 4.5rem 0.75rem 2rem !important;
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
