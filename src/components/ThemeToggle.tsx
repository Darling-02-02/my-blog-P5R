import { useTheme } from '../contexts/ThemeContext';
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
      aria-label={isDark ? '切换到日间模式' : '切换到夜间模式'}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9998,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: '2px solid #ff0040',
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)'
          : 'linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        boxShadow: isDark
          ? '0 4px 20px rgba(255, 0, 64, 0.4), 0 0 40px rgba(255, 0, 64, 0.1)'
          : '0 4px 20px rgba(255, 165, 0, 0.3), 0 0 40px rgba(255, 200, 0, 0.1)',
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
          /* Adjust position on mobile so it doesn't overlap content */
        }
      `}</style>
    </motion.button>
  );
};

export default ThemeToggle;
