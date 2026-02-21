import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';

const base = import.meta.env.BASE_URL;
const coverImage = `${base}cover.png`;

const categoryColors: Record<string, string> = {
  '生物信息': '#ff6b6b',
  '三维重建': '#4ecdc4',
  '机器学习': '#45b7d1',
  '随笔': '#96ceb4',
};

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
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '14px',
    border: '1px solid rgba(200, 200, 200, 0.3)',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  }}>
    {title && (
      <div style={{
        padding: '1.1rem 1.4rem',
        borderBottom: '1px solid rgba(200, 200, 200, 0.2)',
        fontWeight: '700',
        color: '#333',
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
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {socials.map((s, i) => (
            <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,0,64,0.15)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >{s.icon}</a>
          ))}
        </div>
      </div>
      <style>{`@keyframes avatarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidebarCard>
  );
};

// 公告
const AnnouncementCard = () => (
  <SidebarCard title="公告" icon="📢">
    <div style={{ background: 'rgba(255,0,64,0.05)', borderRadius: '8px', padding: '0.8rem', border: '1px solid rgba(255,0,64,0.1)' }}>
      <p style={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}><strong>低头赶路，还要抬头看天</strong></p>
    </div>
    <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.6, margin: '0.6rem 0 0 0' }}>仅用于交流学习，为爱发电。</p>
  </SidebarCard>
);

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
          onClick={() => navigate(`/category/${cat.name}`)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0.6rem 0.8rem', 
            background: 'rgba(0,0,0,0.02)', 
            borderRadius: '6px', 
            marginBottom: '0.5rem', 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,0,64,0.08)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
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
              onClick={() => navigate(`/tag/${tag.name}`)}
              style={{ 
                ...size,
                color: '#ff0040',
                fontWeight: tag.count >= 3 ? '700' : '500',
                background: 'rgba(255,0,64,0.08)', 
                border: '1px solid rgba(255,0,64,0.2)', 
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
      lastUpdate: new Date().toLocaleString('zh-CN'),
    });
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
          <span style={{ color: '#666', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
          <span style={{ color: '#ff0040', fontWeight: '700', fontSize: '1rem' }}>{item.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
        <span style={{ color: '#999', fontSize: '0.8rem' }}>更新: {stats.lastUpdate}</span>
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
  const categoryColor = categoryColors[post.category] || '#ff6b9d';
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/article/${post.id}`)}
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(200,200,200,0.2)',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: categoryColor, color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '600' }}>{post.category}</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.75rem', lineHeight: 1.5 }}>{post.title}</h4>
        <p style={{ fontSize: '0.95rem', color: '#888', marginBottom: '0.8rem' }}>{post.date} · {post.readTime}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ color: '#ff0040', fontSize: '0.85rem', background: 'rgba(255,0,64,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>#{tag}</span>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

// 主内容
const MainContent = () => {
  const mainPosts = articles.slice(0, 5).map(a => ({ ...a, image: coverImage }));
  const morePosts = articles.slice(5).map(a => ({ ...a, image: coverImage }));

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.75)',
      borderRadius: '20px',
      border: '1px solid rgba(200, 200, 200, 0.3)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
      padding: '5rem',
    }}>
      {/* 个人简介 */}
      <section id="profile" style={{ marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>个人</span>简介
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
          了解关于我的一切
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>🎓 教育背景</h3>
            <p style={{ color: '#555', fontSize: '1.15rem', lineHeight: 2.2 }}>河南农业大学本科茶学到福建农林大学硕士智慧园艺</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>💡 兴趣爱好</h3>
            <p style={{ color: '#555', fontSize: '1.15rem', lineHeight: 2.4 }}>有待开发</p>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>🎯 人生清单</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {['健身', '徒步', '中长跑'].map(item => (
              <span key={item} style={{ padding: '0.8rem 2rem', background: 'rgba(255,0,64,0.05)', border: '2px solid rgba(255,0,64,0.15)', borderRadius: '30px', fontSize: '1.1rem', color: '#333' }}>⬜ {item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 幕后 - 文章 */}
      <section id="blog" style={{ marginBottom: '6rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>幕后</span>
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
          一切都是为了正义
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '2.5rem' }}>
          {mainPosts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {morePosts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '2.5rem', marginTop: '2.5rem' }}>
            {morePosts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i + mainPosts.length} />
            ))}
          </div>
        )}
      </section>

      {/* 关于 */}
      <section id="about">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>关于</span>本站
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
          博客介绍
        </p>
        
        <p style={{ color: '#555', fontSize: '1.15rem', lineHeight: 2.4 }}>
          垂死挣扎的双非硕，一切以实际为准。欢迎交流学习。
        </p>
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
