import { PageLayout, MainContentCard } from './SidebarLayout';

const BentoSection = () => {
  return (
    <section id="bento" style={{ padding: 'clamp(2rem, 5vw, 4rem) 0', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <PageLayout>
        <MainContentCard>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(255, 0, 64, 0.2)' }}>个人简介</h1>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>🎓 母校</h2>
            <p style={{ color: '#666', lineHeight: 1.8 }}>大学：生物信息学专业</p>
          </section>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>💡 兴趣爱好</h2>
            <ul style={{ color: '#666', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li>写代码，解决问题让我欲罢不能</li>
              <li>学习，探索新知识永远充满热情</li>
              <li>健身，保持身体健康是一切的基础</li>
              <li>徒步，享受大自然的美景</li>
            </ul>
          </section>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>🎯 人生清单</h2>
            <ul style={{ color: '#666', lineHeight: 2, paddingLeft: '1.5rem' }}>
              <li>⬜ 健身</li>
              <li>⬜ 徒步</li>
              <li>⬜ 中长跑</li>
            </ul>
          </section>
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>💬 来说段话</h2>
            <blockquote style={{ background: 'rgba(255, 0, 64, 0.05)', borderLeft: '4px solid #ff0040', padding: '1rem 1.5rem', margin: 0, color: '#666', fontStyle: 'italic', lineHeight: 1.8 }}>
              "Stay hungry, stay foolish."
              <br />
              <span style={{ fontSize: '0.85rem', color: '#999' }}>—— 灵敏度加满</span>
            </blockquote>
          </section>
        </MainContentCard>
      </PageLayout>
    </section>
  );
};

export default BentoSection;
