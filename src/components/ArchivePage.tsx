import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { articles } from '../data/articles';
import { pickCoverByKey, pickCoverForArticle } from './coverImage';

type ArchiveMode = 'tag' | 'category';

interface ArchivePageProps {
  mode: ArchiveMode;
}

const prettyDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('zh-CN');
};

const ArchivePage = ({ mode }: ArchivePageProps) => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? '');

  const filteredArticles = useMemo(() => {
    if (!decodedName) return [];
    if (mode === 'tag') {
      return articles.filter((article) => article.tags.includes(decodedName));
    }
    return articles.filter((article) => article.category === decodedName);
  }, [decodedName, mode]);

  const groupedByYear = useMemo(() => {
    const grouped = new Map<string, typeof filteredArticles>();
    filteredArticles.forEach((article) => {
      const year = article.date.slice(0, 4) || '未知';
      const bucket = grouped.get(year) ?? [];
      bucket.push(article);
      grouped.set(year, bucket);
    });
    return [...grouped.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [filteredArticles]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((article) => {
      map.set(article.category, (map.get(article.category) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((article) => {
      article.tags.forEach((tag) => {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      });
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const latestArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, []);

  return (
    <>
      <Header />
      <section
        style={{
          minHeight: '100vh',
          padding: '6.5rem 1rem 2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              border: '1px solid var(--border-card)',
              marginBottom: '1.5rem',
              background: 'var(--bg-main-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.6)), url(${pickCoverByKey(`${mode}:${decodedName || 'default'}`)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '3.2rem 2rem',
              }}
            >
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', marginBottom: '0.8rem' }}>
                {mode === 'tag' ? '标签' : '分类'}: {decodedName || '未指定'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem' }}>
                共 {filteredArticles.length} 篇文章
              </p>
            </div>
          </motion.div>

          <div className="archive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div>
              {filteredArticles.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  暂无内容，尝试切换其他标签或分类。
                </div>
              ) : (
                groupedByYear.map(([year, yearArticles]) => (
                  <section key={year} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ color: '#ff0040', fontWeight: 800, marginBottom: '0.8rem', fontSize: '1.25rem' }}>
                      {year}
                    </div>
                    <div style={{ display: 'grid', gap: '0.9rem' }}>
                      {yearArticles.map((article) => (
                        <motion.article
                          key={article.id}
                          whileHover={{ y: -4 }}
                          onClick={() => navigate(`/article/${article.id}`)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr',
                            gap: '1rem',
                            background: 'var(--bg-article-card)',
                            border: '1px solid var(--border-card)',
                            borderRadius: '12px',
                            padding: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          <img
                            src={pickCoverForArticle(article)}
                            alt={article.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: '84px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                            }}
                          />
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                              {prettyDate(article.date)} · {article.readTime}
                            </div>
                            <h3 style={{ color: 'var(--text-card-title)', marginBottom: '0.45rem', fontSize: '1.05rem' }}>
                              {article.title}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                              {article.excerpt}
                            </p>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>

            <aside>
              <div
                style={{
                  background: 'var(--bg-sidebar-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem', fontSize: '1rem' }}>分类</h3>
                {categoryCounts.map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-body)',
                      padding: '0.35rem 0',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{category}</span>
                    <span style={{ color: '#ff0040', fontWeight: 600 }}>{count}</span>
                  </button>
                ))}
              </div>

              <div
                style={{
                  background: 'var(--bg-sidebar-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem', fontSize: '1rem' }}>标签</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {tagCounts.map(([tag]) => (
                    <button
                      key={tag}
                      onClick={() => navigate(`/tag/${encodeURIComponent(tag)}`)}
                      style={{
                        border: '1px solid var(--border-tag)',
                        background: 'var(--bg-tag)',
                        color: '#ff0040',
                        borderRadius: '999px',
                        padding: '0.2rem 0.55rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-sidebar-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem', fontSize: '1rem' }}>最新文章</h3>
                {latestArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => navigate(`/article/${article.id}`)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-body)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: '0.35rem 0',
                      borderBottom: '1px dashed var(--border-section)',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{article.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{prettyDate(article.date)}</div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <Footer />
      <style>{`
        @media (max-width: 900px) {
          .archive-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .archive-grid article {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default ArchivePage;
