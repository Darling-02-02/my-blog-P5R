import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import { useTheme } from '../contexts/ThemeContext';

const base = import.meta.env.BASE_URL;
const coverImage = `${base}cover.png`;

const tagData = [
  { name: '生物信息', count: 1 },
  { name: 'RNA-seq', count: 1 },
  { name: '单细胞', count: 1 },
  { name: 'Python', count: 1 },
  { name: '三维重建', count: 1 },
  { name: 'NeRF', count: 1 },
  { name: '机器学习', count: 1 },
  { name: '随笔', count: 1 },
  { name: '学习路线', count: 1 },
];

const GiscusComments = () => {
  const { isDark } = useTheme();
  
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

  void weatherCodeText;

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
      if (container) container.innerHTML = '';
    };
  }, [isDark]);

  return <div id="giscus-container" style={{ minHeight: '200px' }} />;
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
    background: 'var(--bg-sidebar-card)',
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
  const [location, setLocation] = useState('地球');
  const [weather, setWeather] = useState('获取中...');
  const [time, setTime] = useState('');
  const [slogan, setSlogan] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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

  const slogans = [
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

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.region) {
          setLocation(data.region);
        }
        if (data.city) {
          fetch(`https://wttr.in/${encodeURIComponent(data.city)}?format=%25c+%25t&lang=zh`)
            .then(res => res.text())
            .then(text => setWeather(text.trim() || '晴'))
            .catch(() => setWeather('晴'));
        }
      })
      .catch(() => {
        setLocation('地球');
        setWeather('晴');
      });

    setSlogan(slogans[Math.floor(Math.random() * slogans.length)]);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateFromIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const regionName = [data.country_name, data.region, data.city].filter(Boolean).join(' ');
        if (regionName) {
          setLocation(regionName);
        }
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setCoords({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch {
        setLocation('地球');
      }
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
      try {
        const resp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
        );
        const data = await resp.json();
        const regionName = [data.countryName, data.principalSubdivision, data.city || data.locality]
          .filter(Boolean)
          .join(' ');
        if (regionName) {
          setLocation(regionName);
        }
      } catch {
        setLocation(`经纬度 ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
      }
    };

    updateFromIp();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setCoords({ latitude, longitude });
          reverseGeocode(latitude, longitude);
        },
        () => {
          updateFromIp();
        },
        { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 },
      );

      const fallbackTimer = setInterval(updateFromIp, 10 * 60 * 1000);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(fallbackTimer);
      };
    }

    const timer = setInterval(updateFromIp, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateWeather = async () => {
      if (!coords) return;
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const current = data.current;
        if (!current) return;
        const weatherText = weatherCodeText(Number(current.weather_code));
        const temp = Number(current.temperature_2m).toFixed(1);
        const wind = Number(current.wind_speed_10m).toFixed(1);
        setWeather(`${weatherText} ${temp}°C · 风速${wind}km/h`);
      } catch {
        setWeather('天气获取失败');
      }
    };

    updateWeather();
    const timer = setInterval(updateWeather, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [coords]);

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

// 分类
const CategoriesCard = () => {
  const navigate = useNavigate();
  const categories = [
    { name: '生物信息', count: 1, color: '#ff6b6b' },
    { name: '三维重建', count: 1, color: '#4ecdc4' },
    { name: '机器学习', count: 1, color: '#45b7d1' },
    { name: '随笔', count: 1, color: '#96ceb4' },
  ];
  return (
    <SidebarCard title="分类" icon="📁">
      {categories.map(cat => (
        <div 
          key={cat.name} 
          onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.6rem 0.8rem', 
            background: 'var(--bg-category-item)', 
            borderRadius: '6px', 
            marginBottom: '0.5rem', 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-category-item)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ color: '#ff0040', fontWeight: '600', fontSize: '0.9rem' }}>{cat.name}</span>
          <span style={{ color: '#fff', fontSize: '0.75rem', background: cat.color, padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: '600' }}>{cat.count}</span>
        </div>
      ))}
    </SidebarCard>
  );
};

// 标签
const TagsCard = () => {
  const navigate = useNavigate();
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
  const [stats, setStats] = useState({ articles: articles.length, visitors: 0, views: 0, lastUpdate: '' });
  
  useEffect(() => {
    const storedVisitors = parseInt(localStorage.getItem('blog_visitors') || '0');
    const storedViews = parseInt(localStorage.getItem('blog_views') || '0');
    const hasVisited = localStorage.getItem('blog_has_visited');
    
    let newVisitors = storedVisitors;
    let newViews = storedViews + 1;
    
    if (!hasVisited) {
      newVisitors = storedVisitors + 1;
      localStorage.setItem('blog_has_visited', 'true');
    }
    
    localStorage.setItem('blog_visitors', String(newVisitors));
    localStorage.setItem('blog_views', String(newViews));
    
    setStats({
      articles: articles.length,
      visitors: newVisitors,
      views: newViews,
      lastUpdate: new Date().toLocaleString('zh-CN', { hour12: false }),
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        lastUpdate: new Date().toLocaleString('zh-CN', { hour12: false }),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  const items = [
    { label: '文章数目', value: stats.articles, icon: '📝' },
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
  <aside style={{
    position: 'sticky',
    top: '2rem',
    width: '260px',
    flexShrink: 0,
    alignSelf: 'flex-start',
  }}>
    <ProfileCard />
    <AnnouncementCard />
    <CategoriesCard />
    <TagsCard />
    <StatsCard />
  </aside>
);

// 文章卡片
const BlogCard = ({ post, index }: { post: typeof articles[0] & { image: string }; index: number }) => {
  const navigate = useNavigate();
  const today = post.date;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/article/${post.id}`)}
      style={{
        background: 'var(--bg-article-card)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#ff0040', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '600' }}>暗影大人</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-card-title)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{post.title}</h4>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{today} · {post.readTime}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ color: '#ff0040', fontSize: '0.85rem', background: 'var(--bg-tag)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>#{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

