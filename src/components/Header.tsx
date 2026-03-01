import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { heroSlideshowImages } from './imageConfig';
import { useTheme } from '../contexts/ThemeContext';

const base = import.meta.env.BASE_URL;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
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

  // Hero图片切换
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroSlideshowImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('home');
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        setIsInHeroSection(rect.bottom > 0);
      } else {
        setIsInHeroSection(false);
      }
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

  const handleNavClick = (item: typeof navItems[0]) => {
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
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(item.href);
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      navigate(item.href);
    }
    setIsMenuOpen(false);
  };

  const headerOverlay = isDark
    ? 'linear-gradient(to bottom, rgba(10, 10, 10, 0.4) 0%, rgba(10, 10, 10, 0.2) 100%)'
    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%)';

  const articleBg = isDark
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f1f3f5 100%)';

  // Nav text is always white on hero/article pages (dark overlays), 
  // but in light mode when scrolled past hero, use dark text
  const navTextColor = isDark ? '#ffffff' : (isArticlePage || isInHeroSection ? '#ffffff' : '#ffffff');

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottom: '3px solid #ff0040',
        boxShadow: '0 4px 20px rgba(255, 0, 64, 0.5)',
        overflow: 'hidden',
      }}
    >
      {/* 背景层 - 根据页面和滚动位置切换 */}
      <AnimatePresence mode="sync">
        {isArticlePage ? (
          <motion.div
            key="article-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: articleBg,
            }}
          />
        ) : isInHeroSection ? (
          <motion.div
            key={`hero-${currentHeroIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '200%',
              backgroundImage: `url(${heroSlideshowImages[currentHeroIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <motion.div
            key="theme"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${base}主题背景.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </AnimatePresence>

      {/* 渐变遮罩 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: headerOverlay,
        zIndex: 1,
      }} />

      <nav style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Logo 和标语 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              fontSize: '1.8rem',
              fontWeight: '400',
              color: '#ff0040',
              fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
              letterSpacing: '4px',
            }}
          >
            偏铝酸钠
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: '0.75rem',
              color: '#ffd700',
              fontWeight: '700',
              letterSpacing: '2px',
              marginTop: '8px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            ⚡ 偷走你的心 ⚡
          </motion.span>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav"
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {navItems.map((item, index) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavClick(item)}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              whileHover={{ 
                scale: 1.1,
                color: '#ff0040',
              }}
              style={{
                color: navTextColor,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                position: 'relative',
                padding: '0.5rem 0',
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {item.name}
              <motion.span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: '#ff0040',
                  transform: 'scaleX(0)',
                  transformOrigin: 'right',
                }}
                whileHover={{ transform: 'scaleX(1)', transformOrigin: 'left' }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          ))}
          
          {/* 搜索栏 */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            transition={{ delay: 0.6 }}
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
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              }}
            />
            <motion.span
              whileHover={{ scale: 1.1 }}
              style={{
                color: '#ff0040',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              🔍
            </motion.span>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mobile-menu-btn"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu */}
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
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid var(--border-mobile-menu)`,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '1rem 0.5rem',
                  fontSize: '1rem',
                }}
              >
                {item.name}
              </button>
            ))}
            {/* 移动端搜索 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              borderRadius: '20px',
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-input)',
              marginTop: '1rem',
            }}>
              <input
                type="text"
                placeholder="搜索..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '1rem',
                  flex: 1,
                }}
              />
              <span style={{ color: '#ff0040', fontSize: '1rem' }}>🔍</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 响应式样式 */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </motion.header>
  );
};

export default Header;
