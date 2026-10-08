import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import TopicReader from './TopicReader';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { pickCoverForArticle } from '../lib/coverImage';

type ArchiveMode = 'tag' | 'category';

interface ArchivePageProps {
  mode: ArchiveMode;
}

const prettyDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('zh-CN');
};

const categoryEmoji = (category: string) => {
  if (category.includes('后端')) return '🛠️';
  if (category.includes('机器')) return '🤖';
  if (category.includes('随笔')) return '🌈';
  if (category.includes('生物')) return '🧬';
  if (category.includes('三维')) return '🧊';
  return '✨';
};

const ArchivePage = ({ mode }: ArchivePageProps) => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { articles, status, error } = useArticles();
  const { topics, getTopicsByCategory, getArticlePath, getTopicPath, getCategoryData, getTagData } = useContent();
  const decodedName = decodeURIComponent(name ?? '');
  const categories = useMemo(() => getCategoryData(articles), [articles, getCategoryData]);
  const selectedCategory = categories.find((category) => category.name === decodedName);
  const topicsInCategory =
    mode === 'category' && selectedCategory?.usesTopics ? getTopicsByCategory(decodedName) : [];
  const archiveTitle = mode === 'tag' ? `标签: ${decodedName || '未指定'}` : `分类: ${decodedName || '未指定'}`;

  const filteredArticles = useMemo(() => {
    if (!decodedName) return [];
    if (mode === 'tag') {
      return articles.filter((article) => article.tags.includes(decodedName));
    }
    return articles.filter((article) => article.category === decodedName);
  }, [articles, decodedName, mode]);
  const archiveSummary =
    topicsInCategory.length > 0
      ? `共 ${topicsInCategory.length} 个专题`
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

  const tagCounts = useMemo(() => {
    return getTagData(articles);
  }, [articles, getTagData]);

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
  }, [articles, topics, getArticlePath, getTopicPath]);

  // 空卡片只是视觉噪音（比如后台刚建的空栏目）：右边没东西可放时整列都不出现，正文直接占满。
  const hasSidebar = tagCounts.length > 0 || latestEntries.length > 0;

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
          <header style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              {archiveTitle}
            </h1>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              margin: 0,
              paddingBottom: '1.5rem',
              borderBottom: '2px solid var(--border-section)',
            }}>
              {archiveSummary}
            </p>
            {status === 'error' && error && (
              <p role="alert" style={{ color: '#ff0047', fontSize: '0.85rem', margin: '0.8rem 0 0' }}>文章 API 暂不可用，已显示本地内容：{error}</p>
            )}
          </header>

          <div className="archive-grid" style={{ display: 'grid', gridTemplateColumns: hasSidebar ? 'minmax(0, 2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: '1.5rem' }}>
            <div>
              {topicsInCategory.length > 0 ? (
                <div className="topic-reader-card">
                  {topicsInCategory.map((topic) => (
                    <article key={topic.slug} className="reader-topic">
                      <header className="reader-topic-header">
                        <p className="reader-topic-kicker">
                          {categoryEmoji(topic.category)} {topic.category}
                          {topic.sections.length > 0 ? ` · ${topic.sections.length} 节` : ''}
                        </p>
                        <h2 className="reader-topic-title">{topic.title}</h2>
                        {topic.summary && <p className="reader-topic-summary">{topic.summary}</p>}
                      </header>
                      <TopicReader topic={topic} />
                    </article>
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
                  {mode === 'category'
                    ? `「${decodedName}」还没有内容，加完内容之后就会出现在这里。`
                    : '暂无内容，尝试切换其他标签。'}
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
                            background: 'rgba(255, 255, 255, 0.78)',
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

            {hasSidebar && <aside className="archive-sidebar" style={{ position: 'sticky', top: '6.25rem', alignSelf: 'start' }}>
              {tagCounts.length > 0 && <div
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
              </div>}

              {latestEntries.length > 0 && <div
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
              </div>}
            </aside>}
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
            grid-template-columns: minmax(0, 1fr) !important;
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