// 主内容
const MainContent = () => {
  const allowedCategories = ['生物信息', '三维重建', '机器学习', '随笔'];
  const filteredArticles = articles.filter(a => allowedCategories.includes(a.category));
  const mainPosts = filteredArticles.map(a => ({ ...a, image: coverImage }));

  return (
    <div style={{
      background: 'var(--bg-main-card)',
      borderRadius: '20px',
      border: '1px solid var(--border-card)',
      backdropFilter: 'blur(15px)',
      boxShadow: 'var(--shadow-card)',
      padding: '5rem',
    }}>
      {/* 个人简介 */}
      <section id="profile" style={{ marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>个人</span>简介
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          离神很近，也就是离人很远。——一个臭看番的。
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>🎓 教育背景</h3>
            <p style={{ color: 'var(--text-body)', fontSize: '1.15rem', lineHeight: 2.2, marginBottom: '0.5rem' }}>河南农业大学 · 本科 · 茶学</p>
            <p style={{ color: 'var(--text-body)', fontSize: '1.15rem', lineHeight: 2.2, marginBottom: '1rem' }}>福建农林大学 · 硕士 · 智慧园艺</p>
            <p style={{ color: '#ff0040', fontSize: '1.1rem', lineHeight: 2, fontWeight: '500' }}>选择大于努力</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>💡 兴趣爱好</h3>
            <ul style={{ color: 'var(--text-body)', fontSize: '1.1rem', lineHeight: 2.2, paddingLeft: '1.2rem', listStyle: 'none' }}>
              <li style={{ color: '#ff0040', fontWeight: '500' }}>👤 CN：灵敏度加满，欢迎扩列</li>
              <li style={{ marginTop: '0.5rem' }}>📸 摄影：偶尔拍拍，设备索尼zve10，镜头55mm</li>
              <li>🏃 中长跑：纵有疾风起！！</li>
              <li>💪 健身：卧推25kg，不中嘞</li>
              <li>🎨 画画：反正没在签绘墙上画过</li>
              <li>🎮 游戏：第九艺术！！3A永远滴神</li>
              <li>✨ 梦想能手握switch2、5090和PS5</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 幕后 - 文章 */}
      <section id="blog" style={{ marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>幕后</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          一切都是为了正义
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '2.5rem' }}>
          {mainPosts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </section>

      {/* 关于 */}
      <section id="about" style={{ marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>关于</span>本站
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          博客介绍
        </p>
        
        <p style={{ color: 'var(--text-body)', fontSize: '1.15rem', lineHeight: 2.4 }}>
          垂死挣扎的双非硕，一切以实际为准。欢迎交流学习。
        </p>
        
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-about-box)', borderRadius: '12px', border: '1px solid rgba(255,0,64,0.1)' }}>
          <p style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
            📧 联系邮箱：<a href="mailto:19503862693@163.com" style={{ color: '#ff0040', textDecoration: 'none', fontWeight: '600' }}>19503862693@163.com</a>
          </p>
        </div>
      </section>

      {/* 评论区 */}
      <section id="comments">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>留言</span>板
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          欢迎留下你的足迹
        </p>
        
        <div style={{ 
          background: 'var(--bg-comment-box)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          border: '1px solid var(--border-card)',
        }}>
          <GiscusComments />
        </div>
      </section>
    </div>
  );
};

// 主组件
const ContentSection = () => {
  return (
    <section style={{ padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <MainContent />
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          section > div { flex-direction: column !important; }
          aside { position: static !important; width: 100% !important; }
        }
      `}</style>
    </section>
  );
};

export default ContentSection;
