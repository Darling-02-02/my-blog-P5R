import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socials = [
    { icon: '💬', name: 'QQ', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { icon: '📺', name: 'Bilibili', link: 'https://space.bilibili.com/84526582' },
    { icon: '🐙', name: 'GitHub', link: 'https://github.com/Darling-02-02' },
    { icon: '🎮', name: 'Steam', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
  ];

  return (
    <footer
      style={{
        background: 'rgba(26, 26, 26, 0.9)',
        borderTop: '2px solid #ff0040',
        padding: '2.5rem 2rem 1.5rem',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#ff0040',
            fontFamily: '"Ma Shan Zheng", cursive',
            letterSpacing: '3px',
          }}>
            偏铝酸钠
          </h2>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {socials.map((s) => (
              <motion.a
                key={s.name}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(255, 0, 64, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 0, 64, 0.3)',
                  color: '#fff',
                }}
                title={s.name}
              >
                {s.icon}
              </motion.a>
            ))}
          </div>

          <p style={{
            color: '#888',
            fontSize: '0.9rem',
            lineHeight: 1.8,
            textAlign: 'center',
          }}>
            离神很近，也就是离人很远。
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem 1.5rem',
            color: '#666',
            fontSize: '0.85rem',
          }}>
            <span>框架 <a href="https://react.dev" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0040', textDecoration: 'none' }}>React</a></span>
            <span>|</span>
            <span>构建 <a href="https://vitejs.cn" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0040', textDecoration: 'none' }}>Vite</a></span>
            <span>|</span>
            <span>部署 <a href="https://pages.github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0040', textDecoration: 'none' }}>GitHub Pages</a></span>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            width: '100%',
            paddingTop: '1rem',
            marginTop: '0.5rem',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#555',
              fontSize: '0.8rem',
            }}>
              © 2024 - {currentYear} By 偏铝酸钠
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
