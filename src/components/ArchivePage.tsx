import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import { getArticlePath } from '../data/articles';
import { useArticles } from '../contexts/useArticles';
import { getCategoryData, getTagData } from '../data/categories';
import { getTopicsByCategory, getTopicPath, topics } from '../data/topics';
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
  const { name, subcategory } = useParams<{ name: string; subcategory?: string }>();
  const { articles, status, error } = useArticles();
  const decodedName = decodeURIComponent(name ?? '');
  const decodedSubcategory = decodeURIComponent(subcategory ?? '');
  const categories = useMemo(() => getCategoryData(articles), [articles]);
  const selectedCategory = categories.find((category) => category.name === decodedName);
  const subcategories = mode === 'category' && !decodedSubcategory ? (selectedCategory?.subcategories ?? []) : [];
  const topicsInCategory =
    mode === 'category' && selectedCategory?.usesTopics && !decodedSubcategory
      ? getTopicsByCategory(decodedName)
      : [];
  const archiveTitle =
    mode === 'tag'
      ? `标签: ${decodedName || '未指定'}`
      : `分类: ${decodedSubcategory ? `${decodedName} / ${decodedSubcategory}` : decodedName || '未指定'}`;

  const filteredArticles = useMemo(() => {
    if (!decodedName) return [];
    if (mode === 'tag') {
      return articles.filter((article) => article.tags.includes(decodedName));
    }
    if (decodedSubcategory) {
      return articles.filter(
        (article) => article.category === decodedName && article.subcategory === decodedSubcategory,
      );
    }
    return articles.filter((article) => article.category === decodedName);
  }, [articles, decodedName, decodedSubcategory, mode]);
  const archiveSummary =
    topicsInCategory.length > 0
      ? `共 ${topicsInCategory.length} 个专题`
      : subcategories.length > 0
        ? `共 ${subcategories.length} 个专题`
        : `共 ${filteredArticles.length} 篇文章`;

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
    return categories.map(
      (category) => [category.name, category.usesTopics ? category.topicCount : category.count] as const,
    );
  }, [categories]);

  const tagCounts = useMemo(() => {
    return getTagData(articles);
  }, [articles]);

  const latestEntries = useMemo(() => {
    const topicEntries = topics.map((topic) => ({
      key: `topic-${topic.category}-${topic.slug}`,
      title: topic.title,
      meta: `${topic.category} · ${topic.sections.length} 节`,
      href: getTopicPath(topic),
    }));
    const articleEntries = [...articles]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((article) => ({
        key: `article-${article.id}`,
        title: article.title,
        meta: prettyDate(article.date),
        href: getArticlePath(article),
      }));

    return [...topicEntries, ...articleEntries].slice(0, 5);
  }, [articles]);

  return (
    <>
      <Header />
      <section
        className="archive-shell"
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
                {archiveTitle}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem' }}>
                {archiveSummary}
              </p>
              {status === 'error' && error && (
                <p role="alert" style={{ color: '#ffd7df', fontSize: '0.85rem', margin: '0.8rem 0 0' }}>文章 API 暂不可用，已显示本地内容：{error}</p>
              )}
            </div>
          </motion.div>

          <div className="archive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div>
              {topicsInCategory.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                    gap: '1rem',
                  }}
                >
                  {topicsInCategory.map((topic, index) => (
                    <motion.article
                      key={topic.slug}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(getTopicPath(topic))}
                      style={{
                        background: 'var(--bg-article-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          height: '128px',
                          backgroundImage: `linear-gradient(180deg, rgba(12,8,12,0.1) 0%, rgba(12,8,12,0.7) 100%), url(${topic.cover})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ color: 'var(--text-card-title)', fontSize: '1.05rem', margin: '0 0 0.5rem' }}>
                          {topic.title}
                        </h3>
                        <p style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.88rem',
                          lineHeight: 1.6,
                          margin: '0 0 1rem',
                          flex: 1,
                        }}>
                          {topic.summary}
                        </p>
                        <span style={{ color: '#ff0040', fontSize: '0.82rem', fontWeight: 600 }}>
                          {topic.sections.length} 节 · 进入专题 →
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : subcategories.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                    gap: '1rem',
                  }}
                >
                  {subcategories.map((subcategory, index) => (
                    <motion.article
                      key={subcategory}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      whileHover={{ y: -4 }}
                      onClick={() =>
                        navigate(`/category/${encodeURIComponent(decodedName)}/${encodeURIComponent(subcategory)}`)
                      }
                      style={{
                        background: 'var(--bg-article-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '14px',
                        padding: '1.25rem',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <h3 style={{ color: 'var(--text-card-title)', fontSize: '1.05rem', margin: 0 }}>
                        {subcategory}
                      </h3>
                      <span style={{ color: '#ff0040', fontSize: '0.82rem', marginTop: '1.2rem' }}>
                        查看学习文档 →
                      </span>
                    </motion.article>
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
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
                          onClick={() => navigate(getArticlePath(article))}
                          className="archive-entry"
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

            <aside className="archive-sidebar" style={{ position: 'sticky', top: '6.25rem', alignSelf: 'start' }}>
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
                  {tagCounts.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => navigate(`/tag/${encodeURIComponent(tag.name)}`)}
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
                      #{tag.name}
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
                <h3 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem', fontSize: '1rem' }}>最新内容</h3>
                {latestEntries.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => navigate(entry.href)}
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
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{entry.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{entry.meta}</div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <Footer />
      <style>{`
        @media (max-width: 1024px) {
          .archive-sidebar {
            position: static !important;
          }
        }

        @media (max-width: 900px) {
          .archive-shell {
            padding: 5.8rem 0.85rem 1.6rem !important;
          }

          .archive-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .archive-entry {
            grid-template-columns: 1fr !important;
          }

          .archive-shell {
            padding: 5.25rem 0.75rem 1.4rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default ArchivePage;
