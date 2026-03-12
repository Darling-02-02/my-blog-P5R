import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { articles } from '../data/articles';

const base = import.meta.env.BASE_URL;

// 侧边栏卡片容器
export const SidebarCard = ({ 
  children, 
  title,
  icon,
  delay = 0 
}: { 
  children: React.ReactNode; 
  title?: string;
  icon?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    style={{
      background: 'rgba(255, 255, 255, 0.75)',
      borderRadius: '12px',
      border: '1px solid rgba(200, 200, 200, 0.3)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginBottom: '1rem',
    }}
  >
    {title && (
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid rgba(200, 200, 200, 0.2)',
        fontWeight: '700',
        color: '#333',
        fontSize: '0.95rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </div>
    )}
    <div style={{ padding: title ? '1rem 1.25rem' : '1.25rem' }}>
      {children}
    </div>
  </motion.div>
);

// 个人资料卡片
export const ProfileCard = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const socials = [
    { name: 'QQ', icon: '💬', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { name: 'Bilibili', icon: '📺', link: 'https://space.bilibili.com/84526582' },
    { name: 'GitHub', icon: '🐙', link: 'https://github.com/Darling-02-02' },
    { name: 'Steam', icon: '🎮', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
  ];
  return (
    <SidebarCard delay={0}>
      <div style={{ textAlign: 'center' }}>
        <div 
          onMouseEnter={() => setIsSpinning(true)}
          onMouseLeave={() => setIsSpinning(false)}
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `url(${base}头像.jpg) center/cover`,
            border: '3px solid rgba(255, 0, 64, 0.5)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
            margin: '0 auto 1rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
          }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.25rem' }}>灵敏度加满</h2>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {socials.map(social => (
            <motion.a key={social.name} href={social.link} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem', border: '1px solid rgba(0, 0, 0, 0.1)' }}>{social.icon}</motion.a>
          ))}
        </div>
      </div>
      <style>{`@keyframes avatarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidebarCard>
  );
};

// 公告卡片
export const AnnouncementCard = () => (
  <SidebarCard title="公告" icon="📢" delay={0.1}>
    <div style={{ background: 'rgba(255, 0, 64, 0.05)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255, 0, 64, 0.1)' }}>
      <p style={{ color: '#333', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}><strong>人生是旷野，不是轨道</strong></p>
    </div>
    <div style={{ marginTop: '0.75rem' }}>
      <p style={{ color: '#666', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>请保持批判思维<br/>请先思考后行动</p>
    </div>
  </SidebarCard>
);

// 分类卡片
export const CategoriesCard = () => {
  const categories = [
    { name: '生物信息', count: 3, color: '#ff6b6b' },
    { name: '三维重建', count: 1, color: '#4ecdc4' },
    { name: '机器学习', count: 1, color: '#45b7d1' },
    { name: '学习ing', count: 3, color: '#96ceb4' },
  ];
  return (
    <SidebarCard title="分类" icon="📁" delay={0.2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '6px', cursor: 'pointer' }}>
            <span style={{ color: '#333', fontSize: '0.85rem' }}>{cat.name}</span>
            <span style={{ color: '#fff', fontSize: '0.75rem', background: cat.color, padding: '0.1rem 0.5rem', borderRadius: '10px' }}>{cat.count}</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  );
};

// 标签卡片
export const TagsCard = () => {
  const tags = ['生物信息', 'Python', '三维重建', 'NeRF', '机器学习', 'Docker', 'CI/CD'];
  return (
    <SidebarCard title="标签" icon="🏷️" delay={0.3}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {tags.map(tag => (
          <span key={tag} style={{ padding: '0.25rem 0.75rem', background: 'rgba(255, 0, 64, 0.1)', border: '1px solid rgba(255, 0, 64, 0.2)', borderRadius: '15px', fontSize: '0.75rem', color: '#ff0040', cursor: 'pointer' }}>#{tag}</span>
        ))}
      </div>
    </SidebarCard>
  );
};

// 网站资讯卡片
export const StatsCard = () => {
  const [stats, setStats] = useState(() => {
    const totalWords = articles.reduce((sum, article) => sum + (article.content ? article.content.length : 0), 0);

    return {
      articles: articles.length,
      words: totalWords,
      visitors: Math.floor(Math.random() * 1000) + 500,
      views: Math.floor(Math.random() * 5000) + 2000,
      lastUpdate: new Date().toLocaleString('zh-CN'),
    };
  });

  useEffect(() => {
    const interval = setInterval(() => setStats(prev => ({ ...prev, lastUpdate: new Date().toLocaleString('zh-CN') })), 60000);
    return () => clearInterval(interval);
  }, []);
  const statItems = [
    { label: '文章数目', value: stats.articles, icon: '📝' },
    { label: '本站总字数', value: `${(stats.words / 1000).toFixed(1)}k`, icon: '📄' },
    { label: '本站访客数', value: stats.visitors, icon: '👥' },
    { label: '本站总访问量', value: stats.views, icon: '👁️' },
  ];
  return (
    <SidebarCard title="网站资讯" icon="📊" delay={0.4}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {statItems.map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '0.85rem' }}>{item.icon} {item.label}</span>
            <span style={{ color: '#333', fontWeight: '600', fontSize: '0.9rem' }}>{item.value}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <span style={{ color: '#999', fontSize: '0.75rem' }}>最后更新: {stats.lastUpdate}</span>
        </div>
      </div>
    </SidebarCard>
  );
};

// 主内容卡片容器
export const MainContentCard = ({ 
  children,
  delay = 0 
}: { 
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    viewport={{ once: true }} 
    transition={{ duration: 0.5, delay }} 
    style={{ 
      background: 'rgba(255, 255, 255, 0.75)', 
      borderRadius: '12px', 
      border: '1px solid rgba(200, 200, 200, 0.3)', 
      backdropFilter: 'blur(15px)', 
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', 
      padding: '2rem',
    }}
  >
    {children}
  </motion.div>
);

// 页面布局组件 - 左侧边栏 + 右侧主内容
interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      display: 'grid', 
      gridTemplateColumns: '280px 1fr', 
      gap: '1.5rem', 
      alignItems: 'start',
      padding: '0 1rem',
    }}>
      {/* 左侧边栏 */}
      <aside>
        <ProfileCard />
        <AnnouncementCard />
        <CategoriesCard />
        <TagsCard />
        <StatsCard />
      </aside>

      {/* 右侧主内容 */}
      <main>
        {children}
      </main>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 280px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          aside {
            order: 2;
          }
          main {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PageLayout;
