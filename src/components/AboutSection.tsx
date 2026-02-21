import { motion } from 'framer-motion';
import { PageLayout, MainContentCard } from './SidebarLayout';

const AboutSection = () => {
  const stats = [
    { number: '50+', label: '篇教程' },
    { number: '20+', label: 'Pipeline项目' },
    { number: '6', label: '技术领域' },
    { number: '100%', label: '开源代码' },
  ];

  return (
    <section id="about" style={{ padding: 'clamp(2rem, 5vw, 4rem) 0', position: 'relative', zIndex: 1 }}>
      <PageLayout>
        <MainContentCard>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ff0040' }}>关于</span>本站
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(255, 0, 64, 0.2)' }}>
            了解更多关于这个博客的信息
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>📝 博客介绍</h2>
            <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
              这是一个专注于编程学习路线和Pipeline代码分享的技术博客。我记录自己的学习历程，分享实用的代码片段和自动化工作流方案，帮助更多人高效学习编程。
            </p>
            <p style={{ color: '#666', lineHeight: 1.8 }}>
              从Python入门到DevOps实践，从数据处理到机器学习Pipeline，这里汇集了各领域的实战经验和最佳实践。所有代码开源，欢迎交流讨论！
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>📊 网站数据</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: 'rgba(255, 0, 64, 0.08)',
                    border: '1px solid rgba(255, 0, 64, 0.2)',
                    borderRadius: '10px',
                    padding: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff0040', marginBottom: '0.25rem' }}>
                    {stat.number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>🔗 相关链接</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <motion.a
                href="https://github.com/Darling-02-02"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ff0040',
                  color: '#fff',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                GitHub 仓库
              </motion.a>
            </div>
          </section>
        </MainContentCard>
      </PageLayout>
    </section>
  );
};

export default AboutSection;
