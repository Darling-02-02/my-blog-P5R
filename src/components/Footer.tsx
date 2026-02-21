import { motion } from 'framer-motion';

const Footer = () => {
  const startYear = 2026;

  return (
    <footer
      style={{
        background: 'rgba(26, 26, 26, 0.9)',
        borderTop: '2px solid #ff0040',
        padding: '1.5rem 2rem',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: '#888',
            fontSize: '0.9rem',
          }}
        >
          © {startYear} <span style={{ color: '#ff0040' }}>@</span> 灵敏度加满
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;
