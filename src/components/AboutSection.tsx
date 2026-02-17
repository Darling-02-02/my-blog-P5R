import { motion } from 'framer-motion';

const AboutSection = () => {
  const stats = [
    { number: '50+', label: '篇教程' },
    { number: '20+', label: 'Pipeline项目' },
    { number: '6', label: '技术领域' },
    { number: '100%', label: '开源代码' },
  ];

  return (
    <section
      id="about"
      style={{
        padding: '6rem 2rem',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景图片 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/图片_1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0,
      }} />

      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        border: '1px solid rgba(255, 0, 64, 0.1)',
        borderRadius: '50%',
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '4rem',
          alignItems: 'center',
        }}>
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: '900',
              marginBottom: '1.5rem',
            }}>
              关于<span style={{ color: 'var(--p5-red)' }}>本站</span>
            </h2>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--p5-light-gray)',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
            }}>
              这是一个专注于编程学习路线和Pipeline代码分享的技术博客。我记录自己的学习历程，分享实用的代码片段和自动化工作流方案，帮助更多人高效学习编程。
            </p>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--p5-light-gray)',
              lineHeight: 1.8,
              marginBottom: '2rem',
            }}>
              从Python入门到DevOps实践，从数据处理到机器学习Pipeline，这里汇集了各领域的实战经验和最佳实践。所有代码开源，欢迎交流讨论！
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '1rem 2rem',
                background: 'var(--p5-red)',
                color: 'var(--p5-white)',
                border: 'none',
                borderRadius: '5px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              GitHub仓库
            </motion.button>
          </motion.div>

          {/* Right content - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2rem',
            }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: 'rgba(255, 0, 64, 0.15)',
                  border: '1px solid rgba(255, 0, 64, 0.4)',
                  borderRadius: '10px',
                  padding: '2rem',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: 'var(--p5-red)',
                  marginBottom: '0.5rem',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: '1rem',
                  color: 'var(--p5-light-gray)',
                }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
