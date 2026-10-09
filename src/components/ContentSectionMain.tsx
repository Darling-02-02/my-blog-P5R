// 首页内容区右栏：简介/幕后/关于/留言四个区块，含大类栏目卡片与 Giscus 评论。
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { CategoryData } from '../contexts/content-context';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { useTheme } from '../contexts/useTheme';
import { useWorkMood, workMoodImage, type WorkMood } from '../lib/workMood';

const articleCardBackground = 'var(--bg-article-card)';
const aboutBoxBackground = 'var(--bg-article-card)';
const commentBoxBackground = 'var(--bg-article-card)';

const GiscusComments = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof window !== 'undefined' && !('IntersectionObserver' in window),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;


    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldLoad) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.referrerPolicy = 'no-referrer';
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

    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [isDark, shouldLoad]);

  return <div ref={containerRef} id="giscus-container" style={{ minHeight: '200px' }} />;
};

// 大类栏目：卡片角标与轮播共用的计数/文案
const categoryCountLabel = (category: CategoryData) =>
  category.count === 0 ? '还没有内容' : `${category.count} 篇文章`;

// 幕后副标题：参考 biojuse 的淡入淡出（透明度 + 缩放 + 模糊），文案取自真实数据
const BlogFadeText = ({
  lead,
  columnCount,
  articleCount,
}: {
  lead: string;
  columnCount: number;
  articleCount: number;
}) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lines = useMemo(
    () => [lead, `目前收录 ${columnCount} 个栏目`, `共 ${articleCount} 篇文章`],
    [lead, columnCount, articleCount],
  );

  useEffect(() => {
    let swap = 0;
    const rotate = window.setInterval(() => {
      setVisible(false);
      swap = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % lines.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => {
      window.clearInterval(rotate);
      window.clearTimeout(swap);
    };
  }, [lines]);

  return <span className={`blog-fade-text${visible ? '' : ' is-hidden'}`}>{lines[index]}</span>;
};

// 大类栏目卡片
const CategoryLandingCard = ({ category, index, mood }: { category: CategoryData; index: number; mood: WorkMood }) => {
  const navigate = useNavigate();
  return (
    <motion.article
      className="blog-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
      style={{
        background: articleCardBackground,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* 正方形封面：作息动图是 1:1，用 aspectRatio 让整张图完整显示且不裁切 */}
      <div className="blog-card-cover" style={{ aspectRatio: '1 / 1', overflow: 'hidden', position: 'relative' }}>
        <img
          className="blog-card-img"
          src={workMoodImage(mood)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: category.color, color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '15px', fontSize: '0.85rem', fontWeight: '600' }}>
          {categoryCountLabel(category)}
        </span>
        <span className="blog-card-mood" title={mood.label}>{mood.period}</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <h4 className="blog-card-title" style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-card-title)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{category.name}</h4>
        <p className="blog-card-desc" style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.8rem', lineHeight: 1.7 }}>
          {category.description}
        </p>
        <span className="blog-card-meta">查看全部 →</span>
      </div>
    </motion.article>
  );
};

// 主内容
const MainContent = () => {
  const { articles } = useArticles();
  const { getCategoryData } = useContent();
  const mood = useWorkMood();
  const categoryData = getCategoryData(articles);
  // 栏目表现在是后台的数据：后台刚新建的栏目哪怕一篇内容都还没有，也必须出现在这里，
  // 否则加完栏目、前端看着像"没生效"（文章里冒出来的野栏目必然 count>0，不用额外过滤）。
  const sectionCardStyle: React.CSSProperties = {
    marginBottom: '4rem',
    padding: 0,
    background: 'transparent',
    borderRadius: 0,
    border: 'none',
  };
  const profilePaneStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '14px',
    padding: '1.25rem',
  };
  const aboutPaneStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: '14px',
    padding: '1.25rem',
  };

  return (
    <div className="home-main-card" style={{
      background: 'transparent',
      borderRadius: '20px',
      border: 'none',
      boxShadow: 'none',
      padding: 0,
    }}>
      {/* 个人简介 */}
      <section id="profile" className="home-content-block" style={sectionCardStyle}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>个人</span>简介
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          离神很近，也就是离人很远。——一个臭看番的。
        </p>
        
        <div className="home-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', marginBottom: '3rem' }}>
          <div className="home-profile-pane" style={profilePaneStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>🔮 神秘力量</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.9, margin: 0 }}>
              还在凝聚中，链接随后补上～
            </p>
          </div>
          <div className="home-profile-pane" style={profilePaneStyle}>
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

      {/* 幕后 - 大类栏目：栏目表整个空了（后台全删）时整块不渲染，别留一个空标题加一大片空白 */}
      {categoryData.length > 0 && <section id="blog" className="home-content-block" style={sectionCardStyle}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>幕后</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', minHeight: '3.6rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          <BlogFadeText
            lead="一切都是为了正义"
            columnCount={categoryData.length}
            articleCount={categoryData.reduce((sum, category) => sum + category.count, 0)}
          />
        </p>

        <div className="home-post-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '2.5rem' }}>
          {categoryData.map((category, i) => (
            <CategoryLandingCard key={category.name} category={category} index={i} mood={mood} />
          ))}
        </div>
      </section>}

      {/* 关于 */}
      <section id="about" className="home-content-block" style={sectionCardStyle}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>关于</span>本站
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          博客介绍
        </p>

        <div style={aboutPaneStyle}>
          <p style={{ color: 'var(--text-body)', fontSize: '1.15rem', lineHeight: 2.4 }}>
            垂死挣扎的双非硕，一切以实际为准。欢迎交流学习。
          </p>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: aboutBoxBackground, borderRadius: '12px', border: '1px solid rgba(255,0,64,0.1)' }}>
            <p style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
              📧 联系邮箱：<a href="mailto:19503862693@163.com" style={{ color: '#ff0040', textDecoration: 'none', fontWeight: '600' }}>19503862693@163.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* 评论区 */}
      <section id="comments" className="home-content-block" style={{ ...sectionCardStyle, marginBottom: 0 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          <span style={{ color: '#ff0040' }}>留言</span>板
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          欢迎留下你的足迹
        </p>
        
        <div className="home-comment-box" style={{ 
          background: commentBoxBackground, 
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

export default MainContent;
