import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';

const loadingGif =
  'https://media1.tenor.com/m/D9qVE6hPMLcAAAAd/korone-buffering-inugami-korone.gif';

const NotFoundPage = () => {
  const navigate = useNavigate();

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
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="not-found-shell"
            style={{
              display: 'grid',
              gap: '1.5rem',
              alignItems: 'center',
              gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)',
              background: 'var(--bg-main-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ padding: '1.25rem' }}>
              <img
                src={loadingGif}
                alt="页面未找到"
                referrerPolicy="no-referrer"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: '22px',
                }}
              />
            </div>

            <div style={{ padding: '1.5rem 1.5rem 1.5rem 0.25rem' }}>
              <div
                style={{
                  color: '#ff0040',
                  fontSize: '0.82rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginBottom: '0.85rem',
                }}
              >
                404 / Lost In Route
              </div>
              <h1
                style={{
                  fontSize: 'clamp(2rem, 7vw, 4.8rem)',
                  lineHeight: 0.94,
                  marginBottom: '1rem',
                  color: 'var(--text-heading)',
                }}
              >
                页面走丢了
              </h1>
              <p
                style={{
                  color: 'var(--text-body)',
                  lineHeight: 1.8,
                  maxWidth: '32rem',
                  marginBottom: '1.4rem',
                }}
              >
                这个链接没有命中任何可访问内容。你可以先回首页，或者直接去 Study Room
                继续折腾。
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    background: '#ff0040',
                    color: '#fff',
                    padding: '0.82rem 1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  返回首页
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/study-room')}
                  style={{
                    border: '1px solid var(--border-card)',
                    borderRadius: '999px',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    padding: '0.82rem 1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  去 Study Room
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />

      <style>{`
        @media (max-width: 840px) {
          .not-found-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default NotFoundPage;
