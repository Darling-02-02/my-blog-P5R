// 「我自己」独立页：个人简介 + 资料分享从 /explore 搬过来（首页内容区不再出现这两块）。
// 外壳直接复用 ContentSection：背景、侧栏、以及 .home-content-block / .home-profile-grid /
// .home-profile-pane 的窄屏规则都在那边，这里只写区块内容。
import type { CSSProperties } from 'react';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const blockStyle: CSSProperties = {
  marginBottom: '4rem',
  padding: 0,
  background: 'transparent',
  borderRadius: 0,
  border: 'none',
};

const paneStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: '14px',
  padding: '1.25rem',
};

// 资料分享：这几条在 fd8c7c1 里被换成「神秘力量」占位文案，链接本身还在 git 历史里，
// 现在按原样放回来（只放真实地址，不编介绍词）。
const shareLinks = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Papers with Code', url: 'https://paperswithcode.com' },
  { name: 'Hugging Face', url: 'https://huggingface.co' },
  { name: 'Bioinformatics Workbook', url: 'https://bioinformaticsworkbook.org' },
];

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
    {/* 个人简介 */}
    <section id="profile" className="home-content-block" style={blockStyle}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
        <span style={{ color: '#ff0040' }}>个人</span>简介
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
        离神很近，也就是离人很远。——一个臭看番的。
      </p>

      <div className="home-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginBottom: '3rem' }}>
        <div className="home-profile-pane" style={paneStyle}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>📚 资料分享</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shareLinks.map((link) => (
              <li key={link.url} style={{ marginBottom: '0.9rem' }}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#ff0040', fontWeight: '600', fontSize: '1.05rem', textDecoration: 'none' }}
                >
                  {link.name}
                </a>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '0.5rem', wordBreak: 'break-all' }}>
                  {link.url.replace(/^https?:\/\//, '')}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-profile-pane" style={paneStyle}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>💡 兴趣爱好</h3>
          <ul style={{ color: 'var(--text-body)', fontSize: '1.1rem', lineHeight: 2.2, paddingLeft: '1.2rem', listStyle: 'none' }}>
            {interests.map((item, index) => (
              <li key={item} style={index === 0 ? { color: '#ff0040', fontWeight: 500 } : { marginTop: index === 1 ? '0.5rem' : undefined }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
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
