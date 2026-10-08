// 首页内容区左侧栏：个人资料、公告、标签、网站资讯四张卡片及它们的取数与常量。
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { useLocationWeather } from './useLocationWeather';

const base = import.meta.env.BASE_URL;
const sidebarBackground = 'var(--bg-card)';

const announcementSlogans = [
  '凡所有相，皆是虚妄',
  '天地不仁，以万物为刍狗',
  '人类的悲欢并不相通，我只觉得他们吵闹',
  '他人即地狱',
  '存在先于本质',
  '人是一根会思考的芦苇',
  '上帝死了，是我们杀了他',
  '未经审视的人生不值得过',
  '人是生而自由的，却无往不在枷锁之中',
  '认识你自己',
];

const formatLastUpdate = () => new Date().toLocaleString('zh-CN', { hour12: false });

const clearLegacySiteStats = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('blog_visitors');
  localStorage.removeItem('blog_views');
  localStorage.removeItem('blog_has_visited');
};

const getInitialSiteStats = () => {
  clearLegacySiteStats();

  return {
    articles: 0,
    visitors: 0,
    views: 0,
    lastUpdate: formatLastUpdate(),
  };
};

// 侧边栏卡片
const SidebarCard = ({ 
  children, 
  title,
  icon,
}: { 
  children: React.ReactNode; 
  title?: string;
  icon?: string;
}) => (
  <div style={{
    background: sidebarBackground,
    borderRadius: '14px',
    border: '1px solid var(--border-card)',
    backdropFilter: 'blur(15px)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  }}>
    {title && (
      <div style={{
        padding: '1.1rem 1.4rem',
        borderBottom: '1px solid var(--border-card)',
        fontWeight: '700',
        color: 'var(--text-heading)',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {icon && <span>{icon}</span>}
        {title}
      </div>
    )}
    <div style={{ padding: title ? '1.1rem 1.4rem' : '1.4rem' }}>
      {children}
    </div>
  </div>
);

// 个人资料
const ProfileCard = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const socials = [
    { icon: '💬', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { icon: '📺', link: 'https://space.bilibili.com/84526582' },
    { icon: '🐙', link: 'https://github.com/Darling-02-02' },
    { icon: '🎮', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
  ];
  return (
    <SidebarCard>
      <div style={{ textAlign: 'center' }}>
        <div 
          onMouseEnter={() => setIsSpinning(true)}
          onMouseLeave={() => setIsSpinning(false)}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: `url(${base}头像.jpg) center/cover`,
            border: '3px solid rgba(255, 0, 64, 0.5)',
            margin: '0 auto 1rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
            transition: 'border-color 0.3s ease',
          }}
        />
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem', color: '#ff0040' }}>灵敏度加满</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {socials.map((s, i) => (
            <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg-social)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-social-hover)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-social)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >{s.icon}</a>
          ))}
        </div>
      </div>
      <style>{`@keyframes avatarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidebarCard>
  );
};

// 公告
const AnnouncementCard = () => {
  const { location, weather } = useLocationWeather();
  const [time, setTime] = useState('');
  const [slogan] = useState(
    () => announcementSlogans[Math.floor(Math.random() * announcementSlogans.length)],
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SidebarCard title="公告" icon="📢">
      <div style={{ minHeight: '140px' }}>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: 0 }}>
          🌍 欢迎来自 <strong style={{ color: '#ff0040' }}>{location}</strong> 的小伙伴
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: '0.6rem 0' }}>
          ⏰ 现在时间：<strong>{time}</strong>
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: '0 0 0.8rem 0' }}>
          🌤️ 今天天气：<strong style={{ color: '#ff0040' }}>{weather}</strong>
        </p>
        <div style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>
            💭 {slogan}
          </p>
        </div>
      </div>
    </SidebarCard>
  );
};

// 标签
const TagsCard = () => {
  const navigate = useNavigate();
  const { articles } = useArticles();
  const { getTagData } = useContent();
  const tagData = getTagData(articles);

  // 一篇文章都没有的时候这张卡只剩一个空盒子（后台新建的空栏目就是这样），直接不出。
  if (!tagData.length) {
    return null;
  }

  const getTagSize = (count: number) => {
    if (count >= 3) return { fontSize: '1rem', padding: '0.4rem 0.8rem' };
    if (count >= 2) return { fontSize: '0.85rem', padding: '0.3rem 0.65rem' };
    return { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };
  };
  return (
    <SidebarCard title="标签" icon="🏷️">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
        {tagData.map(tag => {
          const size = getTagSize(tag.count);
          return (
            <span 
              key={tag.name}
              onClick={() => navigate(`/tag/${encodeURIComponent(tag.name)}`)}
              style={{ 
                ...size,
                color: '#ff0040',
                fontWeight: tag.count >= 3 ? '700' : '500',
                background: 'var(--bg-tag)', 
                border: '1px solid var(--border-tag)', 
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(255,0,64,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              #{tag.name}
            </span>
          );
        })}
      </div>
    </SidebarCard>
  );
};

// 网站资讯
const StatsCard = () => {
  const { articles } = useArticles();
  const [stats, setStats] = useState(() => getInitialSiteStats());

  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        lastUpdate: formatLastUpdate(),
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);
  
  const items = [
    { label: '文章数目', value: articles.length, icon: '📝' },
    { label: '访客数', value: stats.visitors, icon: '👥' },
    { label: '访问量', value: stats.views, icon: '👁️' },
  ];
  return (
    <SidebarCard title="网站资讯" icon="📊">
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
          <span style={{ color: '#ff0040', fontWeight: '700', fontSize: '1rem' }}>{item.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>更新: {stats.lastUpdate}</span>
      </div>
    </SidebarCard>
  );
};

// 左侧边栏（固定）
const Sidebar = () => (
  <aside className="home-sidebar" style={{
    position: 'sticky',
    top: '5.5rem',
    width: '260px',
    flexShrink: 0,
    alignSelf: 'flex-start',
  }}>
    <ProfileCard />
    <AnnouncementCard />
    <TagsCard />
    <StatsCard />
  </aside>
);

export default Sidebar;
