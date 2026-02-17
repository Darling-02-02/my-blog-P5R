import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    导航: ['首页', '文章', '关于', '联系'],
    分类: ['动漫评测', '新番推荐', 'Cosplay', '声优专题'],
    社交: ['Twitter', 'Bilibili', '微博', 'Discord'],
  };

  return (
    <footer
      id="contact"
      style={{
        background: 'rgba(10, 10, 10, 0.6)',
        borderTop: '2px solid rgba(255, 0, 64, 0.5)',
        padding: '4rem 2rem 2rem',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Main footer content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand section */}
          <div>
            <motion.h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                color: 'var(--p5-red)',
                marginBottom: '1rem',
              }}
              className="glitch"
              data-text="ANIME BLOG"
            >
              ANIME BLOG
            </motion.h3>
            <p style={{
              color: 'var(--p5-light-gray)',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}>
              探索二次元世界的无限可能，分享ACG文化的精彩瞬间。
            </p>
            {/* Social icons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
            }}>
              {['🐦', '📺', '📝', '💬'].map((icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.2, y: -5 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--p5-dark-gray)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    textDecoration: 'none',
                    border: '1px solid var(--p5-gray)',
                  }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'var(--p5-white)',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {title}
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {links.map((link) => (
                  <li key={link} style={{ marginBottom: '0.5rem' }}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 5, color: 'var(--p5-red)' }}
                      style={{
                        color: 'var(--p5-light-gray)',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div style={{
          background: 'rgba(26, 26, 26, 0.5)',
          border: '1px solid rgba(255, 0, 64, 0.3)',
          borderRadius: '10px',
          padding: '2rem',
          marginBottom: '3rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          <h4 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: '1rem',
          }}>
            订阅我们的 newsletter
          </h4>
          <p style={{
            color: 'var(--p5-light-gray)',
            marginBottom: '1.5rem',
          }}>
            获取最新的动漫资讯和文章更新
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            <input
              type="email"
              placeholder="输入你的邮箱"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.75rem 1rem',
                background: 'var(--p5-gray)',
                border: '1px solid var(--p5-gray)',
                borderRadius: '5px',
                color: 'var(--p5-white)',
                fontSize: '1rem',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.75rem 2rem',
                background: 'var(--p5-red)',
                color: 'var(--p5-white)',
                border: 'none',
                borderRadius: '5px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              订阅
            </motion.button>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--p5-gray)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <p style={{
            color: 'var(--p5-light-gray)',
            fontSize: '0.9rem',
          }}>
            © {currentYear} Anime Blog. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            gap: '2rem',
          }}>
            <a href="#" style={{
              color: 'var(--p5-light-gray)',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              隐私政策
            </a>
            <a href="#" style={{
              color: 'var(--p5-light-gray)',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}>
              使用条款
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
