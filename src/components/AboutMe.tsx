import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { aboutMeContent } from './aboutMeContent';
import { AboutMeFooter, AboutMeQuoteBlock, AboutMeSectionCard, AboutMeStatsRow } from './AboutMeSections';
import { useAboutMeTheme } from './useAboutMeTheme';

// 职责：/about 页面的骨架与布局编排，具体内容区块见 AboutMeSections.tsx

const AboutMe = () => {
  const navigate = useNavigate();
  const { pagePanel, borderColor, subtleText } = useAboutMeTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="about-page"
      style={{
        minHeight: '100vh',
        padding: '6rem 2rem 4rem',
      }}
    >
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <motion.button
          onClick={() => navigate('/')}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -5, scale: 1.02 }}
          style={{
            marginBottom: '2rem',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '2px solid var(--p5-red)',
            color: 'var(--p5-red)',
            borderRadius: '0',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          ← 返回
        </motion.button>

        <motion.header
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="about-header"
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '3rem 2rem',
            background: pagePanel,
            borderRadius: '0',
            border: `1px solid ${borderColor}`,
            clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0 100%)',
            boxShadow: '0 16px 36px rgba(40, 26, 33, 0.14)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--p5-red) 0%, var(--p5-dark-red) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              border: '3px solid var(--p5-red)',
              boxShadow: '0 0 30px rgba(255, 0, 64, 0.5)',
            }}
          >
            👤
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '900',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #fff 0%, #ff6b9d 50%, #c44569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            关于我
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: subtleText,
            marginBottom: '1.5rem',
          }}>
            灵敏度加满的blog 主人
          </p>

          <AboutMeStatsRow />
        </motion.header>

        <AboutMeQuoteBlock />

        {aboutMeContent.map((section, sectionIndex) => (
          <AboutMeSectionCard key={section.title} section={section} sectionIndex={sectionIndex} />
        ))}

        <AboutMeFooter />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-page {
            padding: 5rem 1rem 2.4rem !important;
          }

          .about-header {
            padding: 2rem 1.25rem !important;
            clip-path: none !important;
            box-shadow: none !important;
          }

          .about-quote,
          .about-section {
            padding: 1.25rem !important;
          }

          .about-links-grid {
            grid-template-columns: 1fr !important;
          }

          .about-footer-socials {
            gap: 0.75rem !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default AboutMe;
