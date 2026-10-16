import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { useTheme } from '../contexts/useTheme';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // 滑动离开顶部时下沿浮出一条虚线，回到顶部收回。只存一个布尔量，
  // 值没变时 setState 会被 React 跳过，所以直接挂在 scroll 事件上也不需要节流。
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const syncScrolled = () => setIsScrolled(window.scrollY > 4);
    syncScrolled();
    window.addEventListener('scroll', syncScrolled, { passive: true });
    return () => window.removeEventListener('scroll', syncScrolled);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { articles, status, error } = useArticles();
  const { getArticlePath, getCategoryData } = useContent();
  // 页头不铺自己的底色（原来 hero / 子页 / 滚出首屏各一层，再加一层面纱），整条栏是透明的，
  // 直接压在整站唯一那张背景上，所以字色只跟主题走：浅色给深字，深色给白字。
  // 之前按「是否站在 hero 上」切换，等于假设 hero 是深底——可浅色主题的 hero 底是亮的，
  // 于是首页首屏变成白字压白底：「搜索文章...」直接看不见了。
  const useLightHeaderTheme = !isDark;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    const matches = (parts: string[]) =>
      parts.join(' ').toLowerCase().includes(normalizedQuery);

    const articleHits = articles
      .filter((article) => matches([article.title, article.excerpt, article.category, article.tags.join(' ')]))
      .map((article) => ({
        key: `article-${article.id}`,
        title: article.title,
        subtitle: `${article.category} · ${article.date}`,
        href: getArticlePath(article),
      }));

    return articleHits.slice(0, 6);
  }, [normalizedQuery, articles, getArticlePath]);

  // 栏目表整个空掉时首页上没有 #blog 这一块，那就别显示「幕后」，省得点了没反应。
  const hasColumns = useMemo(() => getCategoryData(articles).length > 0, [articles, getCategoryData]);

  type NavItem = { name: string; href: string; external: boolean; columnsOnly?: boolean };

  const navItems: NavItem[] = [
    { name: '首页', href: '/', external: false },
    { name: '个人简介', href: '/myself', external: false },
    { name: '幕后', href: '/#blog', external: false, columnsOnly: true },
    { name: '友链', href: '/#links', external: false },
    { name: '留言板', href: '/#comments', external: false },
    { name: 'GitHub', href: 'https://github.com/Darling-02-02', external: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.columnsOnly || hasColumns);

  const handleNavClick = (item: NavItem) => {
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
        // 跨页时把 hash 一起带上：App 的 ScrollToTop 认这个 hash 并把页面滚到那一块。
        navigate(`${targetPath}#${hash}`);
      }
      setIsMenuOpen(false);
      return;
    }

    navigate(item.href);
    setIsMenuOpen(false);
  };

  const handleSearchSelect = (href: string) => {
    setSearchQuery('');
    navigate(href);
    setIsMenuOpen(false);
  };

  const navTextColor = useLightHeaderTheme ? '#26191d' : '#ffffff';
  const navTextShadow = useLightHeaderTheme ? '0 1px 0 rgba(255,255,255,0.7)' : '0 2px 7px rgba(0,0,0,0.72)';
  const searchShellBackground = useLightHeaderTheme ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.14)';
  const searchShellBorder = useLightHeaderTheme ? '1px solid rgba(0, 0, 0, 0.16)' : '1px solid rgba(255,255,255,0.2)';
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
        // 虚线：浅色主题黑、深色主题白（就是标题墨色 token，深色主题下纯黑等于看不见）。
        // 未滚动时用同宽的透明边框占位，栏高不会因它出现/消失而跳 2px。
        borderBottom: isScrolled ? '2px dashed var(--text-heading)' : '2px dashed transparent',
      }}
    >

      <nav
        style={{
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
                color: 'var(--accent)',
                fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
                letterSpacing: '4px',
                textShadow: useLightHeaderTheme ? '0 1px 0 rgba(255,255,255,0.62)' : '0 2px 10px rgba(0,0,0,0.38)',
              }}
        >
          偏铝酸钠
        </motion.div>

        <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {visibleNavItems.map((item, index) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavClick(item)}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.2 }}
              whileHover={{ scale: 1.06, color: 'var(--accent)' }}
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
                borderRadius: 'var(--radius-card)',
                padding: '0.45rem 0.9rem',
                border: searchShellBorder,
              }}
            >
              <input
                type="text"
                value={searchQuery}
                aria-label="搜索文章"
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    event.preventDefault();
                    handleSearchSelect(searchResults[0].href);
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
                  fontSize: '0.875rem',
                  width: '150px',
                  textShadow: useLightHeaderTheme ? 'none' : '0 1px 4px rgba(0,0,0,0.6)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (searchResults[0]) {
                    handleSearchSelect(searchResults[0].href);
                  }
                }}
                style={{
                  color: 'var(--accent)',
                  fontSize: '1rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: searchResults[0] ? 'pointer' : 'default',
                  /* 只有 21px 高，摸不到 WCAG 2.2 的 24px 靶子；靠负 margin 把视觉尺寸还回去 */
                  padding: '0.6rem',
                  margin: '-0.6rem',
                  lineHeight: 1,
                }}
                aria-label="搜索文章"
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
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.24)' : '1px solid rgba(0, 0, 0, 0.16)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((hit) => (
                    <button
                      key={hit.key}
                      type="button"
                      onClick={() => handleSearchSelect(hit.href)}
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
                        {hit.title}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {hit.subtitle}
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

      {status === 'error' && error && (
        <div role="alert" style={{ position: 'relative', zIndex: 2, padding: '0.35rem 1rem', textAlign: 'center', background: 'rgba(176,0,32,0.9)', color: '#fff', fontSize: '0.78rem' }}>
          文章 API 暂不可用，搜索已使用本地内容：{error}
        </div>
      )}

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
            {visibleNavItems.map((item) => (
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
