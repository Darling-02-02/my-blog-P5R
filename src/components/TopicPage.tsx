import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import MarkdownBody from './MarkdownBody';
import { findSection, findTopic, getSectionPath, getTopicPath } from '../data/topics';

const TopicPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ category: string; topic: string; section?: string }>();
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
        <div className="article-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
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

          {!section && (
            <div
              style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid var(--border-card)',
                marginBottom: '2rem',
                minHeight: '220px',
                display: 'flex',
                alignItems: 'flex-end',
                backgroundImage: `linear-gradient(180deg, rgba(12,8,12,0.15) 0%, rgba(12,8,12,0.88) 100%), url(${topic.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ padding: '1.75rem', width: '100%' }}>
                <span style={{
                  display: 'inline-block',
                  background: '#ff0040',
                  color: '#fff',
                  padding: '0.35rem 0.9rem',
                  marginBottom: '0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '20px',
                }}>
                  {topic.category}
                </span>
                <h1 style={{
                  fontSize: 'clamp(1.7rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: '0.75rem',
                  color: '#fff',
                  textShadow: '0 2px 12px rgba(0,0,0,0.65)',
                }}>
                  {topic.title}
                </h1>
                {topic.summary && (
                  <p style={{
                    color: 'rgba(255,255,255,0.86)',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {topic.summary}
                  </p>
                )}
              </div>
            </div>
          )}

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
                {topic.category} · {topic.title}
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
          ) : null}

          <div
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
            <MarkdownBody content={section ? section.content : topic.intro} />
          </div>

          {!section && (
            <div style={{ marginTop: '2rem', display: 'grid', gap: '0.9rem' }}>
              {topic.sections.map((item, index) => (
                <motion.button
                  key={item.slug}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(getSectionPath(topic, item))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '1.1rem 1.25rem',
                    background: 'var(--bg-article-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: 'var(--text-body)',
                  }}
                >
                  <span style={{
                    flex: '0 0 auto',
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(255,0,64,0.12)',
                    color: '#ff0040',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {item.title}
                    </span>
                    {item.readTime && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        ⏱️ {item.readTime}
                      </span>
                    )}
                  </span>
                  <span style={{ color: '#ff0040', fontSize: '0.85rem', fontWeight: 600 }}>
                    阅读 →
                  </span>
                </motion.button>
              ))}
            </div>
          )}

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

        <style>{`
          @media (max-width: 768px) {
            .article-shell {
              padding: 4.6rem 1rem 2.4rem !important;
            }

            .article-header {
              margin-bottom: 1.6rem !important;
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
      <Footer />
    </>
  );
};

export default TopicPage;
