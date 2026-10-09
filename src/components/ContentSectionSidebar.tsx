// 首页内容区左侧栏：个人资料、公告、标签、网站资讯四张卡片及它们的取数与常量。
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { fetchRepoStats, type RepoStats } from '../lib/repo-stats';
import { recordVisit, type SiteVisits } from '../lib/site-visits';
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
  const { location, weather, isPrecise, isLocating, requestPreciseLocation } = useLocationWeather();
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
    // 后台标签页里的定时器会被浏览器压成 1 分钟一跳，切回来立刻对一次表。
    document.addEventListener('visibilitychange', updateTime);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', updateTime);
    };
  }, []);

  return (
    <SidebarCard title="公告" icon="📢">
      <div style={{ minHeight: '140px' }}>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: 0 }}>
          🌍 欢迎来自 <strong style={{ color: '#ff0040' }}>{location}</strong> 的小伙伴
          {!isPrecise && (
            <button
              type="button"
              onClick={requestPreciseLocation}
              disabled={isLocating}
              style={{ marginLeft: '0.4rem', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '0.1rem 0.45rem', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: isLocating ? 'progress' : 'pointer' }}
            >
              {isLocating ? '定位中…' : '📍 用当前位置'}
            </button>
          )}
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

// 站点资讯：站点是构建期固化的，所以文章数和更新时间直接跟仓库走（正的这部分会有约 1 分钟重建延迟），
// 访客数/访问量来自 KV 计数器。两边取不到就退回构建期数字或显示「—」，不编。
const formatUpdatedAt = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const StatsCard = () => {
  const { articles } = useArticles();
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
  const [visits, setVisits] = useState<SiteVisits | null>(null);

  useEffect(() => {
    let active = true;
    void fetchRepoStats().then((result) => {
      if (active) setRepoStats(result);
    });
    void recordVisit().then((result) => {
      if (active) setVisits(result);
    });
    return () => {
      active = false;
    };
  }, []);

  // 仓库里有、构建期那份里还没有的，就是后台已经提交但线上还没重建完的文章。
  const rebuilding = repoStats ? Math.max(0, repoStats.articleCount - articles.length) : 0;
  const latestArticleDate = articles.reduce((latest, article) => (article.date > latest ? article.date : latest), '');
  const updatedAt = repoStats?.updatedAt ?? latestArticleDate;
  const counterHint = visits ? undefined : '访客统计还没接上，先显示 —';
  const items = [
    { key: 'articles', label: '文章数目', icon: '📝', value: String(repoStats?.articleCount ?? articles.length), note: rebuilding ? `（${rebuilding} 篇正在重建）` : '', title: undefined },
    { key: 'visitors', label: '访客数', icon: '👥', value: visits ? String(visits.uv) : '—', note: '', title: counterHint },
    { key: 'views', label: '访问量', icon: '👁️', value: visits ? String(visits.pv) : '—', note: '', title: counterHint },
  ];

  return (
    <SidebarCard title="网站资讯" icon="📊">
      {items.map(item => (
        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
          <span title={item.title} style={{ color: '#ff0040', fontWeight: '700', fontSize: '1rem', textAlign: 'right' }}>
            {item.value}
            {item.note && <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.78rem', marginLeft: '0.3rem' }}>{item.note}</span>}
          </span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} title={updatedAt ? new Date(updatedAt).toLocaleString('zh-CN', { hour12: false }) : undefined}>
          更新: {formatUpdatedAt(updatedAt)}
        </span>
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
