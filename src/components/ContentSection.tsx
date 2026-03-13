import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import { useTheme } from '../contexts/useTheme';
import { pickCoverForArticle } from './coverImage';

const base = import.meta.env.BASE_URL;
const photographyBanner = `${base}kaguya-background.jpg`;
const categoryColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#f39c12', '#8e44ad'];

const announcementSlogans = [
  '凡所有相，皆是虚妄',
  '天地不仁，以万物为刍狗',
  '他人即地狱',
  '存在先于本质',
  '未经审视的人生不值得过',
  '认识你自己',
];

const categoryData = Object.entries(
  articles.reduce<Record<string, number>>((acc, article) => {
    acc[article.category] = (acc[article.category] ?? 0) + 1;
    return acc;
  }, {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  .map(([name, count], index) => ({
    name,
    count,
    color: categoryColors[index % categoryColors.length],
  }));

const tagData = Object.entries(
  articles.reduce<Record<string, number>>((acc, article) => {
    article.tags.forEach((tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  .map(([name, count]) => ({ name, count }));

const formatNow = () =>
  new Date().toLocaleString('zh-CN', {
    hour12: false,
  });

const formatLocationLabel = (parts: Array<string | undefined | null>) => {
  const cleaned = parts.map((part) => part?.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(' · ') : '地球';
};

const loadBusuanzi = () => {
  if (typeof document === 'undefined' || document.getElementById('busuanzi-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'busuanzi-script';
  script.async = true;
  script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  document.body.appendChild(script);
};

const GiscusComments = () => {
  const { isDark } = useTheme();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'Darling-02-02/my-blog-P5R');
    script.setAttribute('data-repo-id', 'R_kgDORSAoMw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDORSAoM84C25Zv');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', isDark ? 'dark_dimmed' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    const container = document.getElementById('giscus-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isDark]);

  return <div id="giscus-container" style={{ minHeight: '200px' }} />;
};

const SidebarCard = ({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  title?: string;
  icon?: string;
}) => (
  <div
    style={{
      background: 'var(--bg-sidebar-card)',
      borderRadius: '18px',
      border: '1px solid var(--border-card)',
      backdropFilter: 'blur(15px)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      marginBottom: '1.15rem',
    }}
  >
    {title && (
      <div
        style={{
          padding: '1rem 1.2rem',
          borderBottom: '1px solid var(--border-card)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          fontSize: '0.98rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {icon && <span>{icon}</span>}
        {title}
      </div>
    )}
    <div style={{ padding: title ? '1rem 1.2rem' : '1.2rem' }}>{children}</div>
  </div>
);

const ProfileCard = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const socials = [
    { icon: 'QQ', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { icon: 'Bili', link: 'https://space.bilibili.com/84526582' },
    { icon: 'GitHub', link: 'https://github.com/Darling-02-02' },
    { icon: 'Steam', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
  ];

  return (
    <SidebarCard>
      <div style={{ textAlign: 'center' }}>
        <div
          onMouseEnter={() => setIsSpinning(true)}
          onMouseLeave={() => setIsSpinning(false)}
          style={{
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            background: `url(${base}头像.jpg) center/cover`,
            border: '3px solid rgba(255, 0, 64, 0.5)',
            margin: '0 auto 1rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
            transition: 'border-color 0.3s ease',
          }}
        />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ff0040' }}>灵敏度加满</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {socials.map((social) => (
            <a
              key={social.icon}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                minWidth: '54px',
                height: '34px',
                borderRadius: '999px',
                background: 'var(--bg-social)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                transition: 'all 0.3s ease',
                padding: '0 0.7rem',
              }}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
      <style>{`@keyframes avatarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidebarCard>
  );
};

type LocationSource = 'pending' | 'gps' | 'ip';

const AnnouncementCard = () => {
  const [location, setLocation] = useState('正在定位...');
  const [locationSource, setLocationSource] = useState<LocationSource>('pending');
  const [weather, setWeather] = useState('等待定位完成');
  const [time, setTime] = useState(formatNow());
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [slogan] = useState(
    () => announcementSlogans[Math.floor(Math.random() * announcementSlogans.length)],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(formatNow());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const reverseGeocode = async (latitude: number, longitude: number) => {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
      );
      const data = await response.json();

      if (cancelled) {
        return;
      }

      setLocation(
        formatLocationLabel([
          data.countryName,
          data.principalSubdivision,
          data.city || data.locality,
        ]),
      );
      setLocationSource('gps');
      setCoords({ latitude, longitude });
    };

    const locateByIp = async () => {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (cancelled) {
        return;
      }

      setLocation(formatLocationLabel([data.country_name, data.region, data.city]));
      setLocationSource('ip');

      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setCoords({ latitude: data.latitude, longitude: data.longitude });
      }
    };

    const locate = async () => {
      try {
        if (!navigator.geolocation) {
          throw new Error('geolocation unavailable');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 8000,
          });
        });

        await reverseGeocode(position.coords.latitude, position.coords.longitude);
      } catch {
        try {
          await locateByIp();
        } catch {
          if (!cancelled) {
            setLocation('定位失败');
            setLocationSource('pending');
          }
        }
      }
    };

    void locate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coords) {
      return;
    }

    let cancelled = false;

    const weatherCodeText = (code: number) => {
      const map: Record<number, string> = {
        0: '晴',
        1: '少云',
        2: '多云',
        3: '阴',
        45: '雾',
        48: '雾凇',
        51: '小毛毛雨',
        53: '毛毛雨',
        55: '强毛毛雨',
        61: '小雨',
        63: '中雨',
        65: '大雨',
        71: '小雪',
        73: '中雪',
        75: '大雪',
        80: '阵雨',
        81: '强阵雨',
        82: '暴雨',
        95: '雷暴',
      };

      return map[code] ?? '未知';
    };

    const updateWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
        );
        const data = await response.json();
        const current = data.current;

        if (!current || cancelled) {
          return;
        }

        const weatherText = weatherCodeText(Number(current.weather_code));
        const temperature = Number(current.temperature_2m).toFixed(1);
        const windSpeed = Number(current.wind_speed_10m).toFixed(1);
        setWeather(`${weatherText} ${temperature}°C · 风速 ${windSpeed} km/h`);
      } catch {
        if (!cancelled) {
          setWeather('天气获取失败');
        }
      }
    };

    void updateWeather();
    const timer = window.setInterval(updateWeather, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [coords]);

  return (
    <SidebarCard title="公告" icon="INFO">
      <div style={{ display: 'grid', gap: '0.7rem' }}>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          📍 位置：<strong style={{ color: '#ff0040' }}>{location}</strong>
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          🛰 来源：
          <strong style={{ color: 'var(--text-primary)' }}>
            {locationSource === 'gps'
              ? ' 设备定位'
              : locationSource === 'ip'
                ? ' IP 粗略定位'
                : ' 定位中'}
          </strong>
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          ⏰ 现在时间：<strong>{time}</strong>
        </p>
        <p style={{ color: 'var(--text-card-body)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          🌤 天气：<strong style={{ color: '#ff0040' }}>{weather}</strong>
        </p>
        <div style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.75rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>
            💭 {slogan}
          </p>
        </div>
      </div>
    </SidebarCard>
  );
};

const CategoriesCard = () => {
  const navigate = useNavigate();

  return (
    <SidebarCard title="分类" icon="TYPE">
      {categoryData.map((category) => (
        <div
          key={category.name}
          onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 0.8rem',
            background: 'var(--bg-category-item)',
            borderRadius: '10px',
            marginBottom: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <span style={{ color: '#ff0040', fontWeight: 600, fontSize: '0.9rem' }}>{category.name}</span>
          <span
            style={{
              color: '#fff',
              fontSize: '0.75rem',
              background: category.color,
              padding: '0.15rem 0.5rem',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            {category.count}
          </span>
        </div>
      ))}
    </SidebarCard>
  );
};

const TagsCard = () => {
  const navigate = useNavigate();

  const getTagSize = (count: number) => {
    if (count >= 3) return { fontSize: '1rem', padding: '0.4rem 0.8rem' };
    if (count >= 2) return { fontSize: '0.85rem', padding: '0.3rem 0.65rem' };
    return { fontSize: '0.75rem', padding: '0.25rem 0.5rem' };
  };

  return (
    <SidebarCard title="标签" icon="TAG">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
        {tagData.map((tag) => {
          const size = getTagSize(tag.count);

          return (
            <span
              key={tag.name}
              onClick={() => navigate(`/tag/${encodeURIComponent(tag.name)}`)}
              style={{
                ...size,
                color: '#ff0040',
                fontWeight: tag.count >= 3 ? 700 : 500,
                background: 'var(--bg-tag)',
                border: '1px solid var(--border-tag)',
                borderRadius: '15px',
                cursor: 'pointer',
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

const StatsCard = () => {
  const [lastUpdate, setLastUpdate] = useState(formatNow());

  useEffect(() => {
    loadBusuanzi();

    const timer = window.setInterval(() => {
      setLastUpdate(formatNow());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <SidebarCard title="网站资讯" icon="LIVE">
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>文章数</span>
          <span style={{ color: '#ff0040', fontWeight: 700 }}>{articles.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>访客数</span>
          <span id="busuanzi_container_site_uv" style={{ color: '#ff0040', fontWeight: 700 }}>
            <span id="busuanzi_value_site_uv">--</span>
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>访问量</span>
          <span id="busuanzi_container_site_pv" style={{ color: '#ff0040', fontWeight: 700 }}>
            <span id="busuanzi_value_site_pv">--</span>
          </span>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border-section)', paddingTop: '0.7rem', marginTop: '0.7rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>实时统计更新时间：{lastUpdate}</span>
      </div>
    </SidebarCard>
  );
};

const Sidebar = () => (
  <aside
    className="home-sidebar"
    style={{
      position: 'sticky',
      top: '5.5rem',
      width: '280px',
      flexShrink: 0,
      alignSelf: 'flex-start',
    }}
  >
    <ProfileCard />
    <AnnouncementCard />
    <CategoriesCard />
    <TagsCard />
    <StatsCard />
  </aside>
);

const BlogCard = ({ article, index }: { article: typeof articles[number]; index: number }) => {
  const navigate = useNavigate();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/article/${article.id}`)}
      style={{
        background: 'var(--bg-article-card)',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        cursor: 'pointer',
      }}
    >
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
        <img
          src={pickCoverForArticle(article)}
          alt={article.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <span
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: '#ff0040',
            color: '#fff',
            padding: '0.28rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {article.category}
        </span>
      </div>
      <div style={{ padding: '1.2rem' }}>
        <h4
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-card-title)',
            marginBottom: '0.7rem',
            lineHeight: 1.5,
          }}
        >
          {article.title}
        </h4>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
          {article.date} · {article.readTime}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7 }}>{article.excerpt}</p>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                color: '#ff0040',
                fontSize: '0.8rem',
                background: 'var(--bg-tag)',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

const MainContent = () => {
  const navigate = useNavigate();
  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  const photographyArticle = useMemo(
    () => sortedArticles.find((article) => article.category === '摄影'),
    [sortedArticles],
  );

  return (
    <div
      className="home-main-card"
      style={{
        background: 'var(--bg-main-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-card)',
        backdropFilter: 'blur(15px)',
        boxShadow: 'var(--shadow-card)',
        padding: '4rem',
      }}
    >
      <section id="profile" style={{ marginBottom: '5.5rem' }}>
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>个人</span>简介
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            marginBottom: '3rem',
            paddingBottom: '1.6rem',
            borderBottom: '2px solid var(--border-section)',
          }}
        >
          离神很近，也就是离人很远。一个臭看番的，顺便把技术和生活碎片都塞进这里。
        </p>

        <div className="home-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
              教育背景
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', lineHeight: 2 }}>河南农业大学 · 本科 · 茶学</p>
            <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', lineHeight: 2 }}>福建农林大学 · 硕士 · 智慧园艺</p>
            <p style={{ color: '#ff0040', fontSize: '1rem', lineHeight: 1.9, fontWeight: 600, marginTop: '0.8rem' }}>
              选择大于努力，但选择之后得把路走出来。
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
              兴趣爱好
            </h3>
            <ul style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 2, paddingLeft: '1.1rem' }}>
              <li>摄影：偶尔拍拍，设备是索尼 ZV-E10，镜头 55mm。</li>
              <li>中长跑：纵有疾风起，也要继续往前顶。</li>
              <li>健身：练得一般，但比昨天强一点就算赚。</li>
              <li>游戏：第九艺术，3A 永远有牌面。</li>
              <li>画画：手残也能靠热爱撑着继续画。</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="blog" style={{ marginBottom: '5.5rem' }}>
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>幕后</span>
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            marginBottom: '3rem',
            paddingBottom: '1.6rem',
            borderBottom: '2px solid var(--border-section)',
          }}
        >
          技术、随笔、学习记录和摄影都会从这里往外长。
        </p>

        <div
          className="home-post-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))',
            gap: '1.6rem',
          }}
        >
          {sortedArticles.map((article, index) => (
            <BlogCard key={article.id} article={article} index={index} />
          ))}
        </div>
      </section>

      <section id="photography" style={{ marginBottom: '5.5rem' }}>
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>摄影</span>栏
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            marginBottom: '3rem',
            paddingBottom: '1.6rem',
            borderBottom: '2px solid var(--border-section)',
          }}
        >
          先给这一栏腾出位置，后面会继续往里塞夜景、小物和情绪片。
        </p>

        <div
          className="photography-shell"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '1rem',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              position: 'relative',
              minHeight: '280px',
              borderRadius: '22px',
              overflow: 'hidden',
              border: '1px solid var(--border-card)',
            }}
          >
            <img
              src={photographyBanner}
              alt="摄影栏背景"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(10, 10, 16, 0.2), rgba(10, 10, 16, 0.78) 56%, rgba(255, 0, 64, 0.26))',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                padding: '1.6rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#fff',
                    fontSize: '0.78rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  PHOTO LOG
                </div>
                <h2 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginTop: '1rem', marginBottom: '0.8rem' }}>
                  把想留住的瞬间单独存档
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.8, maxWidth: '30rem' }}>
                  这一栏不打算做成普通图墙，而是把每次拍摄的想法、器材和现场情绪也一起留着。
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                {['夜景', '小物', '街拍', '55mm'].map((item) => (
                  <span
                    key={item}
                    style={{
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      padding: '0.28rem 0.65rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div
              style={{
                background: 'var(--bg-article-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '18px',
                padding: '1.2rem',
              }}
            >
              <div style={{ color: '#ff0040', fontWeight: 700, marginBottom: '0.65rem' }}>当前设定</div>
              <p style={{ color: 'var(--text-body)', lineHeight: 1.8 }}>
                先把摄影栏挂出来，后面会继续补独立图集、拍摄心得和器材记录。
              </p>
              <button
                type="button"
                onClick={() =>
                  photographyArticle
                    ? navigate(`/article/${photographyArticle.id}`)
                    : navigate(`/category/${encodeURIComponent('摄影')}`)
                }
                style={{
                  marginTop: '1rem',
                  border: 'none',
                  borderRadius: '999px',
                  background: '#ff0040',
                  color: '#fff',
                  padding: '0.75rem 1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                进入摄影栏
              </button>
            </div>

            <div
              style={{
                background: 'var(--bg-article-card)',
                border: '1px solid var(--border-card)',
                borderRadius: '18px',
                padding: '1.2rem',
              }}
            >
              <div style={{ color: '#ff0040', fontWeight: 700, marginBottom: '0.65rem' }}>想拍的东西</div>
              <ul style={{ color: 'var(--text-body)', lineHeight: 1.9, paddingLeft: '1.1rem' }}>
                <li>雨后路面的反光和霓虹</li>
                <li>普通房间里耐看的小物静物</li>
                <li>跑步前后那种有风感的街景</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="about" style={{ marginBottom: '5.5rem' }}>
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>关于</span>本站
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            marginBottom: '3rem',
            paddingBottom: '1.6rem',
            borderBottom: '2px solid var(--border-section)',
          }}
        >
          一个技术、兴趣、学习记录和自我表达混合在一起的私人博客。
        </p>

        <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', lineHeight: 2 }}>
          垂死挣扎的双非硕，一切以实际为准。这里不只放代码和文章，也会放一些还没来得及整理成结论的东西。
        </p>

        <div
          style={{
            marginTop: '2rem',
            padding: '1.3rem',
            background: 'var(--bg-about-box)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 0, 64, 0.1)',
          }}
        >
          <p style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
            联系邮箱：
            <a
              href="mailto:19503862693@163.com"
              style={{ color: '#ff0040', textDecoration: 'none', fontWeight: 600 }}
            >
              {' '}
              19503862693@163.com
            </a>
          </p>
        </div>
      </section>

      <section id="comments">
        <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>留言</span>板
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            marginBottom: '3rem',
            paddingBottom: '1.6rem',
            borderBottom: '2px solid var(--border-section)',
          }}
        >
          欢迎留下你的足迹。
        </p>

        <div
          className="home-comment-box"
          style={{
            background: 'var(--bg-comment-box)',
            borderRadius: '18px',
            padding: '1.4rem',
            border: '1px solid var(--border-card)',
          }}
        >
          <GiscusComments />
        </div>
      </section>
    </div>
  );
};

const ContentSection = () => {
  return (
    <section className="home-content-section" style={{ padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div
        className="home-content-shell"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
        }}
      >
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <MainContent />
        </div>
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .home-main-card {
            padding: 3rem 2.2rem !important;
          }

          .home-profile-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }

        @media (max-width: 960px) {
          .home-content-shell {
            flex-direction: column !important;
          }

          .home-sidebar {
            position: static !important;
            width: 100% !important;
            top: auto !important;
          }

          .photography-shell {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .home-content-section {
            padding: 1.1rem 0.8rem !important;
          }

          .home-main-card {
            padding: 1.8rem 1rem !important;
            border-radius: 18px !important;
          }

          .home-post-grid {
            grid-template-columns: 1fr !important;
          }

          .home-comment-box {
            padding: 1rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ContentSection;
