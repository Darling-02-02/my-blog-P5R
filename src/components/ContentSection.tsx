import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';

const base = import.meta.env.BASE_URL;
const coverImage = `${base}cover.png`;

const gradientStyle = {
  background: 'linear-gradient(45deg, #ff6b9d, #c44569, #ff9ff3, #feca57, #ff9ff3, #c44569, #ff6b9d)',
  backgroundSize: '300% 300%',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  animation: 'gradientShift 4s ease infinite',
};

const categoryColors: Record<string, string> = {
  '生物信息': '#ff6b9d',
  '三维重建': '#c44569',
  '机器学习': '#feca57',
  '随笔': '#ff9ff3',
};

const tagData = [
  { name: '生物信息', count: 3 },
  { name: 'RNA-seq', count: 2 },
  { name: '单细胞', count: 2 },
  { name: 'Python', count: 3 },
  { name: '三维重建', count: 1 },
  { name: 'NeRF', count: 1 },
  { name: '机器学习', count: 2 },
  { name: 'Docker', count: 2 },
  { name: '随笔', count: 1 },
  { name: '学习路线', count: 2 },
  { name: 'CI/CD', count: 1 },
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
            border: '3px solid rgba(255, 107, 157, 0.6)',
            margin: '0 auto 1rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
            transition: 'border-color 0.3s ease',
          }}
        />
        <h2 style={{ ...gradientStyle, fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.3rem' }}>灵敏度加满</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {socials.map((s, i) => (
            <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,107,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,107,157,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,107,157,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
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
    <div style={{ background: 'rgba(255,107,157,0.08)', borderRadius: '8px', padding: '0.8rem', border: '1px solid rgba(255,107,157,0.15)' }}>
      <p style={{ color: '#333', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}><strong>人生是旷野，不是轨道</strong></p>
    </div>
    <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.6, margin: '0.6rem 0 0 0' }}>请保持批判思维</p>
  </SidebarCard>
);

// 分类
const CategoriesCard = () => {
  const navigate = useNavigate();
  const categories = [
    { name: '生物信息', count: 1, color: '#ff6b9d' },
    { name: '三维重建', count: 1, color: '#c44569' },
    { name: '机器学习', count: 1, color: '#feca57' },
    { name: '随笔', count: 1, color: '#ff9ff3' },
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
            e.currentTarget.style.background = 'rgba(255,107,157,0.1)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <span style={{ ...gradientStyle, fontWeight: '600', fontSize: '0.9rem' }}>{cat.name}</span>
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
                ...gradientStyle,
                fontWeight: tag.count >= 3 ? '700' : '500',
                background: 'rgba(255,107,157,0.08)', 
                border: '1px solid rgba(255,107,157,0.25)', 
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(255,107,157,0.3)';
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
  const [stats, setStats] = useState({ articles: articles.length, visitors: 520, views: 2340, lastUpdate: '' });
  useEffect(() => {
    setStats(prev => ({ ...prev, lastUpdate: new Date().toLocaleString('zh-CN') }));
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
          <span style={{ ...gradientStyle, fontWeight: '700', fontSize: '1rem' }}>{item.value}</span>
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
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/article/${post.id}`)}
      style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(200,200,200,0.2)',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: categoryColor, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>{post.category}</span>
      </div>
      <div style={{ padding: '1rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.5rem', lineHeight: 1.4 }}>{post.title}</h4>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.6rem' }}>{post.date} · {post.readTime}</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ ...gradientStyle, fontSize: '0.75rem', background: 'rgba(255,107,157,0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>#{tag}</span>
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
      borderRadius: '16px',
      border: '1px solid rgba(200, 200, 200, 0.3)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      padding: '3.5rem',
    }}>
      <section id="profile" style={{ marginBottom: '4.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={gradientStyle}>个人</span>简介
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          了解关于我的一切
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.25rem' }}>🎓 教育背景</h3>
            <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: 2 }}>大学生物信息学专业</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.25rem' }}>💡 兴趣爱好</h3>
            <ul style={{ color: '#555', fontSize: '1.05rem', lineHeight: 2.2, paddingLeft: '1.5rem' }}>
              <li>写代码</li>
              <li>健身</li>
              <li>徒步</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.25rem' }}>🎯 人生清单</h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['健身', '徒步', '中长跑'].map(item => (
              <span key={item} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.2)', borderRadius: '25px', fontSize: '1rem', color: '#333' }}>⬜ {item}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" style={{ marginBottom: '4.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.75rem' }}>
          <span style={gradientStyle}>幕后</span>
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          一切都是为了正义
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '2rem' }}>
          {mainPosts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {morePosts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '2rem', marginTop: '2rem' }}>
            {morePosts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i + mainPosts.length} />
            ))}
          </div>
        )}
      </section>

      <section id="about">
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.75rem' }}>
          <span style={gradientStyle}>关于</span>本站
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          博客介绍
        </p>
        
        <p style={{ color: '#555', fontSize: '1.05rem', lineHeight: 2.1, marginBottom: '2rem' }}>
          这是一个专注于编程学习路线和Pipeline代码分享的技术博客。记录学习历程，分享实用代码片段和自动化工作流方案。
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
          {[
            { num: '50+', label: '篇教程' },
            { num: '20+', label: '项目' },
            { num: '6', label: '领域' },
            { num: '100%', label: '开源' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,107,157,0.05)', borderRadius: '12px', border: '1px solid rgba(255,107,157,0.1)' }}>
              <div style={{ ...gradientStyle, fontSize: '1.75rem', fontWeight: '700' }}>{s.num}</div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>{s.label}</div>
            </div>
          ))}
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
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 900px) {
          section > div { flex-direction: column !important; }
          aside { position: static !important; width: 100% !important; }
        }
      `}</style>
    </section>
  );
};

export default ContentSection;
