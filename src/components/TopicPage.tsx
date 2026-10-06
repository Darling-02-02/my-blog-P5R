import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import MarkdownBody from './MarkdownBody';
import TopicReader from './TopicReader';
import Sidebar from './ContentSectionSidebar';
import { useContent } from '../contexts/useContent';

const TopicPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ category: string; topic: string; section?: string }>();
  const { findSection, findTopic, getSectionPath, getTopicPath } = useContent();
  const topic = findTopic(params.category, params.topic);
  const section = findSection(params.category, params.topic, params.section);
  const [readingProgress, setReadingProgress] = useState(0);

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
  }, [section]);

  if (!topic) {
    return (
      <>
        <Header />
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6rem 2rem 2rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{
            background: 'var(--bg-card)',
            padding: '2.5rem',
            borderRadius: '10px',
            border: '2px solid #ff0040',
            textAlign: 'center',
          }}>
            <h1 style={{ color: '#ff0040', marginBottom: '1rem', fontSize: '1.8rem' }}>
              专题未找到
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              该专题可能已被删除或尚未发布
            </p>
            <button
              onClick={() => navigate('/explore#blog')}
              style={{
                padding: '0.9rem 1.8rem',
                background: '#ff0040',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              返回幕后
            </button>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const sectionIndex = section
    ? topic.sections.findIndex((item) => item.slug === section.slug)
    : -1;
  const previousSection = sectionIndex > 0 ? topic.sections[sectionIndex - 1] : undefined;
  const nextSection =
    sectionIndex >= 0 && sectionIndex < topic.sections.length - 1
      ? topic.sections[sectionIndex + 1]
      : undefined;

  return (
    <>
      <Header />
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="article-shell"
        style={{ minHeight: '100vh', padding: '5rem 2rem 4rem', position: 'relative', zIndex: 1 }}
      >
        <div
          className="article-container topic-layout"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-start',
          }}
        >
          {/* 和幕后/首页同一套左栏：个人资料、公告、分类、标签、网站资讯 */}
          <Sidebar />

          <div className="topic-main" style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() =>
              section ? navigate(getTopicPath(topic)) : navigate(`/category/${encodeURIComponent(topic.category)}`)
            }
            style={{
              marginBottom: '2rem',
              padding: '0.6rem 1.2rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '20px',
              color: '#ff0040',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ← {section ? '返回专题' : topic.category}
          </button>

          {section ? (
            <motion.header
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="article-header"
              style={{ marginBottom: '2rem' }}
            >
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: '0.6rem',
              }}>
                🏷️ {topic.category} · {topic.title}
              </p>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
                fontWeight: 700,
                marginBottom: '1rem',
                lineHeight: 1.3,
                color: 'var(--text-primary)',
              }}>
                {section.title}
              </h1>
              <div className="article-meta" style={{
                display: 'flex',
                gap: '1.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                flexWrap: 'wrap',
              }}>
                <span>第 {sectionIndex + 1} / {topic.sections.length} 节</span>
                {section.readTime && <span>⏱️ {section.readTime}</span>}
              </div>

              <div
                className="article-progress-track"
                style={{
                  marginTop: '1.35rem',
                  width: '100%',
                  height: '6px',
                  borderRadius: '999px',
                  background: 'rgba(128, 128, 128, 0.22)',
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
          ) : null}

          <div className="topic-reader-card article-body">
            {!section && (
              <header className="topic-intro-header">
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  marginBottom: '0.6rem',
                }}>
                  🏷️ {topic.category}
                </p>
                <h1 style={{
                  fontSize: 'clamp(1.8rem, 4.5vw, 2.6rem)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: topic.summary ? '1rem' : 0,
                  color: 'var(--text-primary)',
                }}>
                  {topic.title}
                </h1>
                {topic.summary && (
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {topic.summary}
                  </p>
                )}
              </header>
            )}

            {section ? (
              <MarkdownBody content={section.content} />
            ) : (
              <TopicReader topic={topic} />
            )}
          </div>

          {section && (previousSection || nextSection) && (
            <div style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: previousSection && nextSection ? '1fr 1fr' : '1fr',
              gap: '0.9rem',
            }}>
              {previousSection && (
                <button
                  onClick={() => navigate(getSectionPath(topic, previousSection))}
                  style={{
                    padding: '1rem 1.1rem',
                    background: 'var(--bg-article-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-body)',
                  }}
                >
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    上一节
                  </span>
                  <span style={{ fontWeight: 600 }}>{previousSection.title}</span>
                </button>
              )}
              {nextSection && (
                <button
                  onClick={() => navigate(getSectionPath(topic, nextSection))}
                  style={{
                    padding: '1rem 1.1rem',
                    background: 'var(--bg-article-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'right',
                    color: 'var(--text-body)',
                    marginLeft: previousSection ? 0 : 'auto',
                  }}
                >
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                    下一节
                  </span>
                  <span style={{ fontWeight: 600 }}>{nextSection.title}</span>
                </button>
              )}
            </div>
          )}

          {!section && topic.tags.length > 0 && (
            <div className="article-tags" style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              {topic.tags.map((tag) => (
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
            </div>
          )}
          </div>
        </div>

        <style>{`
          /* 专题页：标题/简介/正文共用一张卡（.topic-reader-card），靠分隔线分区，不再一层套一层 */
          .topic-intro-header {
            margin-bottom: 1.8rem;
            padding-bottom: 1.6rem;
            border-bottom: 1px solid var(--border-card);
          }

          /* 小节页的标题区也托一层底色，免得标题和分类压在背景插画上看不清 */
          .article-header {
            background: var(--bg-article-card);
            border: 1px solid var(--border-card);
            border-radius: 18px;
            padding: 1.5rem 1.6rem;
            backdrop-filter: blur(10px);
          }

          @media (max-width: 900px) {
            /* 和幕后一致：窄屏收成单栏（侧栏在上）。align-items 必须回 stretch，
               否则列方向下 flex-start 会让正文列按 min-content 撑宽、右侧被裁掉 */
            .topic-layout {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 1.5rem !important;
            }

            .home-sidebar {
              position: static !important;
              width: 100% !important;
              top: auto !important;
            }
          }

          @media (max-width: 768px) {
            .article-shell {
              padding: 4.6rem 1rem 2.4rem !important;
            }

            .article-header {
              margin-bottom: 1.6rem !important;
              padding: 1.15rem 1.25rem !important;
              border-radius: 14px !important;
            }

            .article-meta {
              gap: 0.8rem !important;
              font-size: 0.82rem !important;
            }
          }

          @media (max-width: 560px) {
            .article-shell {
              padding: 4.5rem 0.75rem 2rem !important;
            }

            .article-tags {
              gap: 0.35rem !important;
            }
          }
        `}</style>
      </motion.article>
      <Footer />
    </>
  );
};

export default TopicPage;
