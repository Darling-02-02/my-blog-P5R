// 「我自己」独立页：个人简介从 /explore 搬过来（首页内容区不再出现这块）。
// 整页只留一张大卡片，内容从上往下排；外壳复用 ContentSection（背景、侧栏、窄屏规则都在那边）。
import type { CSSProperties } from 'react';
import { myselfContent } from '../data/myself';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const cardStyle: CSSProperties = {
  marginBottom: '4rem',
  // 窄屏别再吃 2rem 的内边距：手机上一张卡片就够挤了。
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: '14px',
};

const subHeadingStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '1.5rem',
};

const interests = [
  '👤 CN：灵敏度加满，欢迎扩列',
  '📸 摄影：偶尔拍拍，设备索尼zve10，镜头55mm',
  '🏃 中长跑：纵有疾风起！！',
  '💪 健身：卧推25kg，不中嘞',
  '🎨 画画：反正没在签绘墙上画过',
  '🎮 游戏：第九艺术！！3A永远滴神',
  '✨ 梦想能手握switch2、5090和PS5',
];

const MyselfContent = () => (
  <div className="home-main-card" style={{ background: 'transparent', borderRadius: '20px', border: 'none', boxShadow: 'none', padding: 0 }}>
    {/* 个人简介：整页一张大卡片，简介 / 神秘力量 / 兴趣爱好都在里面，不再拆成并列小卡 */}
    <section id="profile" className="home-content-block" style={cardStyle}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
        <span style={{ color: '#ff0040' }}>个人</span>简介
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
        离神很近，也就是离人很远。——一个臭看番的。
      </p>

      {/* 文案来自 src/content/myself.json，后台 /admin 的「🔮 个人简介」页签能改它。 */}
      <h3 style={subHeadingStyle}>🔮 神秘力量</h3>
      <p style={{ color: 'var(--text-body)', fontSize: '1.1rem', lineHeight: 2.2 }}>
        {myselfContent.mystic}
      </p>

      <h3 style={{ ...subHeadingStyle, marginTop: '2.5rem' }}>💡 兴趣爱好</h3>
      <ul style={{ color: 'var(--text-body)', fontSize: '1.1rem', lineHeight: 2.2, paddingLeft: 0, listStyle: 'none' }}>
        {interests.map((item, index) => (
          <li key={item} style={index === 0 ? { color: 'var(--text-link)', fontWeight: 500 } : { marginTop: index === 1 ? '0.5rem' : undefined }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  </div>
);

const MyselfPage = () => (
  <>
    <Header />
    <ContentSection standalone>
      <MyselfContent />
    </ContentSection>
    <Footer />
  </>
);

export default MyselfPage;
