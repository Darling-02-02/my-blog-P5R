import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { heroSlideshowImages } from './imageConfig';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isInHeroSection, setIsInHeroSection] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isArticlePage = location.pathname.startsWith('/article');

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
        // 如果Hero区域还在视口内（底部还没有滚出视口顶部）
        setIsInHeroSection(rect.bottom > 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: '首页', href: '/', isPage: true },
    { name: '学习路线', href: '/#blog', isPage: false },
    { name: '关于', href: '/#about', isPage: false },
    { name: '代码仓库', href: 'https://github.com', isPage: true, external: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.external) {
      window.open(item.href, '_blank');
    } else if (item.isPage) {
      navigate(item.href);
    } else {
      navigate(item.href);
    }
    setIsMenuOpen(false);
  };

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
          // 文章页面背景 - 纯色+渐变
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
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            }}
          />
        ) : isInHeroSection ? (
          // Hero区域背景 - 图片切换
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
          // 其他页面背景 - 主题背景
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
              backgroundImage: 'url(/主题背景.jpg)',
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
        background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.4) 0%, rgba(10, 10, 10, 0.2) 100%)',
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
              fontSize: '1.5rem',
              fontWeight: '900',
              color: '#ff0040',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
            className="glitch"
            data-text="小窝"
          >
            小窝
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
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
        }}>
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
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                position: 'relative',
                padding: '0.5rem 0',
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
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255, 0, 64, 0.5)',
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
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(10, 10, 10, 0.95)',
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
                color: '#ffffff',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #2d2d2d',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '0.5rem 0',
                fontSize: '1rem',
              }}
            >
              {item.name}
            </button>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
