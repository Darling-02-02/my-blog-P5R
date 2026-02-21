import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AboutMe = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '母校',
      icon: '🎓',
      content: [
        { label: '高中', value: '某某中学', link: '' },
        { label: '大学', value: '某某大学（生物信息学）', link: '' },
      ],
    },
    {
      title: '兴趣爱好',
      icon: '🎮',
      list: [
        '编程，代码让我欲罢不能',
        '学习，探索未知的领域',
        '运动，保持健康的身体',
        '游戏，偶尔放松一下',
        '阅读，拓宽视野',
      ],
    },
    {
      title: '技能树',
      icon: '⚡',
      skills: [
        { name: 'Python', level: 90 },
        { name: 'R', level: 85 },
        { name: 'Linux', level: 80 },
        { name: '生物信息学', level: 85 },
        { name: '机器学习', level: 70 },
        { name: 'Docker', level: 65 },
      ],
    },
    {
      title: '常用网站',
      icon: '🔗',
      links: [
        { name: 'GitHub', url: 'https://github.com', desc: '代码托管' },
        { name: 'Google', url: 'https://www.google.com', desc: '搜索引擎' },
        { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'AI助手' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '技术问答' },
        { name: 'Bilibili', url: 'https://www.bilibili.com', desc: '学习娱乐' },
      ],
    },
    {
      title: '近期动态',
      icon: '📢',
      list: [
        '持续更新博客中...',
        '学习三维重建技术',
        '探索单细胞测序分析',
        '准备新项目开发',
      ],
    },
  ];

  const quotes = [
    '人生是旷野，不是轨道',
    'Stay hungry, stay foolish',
    '代码改变世界',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
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
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '3rem 2rem',
            background: 'rgba(26, 26, 26, 0.8)',
            borderRadius: '0',
            border: '2px solid var(--p5-red)',
            clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0 100%)',
            boxShadow: '8px 8px 0 rgba(255, 0, 64, 0.2)',
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
            color: 'var(--p5-light-gray)',
            marginBottom: '1.5rem',
          }}>
            灵敏度加满的blog 主人
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}>
            {[
              { label: '文章', value: '50+' },
              { label: '项目', value: '20+' },
              { label: '技能', value: '6+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: 'rgba(255, 0, 64, 0.2)',
                  border: '1px solid var(--p5-red)',
                }}
              >
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  color: 'var(--p5-red)',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--p5-light-gray)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.header>

        <motion.blockquote
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            borderLeft: '4px solid var(--p5-red)',
            paddingLeft: '1.5rem',
            margin: '2rem 0',
            fontStyle: 'italic',
            color: 'var(--p5-light-gray)',
            background: 'rgba(255, 0, 64, 0.1)',
            padding: '1.5rem',
            borderRadius: '0 8px 8px 0',
            fontSize: '1.1rem',
          }}
        >
          "{quotes[0]}"
          <div style={{
            fontSize: '0.9rem',
            marginTop: '0.5rem',
            textAlign: 'right',
            color: 'var(--p5-accent)',
          }}>
            —— Blog 主人
          </div>
        </motion.blockquote>

        {sections.map((section, sectionIndex) => (
          <motion.section
            key={section.title}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + sectionIndex * 0.1 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'rgba(26, 26, 26, 0.8)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 0, 64, 0.3)',
            }}
          >
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '900',
              marginBottom: '1.5rem',
              color: 'var(--p5-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              <span>{section.icon}</span>
              {section.title}
            </h2>

            {section.content && (
              <div style={{
                display: 'grid',
                gap: '1rem',
              }}>
                {section.content.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '5px',
                    }}
                  >
                    <span style={{
                      minWidth: '60px',
                      color: 'var(--p5-light-gray)',
                      fontWeight: '500',
                    }}>
                      {item.label}:
                    </span>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--p5-cyan)',
                          textDecoration: 'none',
                          borderBottom: '1px dashed var(--p5-cyan)',
                        }}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--p5-white)' }}>{item.value}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {section.list && (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {section.list.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid rgba(255, 0, 64, 0.1)',
                    }}
                  >
                    <span style={{
                      color: 'var(--p5-red)',
                      fontSize: '1.2rem',
                    }}>▸</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{item}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {section.skills && (
              <div style={{
                display: 'grid',
                gap: '1rem',
              }}>
                {section.skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{
                        color: 'var(--p5-white)',
                        fontWeight: '500',
                      }}>
                        {skill.name}
                      </span>
                      <span style={{
                        color: 'var(--p5-red)',
                        fontWeight: '700',
                      }}>
                        {skill.level}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--p5-red) 0%, var(--p5-accent) 100%)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {section.links && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}>
                {section.links.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 0, 64, 0.3)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      color: 'var(--p5-white)',
                      fontWeight: '700',
                      marginBottom: '0.25rem',
                    }}>
                      {link.name}
                    </div>
                    <div style={{
                      color: 'var(--p5-light-gray)',
                      fontSize: '0.85rem',
                    }}>
                      {link.desc}
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.section>
        ))}

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: 'center',
            padding: '2rem',
            borderTop: '1px solid rgba(255, 0, 64, 0.3)',
            marginTop: '3rem',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1rem',
          }}>
            {[
              { icon: '📧', url: '#' },
              { icon: '🐙', url: 'https://github.com' },
              { icon: '📺', url: 'https://space.bilibili.com' },
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 5 }}
                style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 0, 64, 0.2)',
                  border: '2px solid var(--p5-red)',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  textDecoration: 'none',
                }}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
          <p style={{
            color: 'var(--p5-light-gray)',
            fontSize: '0.9rem',
          }}>
            © 2026 灵敏度加满的blog
          </p>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default AboutMe;
