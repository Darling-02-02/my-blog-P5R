import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import { useTheme } from '../contexts/useTheme';
import { useSecondaryPageBackground } from './usePageBackground';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInHeroSection, setIsInHeroSection] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const secondaryBackground = useSecondaryPageBackground();
  const useLightHeaderTheme = location.pathname !== '/';
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return articles
      .filter((article) => {
        const searchableText = [
          article.title,
          article.excerpt,
          article.category,
          article.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [normalizedQuery]);

  const isArticlePage =
    location.pathname.startsWith('/article') ||
    location.pathname === '/about' ||
    location.pathname === '/study-room' ||
    location.pathname.startsWith('/tag/') ||
    location.pathname.startsWith('/category/');

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('home');
      if (!heroSection) {
        setIsInHeroSection(false);
        return;
      }
      const rect = heroSection.getBoundingClientRect();
      setIsInHeroSection(rect.bottom > 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: '首页', href: '/', external: false },
    { name: '个人简介', href: '/explore#profile', external: false },
    { name: '幕后', href: '/explore#blog', external: false },
    { name: '留言板', href: '/explore#comments', external: false },
    { name: 'Study Room', href: '/study-room', external: false },
    { name: 'GitHub', href: 'https://github.com/Darling-02-02', external: true },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.external) {
      window.open(item.href, '_blank');
      setIsMenuOpen(false);
      return;
    }

    if (item.href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
      setIsMenuOpen(false);
      return;
    }

    if (item.href.includes('#')) {
      const hash = item.href.split('#')[1];
      const targetPath = item.href.split('#')[0] || '/';
      if (location.pathname === targetPath) {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(targetPath);
      }
      setIsMenuOpen(false);
      return;
    }

    navigate(item.href);
    setIsMenuOpen(false);
  };

  const handleArticleSelect = (articleId: number) => {
    setSearchQuery('');
    navigate(`/article/${articleId}`);
    setIsMenuOpen(false);
  };

  const headerOverlay = useLightHeaderTheme
    ? 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.02))'
    : isDark
      ? 'linear-gradient(to bottom, rgba(10,10,10,0.24), rgba(10,10,10,0.08))'
      : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.06))';

  const articleBg = useLightHeaderTheme
    ? `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)), url(${secondaryBackground})`
    : isDark
      ? `linear-gradient(135deg, rgba(10,10,18,0.62), rgba(10,10,18,0.44)), url(${secondaryBackground})`
      : `linear-gradient(135deg, rgba(255,255,255,0.48), rgba(255,255,255,0.28)), url(${secondaryBackground})`;

  const heroBg = isDark
    ? 'linear-gradient(135deg, rgba(20,20,20,0.6), rgba(26,26,46,0.46))'
    : 'linear-gradient(135deg, rgba(255,255,255,0.58), rgba(245,248,252,0.42))';
  const navTextColor = useLightHeaderTheme ? '#26191d' : '#ffffff';
  const navTextShadow = useLightHeaderTheme ? '0 1px 0 rgba(255,255,255,0.7)' : '0 2px 7px rgba(0,0,0,0.72)';
  const searchShellBackground = useLightHeaderTheme ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.14)';
  const searchShellBorder = useLightHeaderTheme ? '1px solid rgba(255, 0, 64, 0.18)' : '1px solid rgba(255,255,255,0.2)';
  const mobileMenuBackground = useLightHeaderTheme ? 'rgba(255,255,255,0.76)' : 'rgba(0,0,0,0.65)';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottom: '2px solid rgba(255, 0, 64, 0.65)',
        boxShadow: '0 2px 14px rgba(255, 0, 64, 0.2)',
        backdropFilter: 'blur(7px)',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="sync">
        {isArticlePage ? (
          <motion.div
            key="article-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: articleBg,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          />
        ) : isInHeroSection ? (
          <motion.div
            key="hero-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'absolute', inset: 0, background: heroBg }}
          />
        ) : (
          <motion.div
            key="theme-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
               style={{
                 position: 'absolute',
                 inset: 0,
                backgroundImage: `url(${secondaryBackground})`,
                 backgroundSize: 'cover',
                backgroundPosition: 'center top',
                 backgroundRepeat: 'no-repeat',
               }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', inset: 0, background: headerOverlay, zIndex: 1 }} />

      <nav
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.9rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.03 }}
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
                color: '#ff0040',
                fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
                letterSpacing: '4px',
                textShadow: useLightHeaderTheme ? '0 1px 0 rgba(255,255,255,0.62)' : '0 2px 10px rgba(0,0,0,0.38)',
              }}
        >
          偏铝酸钠
        </motion.div>

        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navItems.map((item, index) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavClick(item)}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.2 }}
              whileHover={{ scale: 1.06, color: '#ff0040' }}
              style={{
                color: navTextColor,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '0.5rem 0',
                textShadow: navTextShadow,
              }}
            >
              {item.name}
            </motion.button>
          ))}

          <div
            style={{
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: searchShellBackground,
                borderRadius: '20px',
                padding: '0.45rem 0.9rem',
                border: searchShellBorder,
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    event.preventDefault();
                    handleArticleSelect(searchResults[0].id);
                  }

                  if (event.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                placeholder="搜索文章..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: navTextColor,
                  outline: 'none',
                  fontSize: '0.875rem',
                  width: '150px',
                  textShadow: useLightHeaderTheme ? 'none' : '0 1px 4px rgba(0,0,0,0.6)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (searchResults[0]) {
                    handleArticleSelect(searchResults[0].id);
                  }
                }}
                style={{
                  color: '#ff0040',
                  fontSize: '1rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: searchResults[0] ? 'pointer' : 'default',
                  padding: 0,
                }}
                aria-label="Search article"
              >
                🔍
              </button>
            </div>

            {normalizedQuery && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.6rem)',
                  right: 0,
                  width: '320px',
                  maxWidth: 'min(320px, 90vw)',
                  background: isDark ? 'rgba(18,18,24,0.96)' : 'rgba(255,255,255,0.98)',
                  border: '1px solid rgba(255, 0, 64, 0.28)',
                  borderRadius: '16px',
                  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => handleArticleSelect(article.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        display: 'grid',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-card-title)', fontWeight: 700, fontSize: '0.9rem' }}>
                        {article.title}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {article.category} · {article.date}
                      </span>
                    </button>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '0.95rem 1rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    没有搜索到相关文章。
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: navTextColor,
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            textShadow: useLightHeaderTheme ? 'none' : '0 2px 6px rgba(0,0,0,0.7)',
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: mobileMenuBackground,
              backdropFilter: 'blur(6px)',
              padding: '1rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  color: navTextColor,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: useLightHeaderTheme ? '1px solid rgba(37,25,29,0.12)' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  padding: '1rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textShadow: useLightHeaderTheme ? 'none' : '0 1px 4px rgba(0,0,0,0.7)',
                }}
              >
                {item.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </motion.header>
  );
};

export default Header;
