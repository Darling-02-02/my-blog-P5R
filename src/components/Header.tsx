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
    { name: '首页', href: '/', isPage: true },
    { name: '个人简介', href: '/#profile', isPage: false },
    { name: '幕后', href: '/#blog', isPage: false },
    { name: 'Study Room', href: '/study-room', isPage: true },
    { name: 'GitHub', href: 'https://github.com/Darling-02-02', isPage: true, external: true },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.external) {
      window.open(item.href, '_blank');
    } else if (item.href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (item.href.includes('#')) {
      const hash = item.href.split('#')[1];
      if (location.pathname === '/') {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(item.href);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(item.href);
    }
    setIsMenuOpen(false);
  };

  const headerOverlay = isDark
    ? 'linear-gradient(to bottom, rgba(10,10,10,0.45), rgba(10,10,10,0.2))'
    : 'linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0.22))';

  const articleBg = isDark
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f1f3f5 100%)';

  const heroBg = isDark
    ? 'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(26,26,46,0.9))'
    : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(245,248,252,0.9))';

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
        borderBottom: '3px solid #ff0040',
        boxShadow: '0 4px 20px rgba(255, 0, 64, 0.35)',
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
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, background: articleBg }}
          />
        ) : isInHeroSection ? (
          <motion.div
            key="hero-light-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, background: heroBg }}
          />
        ) : (
          <motion.div
            key="theme-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${base}娑撳顣介懗灞炬珯.jpg)`,
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
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            style={{
              fontSize: '1.8rem',
              fontWeight: 400,
              color: '#ff0040',
              fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
              letterSpacing: '4px',
            }}
          >
            偏铝酸钠
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: '0.75rem',
              color: '#ffd700',
              fontWeight: 700,
              letterSpacing: '2px',
              marginTop: '8px',
              textShadow: '1px 1px 3px rgba(0,0,0,0.65)',
            }}
          >
            ⚡ 偷走你的心 ⚡
          </motion.span>
        </div>

        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navItems.map((item, index) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavClick(item)}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.25 }}
              whileHover={{ scale: 1.06, color: '#ff0040' }}
              style={{
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 0',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {item.name}
            </motion.button>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-input)',
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
            textShadow: '1px 1px 3px rgba(0,0,0,0.45)',
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
              background: 'var(--bg-mobile-menu)',
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
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid var(--border-mobile-menu)`,
                  cursor: 'pointer',
                  padding: '1rem 0.5rem',
                  fontSize: '1rem',
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
