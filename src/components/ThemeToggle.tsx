import { useTheme } from '../contexts/useTheme';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="theme-toggle-btn"
      aria-label={isDark ? '切换到日间模式' : '切换到夜间模式'}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9998,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: '2px solid var(--accent)',
        /* 底色和光晕也中性化：原来深色是蓝紫夜、浅色是琥珀暖黄，
           在一个黑白灰站里这两块是最扎眼的颜色（图标本身还是彩色 emoji）。 */
        background: isDark
          ? 'linear-gradient(135deg, #2b2b2b 0%, #111111 100%)'
          : 'linear-gradient(135deg, #f7f7f7 0%, #dcdcdc 100%)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        boxShadow: isDark
          ? '0 4px 20px rgba(255, 255, 255, 0.22), 0 0 40px rgba(255, 255, 255, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.18), 0 0 40px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
      }}
    >
      <motion.span
        key={theme}
        initial={{ y: isDark ? 30 : -30, opacity: 0, rotate: isDark ? 90 : -90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: isDark ? -30 : 30, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>

      <style>{`
        @media (max-width: 768px) {
          .theme-toggle-btn {
            right: 1rem !important;
            bottom: 1rem !important;
            width: 44px !important;
            height: 44px !important;
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </motion.button>
  );
};

export default ThemeToggle;
