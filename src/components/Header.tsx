import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const base = import.meta.env.BASE_URL;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInHeroSection, setIsInHeroSection] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

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
    { name: '个人简介', href: '/#profile', external: false },
    { name: '幕后', href: '/#blog', external: false },
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
      if (location.pathname === '/') {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(item.href);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      setIsMenuOpen(false);
      return;
    }

    navigate(item.href);
    setIsMenuOpen(false);
  };

  const headerOverlay = isDark
    ? 'linear-gradient(to bottom, rgba(10,10,10,0.24), rgba(10,10,10,0.08))'
    : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.06))';

  const articleBg = isDark
    ? 'linear-gradient(135deg, rgba(26,26,46,0.68), rgba(22,33,62,0.56), rgba(15,15,35,0.5))'
    : 'linear-gradient(135deg, rgba(248,249,250,0.64), rgba(233,236,239,0.5), rgba(241,243,245,0.48))';

  const heroBg = isDark
    ? 'linear-gradient(135deg, rgba(20,20,20,0.6), rgba(26,26,46,0.46))'
    : 'linear-gradient(135deg, rgba(255,255,255,0.58), rgba(245,248,252,0.42))';

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
            style={{ position: 'absolute', inset: 0, background: articleBg }}
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
              backgroundImage: `url(${base}封面图.jpg)`,
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
            textShadow: '0 2px 10px rgba(0,0,0,0.38)',
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
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                padding: '0.5rem 0',
                textShadow: '0 2px 7px rgba(0,0,0,0.72)',
              }}
            >
              {item.name}
            </motion.button>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.14)',
              borderRadius: '20px',
              padding: '0.45rem 0.9rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <input
              type="text"
              placeholder="搜索..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                outline: 'none',
                fontSize: '0.875rem',
                width: '150px',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
            />
            <span style={{ color: '#ff0040', fontSize: '1rem' }}>🔍</span>
          </div>
        </div>

        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
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
              background: 'rgba(0,0,0,0.65)',
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
                  color: '#ffffff',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  padding: '1rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
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
