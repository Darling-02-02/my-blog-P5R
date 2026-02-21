import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';

const base = import.meta.env.BASE_URL;
const coverImage = `${base}cover.png`;

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
    background: 'rgba(255, 255, 255, 0.75)',
    borderRadius: '12px',
    border: '1px solid rgba(200, 200, 200, 0.3)',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '1rem',
  }}>
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
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `url(${base}头像.jpg) center/cover`,
            border: '3px solid rgba(255, 0, 64, 0.5)',
            margin: '0 auto 0.75rem',
            cursor: 'pointer',
            animation: isSpinning ? 'avatarSpin 0.4s linear infinite' : 'none',
          }}
        />
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.2rem' }}>灵敏度加满</h2>
        <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '0.75rem' }}>无限进步。</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
          {socials.map((s, i) => (
            <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.9rem' }}>{s.icon}</a>
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
    <div style={{ background: 'rgba(255,0,64,0.05)', borderRadius: '6px', padding: '0.6rem', border: '1px solid rgba(255,0,64,0.1)' }}>
      <p style={{ color: '#333', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}><strong>人生是旷野，不是轨道</strong></p>
    </div>
    <p style={{ color: '#666', fontSize: '0.75rem', lineHeight: 1.5, margin: '0.5rem 0 0 0' }}>请保持批判思维</p>
  </SidebarCard>
);

// 分类
const CategoriesCard = () => {
  const categories = [
    { name: '生物信息', count: 3, color: '#ff6b6b' },
    { name: '三维重建', count: 1, color: '#4ecdc4' },
    { name: '机器学习', count: 1, color: '#45b7d1' },
    { name: '学习ing', count: 3, color: '#96ceb4' },
  ];
  return (
    <SidebarCard title="分类" icon="📁">
      {categories.map(cat => (
        <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.02)', borderRadius: '4px', marginBottom: '0.3rem', cursor: 'pointer' }}>
          <span style={{ color: '#333', fontSize: '0.8rem' }}>{cat.name}</span>
          <span style={{ color: '#fff', fontSize: '0.7rem', background: cat.color, padding: '0.1rem 0.4rem', borderRadius: '8px' }}>{cat.count}</span>
        </div>
      ))}
    </SidebarCard>
  );
};

// 标签
const TagsCard = () => {
  const tags = ['生物信息', 'Python', '三维重建', 'NeRF', '机器学习', 'Docker'];
  return (
    <SidebarCard title="标签" icon="🏷️">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {tags.map(tag => (
          <span key={tag} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,0,64,0.1)', border: '1px solid rgba(255,0,64,0.2)', borderRadius: '12px', fontSize: '0.7rem', color: '#ff0040' }}>#{tag}</span>
        ))}
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
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ color: '#666', fontSize: '0.8rem' }}>{item.icon} {item.label}</span>
          <span style={{ color: '#333', fontWeight: '600', fontSize: '0.85rem' }}>{item.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
        <span style={{ color: '#999', fontSize: '0.7rem' }}>更新: {stats.lastUpdate}</span>
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
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(`/article/${post.id}`)}
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(200,200,200,0.2)',
        cursor: 'pointer',
      }}
    >
      <div style={{ height: '120px', overflow: 'hidden' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#ff0040', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.65rem' }}>{post.category}</span>
      </div>
      <div style={{ padding: '0.75rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.3rem', lineHeight: 1.3 }}>{post.title}</h4>
        <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }}>{post.date} · {post.readTime}</p>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ fontSize: '0.65rem', color: '#ff0040', background: 'rgba(255,0,64,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>#{tag}</span>
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
      borderRadius: '12px',
      border: '1px solid rgba(200, 200, 200, 0.3)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
    }}>
      {/* 个人简介 */}
      <section id="profile" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.25rem' }}>
          <span style={{ color: '#ff0040' }}>个人</span>简介
        </h1>
        <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          了解关于我的一切
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>🎓 教育背景</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.7 }}>大学生物信息学专业</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>💡 兴趣爱好</h3>
            <ul style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
              <li>写代码</li>
              <li>健身</li>
              <li>徒步</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>🎯 人生清单</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['健身', '徒步', '中长跑'].map(item => (
              <span key={item} style={{ padding: '0.4rem 1rem', background: 'rgba(255,0,64,0.08)', border: '1px solid rgba(255,0,64,0.2)', borderRadius: '20px', fontSize: '0.85rem', color: '#333' }}>⬜ {item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 幕后 - 文章 */}
      <section id="blog" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.25rem' }}>
          <span style={{ color: '#ff0040' }}>幕后</span>
        </h1>
        <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          一切都是为了正义
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
          {mainPosts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {morePosts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {morePosts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i + mainPosts.length} />
            ))}
          </div>
        )}
      </section>

      {/* 关于 */}
      <section id="about">
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.25rem' }}>
          <span style={{ color: '#ff0040' }}>关于</span>本站
        </h1>
        <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          博客介绍
        </p>
        
        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '1rem' }}>
          这是一个专注于编程学习路线和Pipeline代码分享的技术博客。记录学习历程，分享实用代码片段和自动化工作流方案。
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { num: '50+', label: '篇教程' },
            { num: '20+', label: '项目' },
            { num: '6', label: '领域' },
            { num: '100%', label: '开源' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,0,64,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ff0040' }}>{s.num}</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>{s.label}</div>
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
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
