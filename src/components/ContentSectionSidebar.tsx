// 首页内容区左侧栏：个人资料、公告、标签、网站资讯四张卡片及它们的取数与常量。
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { useTheme } from '../contexts/useTheme';
import { fetchRepoStats, type RepoStats } from '../lib/repo-stats';
import { recordVisit, type SiteVisits } from '../lib/site-visits';
import { useLocationWeather } from './useLocationWeather';

const base = import.meta.env.BASE_URL;
const sidebarBackground = 'var(--bg-card)';

const announcementSlogans = [
  '凡所有相，皆是虚妄',
  '天地不仁，以万物为刍狗',
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
    borderRadius: 'var(--radius-card)',
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
  // 图标换成各平台自己的官方标记：Simple Icons 的品牌色圆底 + 白色标记，存成 public/icon/*.svg。
  // 原来那套「白底圆角贴纸」PNG（96×96）缩到 34px 落在浅色卡片上，整排看着就是灰白一片；
  // SVG 每张不到 1.5KB，深浅两套主题都清楚（深色主题下深色那两张靠一圈浅灰描边站得住）。
  const socials = [
    { icon: `${base}icon/qq.svg`, label: 'QQ', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { icon: `${base}icon/bilibili.svg`, label: '哔哩哔哩', link: 'https://space.bilibili.com/84526582' },
    { icon: `${base}icon/github.svg`, label: 'GitHub', link: 'https://github.com/Darling-02-02' },
    { icon: `${base}icon/steam.svg`, label: 'Steam', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
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
            /* 描边跟着主题走。原来那圈品牌红是这张卡上唯一的彩色，去掉红之后留一圈中性的细边
               就够（首屏那张放大的头像连描边都没有，两处观感一致）。
               transition 一并删掉：这条 border-color 现在没有任何代码会改它。 */
            border: '3px solid var(--border-card)',
            margin: '0 auto 1rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
          }}
        />
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem', color: 'var(--accent)' }}>灵敏度加满</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {socials.map((s, i) => (
            <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" title={s.label} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <img src={s.icon} alt={s.label} width={34} height={34} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            </a>
          ))}
        </div>
      </div>
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
          🌍 欢迎来自 <strong style={{ color: 'var(--text-link)' }}>{location}</strong> 的小伙伴
          {!isPrecise && (
            <button
              type="button"
              onClick={requestPreciseLocation}
              disabled={isLocating}
              style={{ marginLeft: '0.4rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.6rem', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: isLocating ? 'progress' : 'pointer' }}
            >
              {isLocating ? '定位中…' : '📍 用当前位置'}
            </button>
          )}
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: '0.6rem 0' }}>
          ⏰ 现在时间：<strong>{time}</strong>
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.8, margin: '0 0 0.8rem 0' }}>
          🌤️ 今天天气：<strong style={{ color: 'var(--text-link)' }}>{weather}</strong>
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
// 每个标签一个固定色相（按名字算，同一个标签每次进来颜色都一样），深浅主题各给一个明度：
// 深色主题要亮一点才够对比，浅色主题压到 44% 才不会在白底上糊成一片。
const tagHue = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) % 360;
  return hash;
};

const TagsCard = () => {
  const navigate = useNavigate();
  const { articles } = useArticles();
  const { getTagData } = useContent();
  const { isDark } = useTheme();
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
      <style>{`
        .tag-chip:hover {
          animation: tag-wiggle 0.45s ease-in-out infinite;
        }

        /* 悬浮时左右来回晃：只动 transform，不触发重排 */
        @keyframes tag-wiggle {
          0%, 100% { transform: rotate(-5deg) scale(1.08); }
          50% { transform: rotate(5deg) scale(1.12); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tag-chip:hover { animation: none; transform: scale(1.08); }
        }
      `}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
        {tagData.map(tag => {
          const size = getTagSize(tag.count);
          return (
            <button
              type="button"
              key={tag.name}
              className="tag-chip"
              onClick={() => navigate(`/tag/${encodeURIComponent(tag.name)}`)}
              style={{
                ...size,
                color: `hsl(${tagHue(tag.name)} 72% ${isDark ? '70%' : '44%'})`,
                fontWeight: tag.count >= 3 ? '700' : '500',
                background: 'var(--bg-tag)',
                border: '1px solid var(--border-tag)',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'box-shadow 0.3s ease, color 0.2s ease',
                /* button 不继承页面字体，也不吃外边距重置，补两行免得尺寸跟隔壁的 span 版跑偏 */
                fontFamily: 'inherit',
                margin: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              #{tag.name}
            </button>
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

  // 仓库里有、这份页面里还没有的 = 后台已经提交，但你手上这个页面还是旧构建。
  // 注意这不代表"还在构建中"：构建通常 1 分钟左右就完，剩下的差距是浏览器没重新拉页面（SPA 不会自己刷新）。
  const rebuilding = repoStats ? Math.max(0, repoStats.articleCount - articles.length) : 0;
  const latestArticleDate = articles.reduce((latest, article) => (article.date > latest ? article.date : latest), '');
  const updatedAt = repoStats?.updatedAt ?? latestArticleDate;
  const counterHint = visits ? undefined : '访客统计还没接上，先显示 —';
  const items = [
    { key: 'articles', label: '文章数目', icon: '📝', value: String(repoStats?.articleCount ?? articles.length), note: rebuilding ? `（${rebuilding} 篇已上传，刷新页面就能看到）` : '', title: undefined },
    { key: 'visitors', label: '访客数', icon: '👥', value: visits ? String(visits.uv) : '—', note: '', title: counterHint },
    { key: 'views', label: '访问量', icon: '👁️', value: visits ? String(visits.pv) : '—', note: '', title: counterHint },
  ];

  return (
    <SidebarCard title="网站资讯" icon="📊">
      {items.map(item => (
        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
          <span title={item.title} style={{ color: 'var(--text-link)', fontWeight: '700', fontSize: '1rem', textAlign: 'right' }}>
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
