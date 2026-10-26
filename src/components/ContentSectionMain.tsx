// 首页内容区右栏：幕后/关于/友链/留言四个区块，含大类栏目卡片与 Giscus 评论。
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { ArticleSummary } from '../../backend/src/articles/article.types';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import { useTheme } from '../contexts/useTheme';
import { friendLinks } from '../data/friend-links';
import { generatedCoverUrl } from '../lib/article-cover';
import { useWorkMood, workMoodImage, type WorkMood } from '../lib/workMood';

const articleCardBackground = 'var(--bg-article-card)';
const aboutBoxBackground = 'var(--bg-article-card)';
const commentBoxBackground = 'var(--bg-article-card)';

const discussionsUrl = 'https://github.com/Darling-02-02/my-blog-P5R/discussions';

const commentNoticeStyle: React.CSSProperties = {
  margin: '0.9rem 0 0',
  color: 'var(--text-muted)',
  fontSize: '0.95rem',
  lineHeight: 1.8,
};

const GiscusComments = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof window !== 'undefined' && !('IntersectionObserver' in window),
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;


    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        setStatus('loading');
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

    // giscus 的 iframe 是脚本自己插进容器的。脚本报错、或者加载完了容器里还没有 iframe，
    // 就说明评论区废了（国内网络很常见），这时候必须给一句人话，不能留一个 200px 的空盒子。
    let retry = 0;
    const settle = () => {
      if (container.querySelector('iframe')) {
        setStatus('ready');
        return;
      }
      retry = window.setTimeout(
        () => setStatus(container.querySelector('iframe') ? 'ready' : 'failed'),
        1500,
      );
    };
    script.addEventListener('load', settle);
    script.addEventListener('error', () => setStatus('failed'));

    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      window.clearTimeout(retry);
      container.innerHTML = '';
    };
  }, [isDark, shouldLoad]);

  return (
    <>
      <div ref={containerRef} id="giscus-container" style={{ minHeight: '200px' }} />
      {status === 'loading' && <p style={commentNoticeStyle}>评论加载中…</p>}
      {status === 'failed' && (
        <p style={commentNoticeStyle}>
          评论区没加载出来（giscus.app 不可达或被浏览器拦截）。可以先去{' '}
          <a href={discussionsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link)' }}>
            GitHub Discussions
          </a>{' '}
          留言。
        </p>
      )}
    </>
  );
};

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

// 文章卡：首层直接给真文章标题。以前这里放的是栏目卡（基因组组装 / 变异检测 …），
// 标题本身没什么信息量，还得再点一层才看得见文章——现在点卡片就直接进文章。
// 栏目入口收在网格上方那行 chips 里（分类 9 个、顺序和后台栏目表一致）。
// 卡片只有一个跳转目标：栏目名只当角标显示，不在卡片里嵌第二个可点区域（焦点顺序会打架）。
const ArticleCard = ({ article, index, mood }: { article: ArticleSummary; index: number; mood: WorkMood }) => {
  const navigate = useNavigate();
  const { getArticlePath } = useContent();
  const open = () => navigate(getArticlePath(article));
  // 封面 = 文章里第一张截图（见 src/data/articles.ts 的 coverUrl）；没有的话用自动生成的
  // 文章页截图（public/covers/），再没有就一直是底下那层作息动图。
  // 图没到 / 出错时动图就是加载态，图到位后再淡入盖上去。
  const [coverReady, setCoverReady] = useState(false);
  const cover = article.coverUrl ?? generatedCoverUrl(article.slug);

  return (
    <motion.article
      className="blog-card"
      role="link"
      tabIndex={0}
      aria-label={article.title}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={open}
      onKeyDown={(event) => {
        // role="link" 的元素必须自己实现 Enter/Space：div 不会因为可聚焦就有默认行为。
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      style={{
        background: articleCardBackground,
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* 正方形封面：底下那层作息动图既是加载态，也是没有截图的文章的兜底；
          文章截图（若有）加载完成后淡入盖上去。 */}
      <div className="blog-card-cover" style={{ aspectRatio: '1 / 1', overflow: 'hidden', position: 'relative' }}>
        <img
          className="blog-card-img"
          src={workMoodImage(mood)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        {cover && (
          <img
            className={`blog-card-photo${coverReady ? ' is-ready' : ''}`}
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setCoverReady(true)}
            onError={() => setCoverReady(false)}
          />
        )}
        {/* 角标压在动图上：跟右下角的时段标签同一套黑底白字（55% 黑在亮封面上不够对比） */}
        <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(10, 6, 9, 0.85)', color: '#fff', padding: '0.22rem 0.65rem', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: '600' }}>
          {article.category}
        </span>
        <span className="blog-card-mood" title={mood.label}>{mood.period}</span>
      </div>
      <div style={{ padding: '1.15rem' }}>
        <h4 className="blog-card-title" style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-card-title)', marginBottom: '0.6rem', lineHeight: 1.5 }}>{article.title}</h4>
        <p className="blog-card-desc" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.7rem', lineHeight: 1.65 }}>
          {article.excerpt}
        </p>
        <span className="blog-card-meta">{article.date} · {article.readTime}</span>
      </div>
    </motion.article>
  );
};

// 主内容
const MainContent = () => {
  const { articles, status } = useArticles();
  const { getCategoryData } = useContent();
  const navigate = useNavigate();
  const mood = useWorkMood();
  const categoryData = getCategoryData(articles);
  // 栏目表现在是后台的数据：后台刚新建的栏目哪怕一篇内容都还没有，也必须出现在这里，
  // 否则加完栏目、前端看着像"没生效"（文章里冒出来的野栏目必然 count>0，不用额外过滤）。
  // ponytail: 首页只放最新 9 篇——跟原来 9 张栏目卡同高，文章变多也不会把首页无限拉长；
  // 真要「全部文章」一页时再加路由，不提前造。
  const newestArticles = articles.slice(0, 9);
  const sectionCardStyle: React.CSSProperties = {
    marginBottom: '4rem',
    padding: 0,
    background: 'transparent',
    borderRadius: 0,
    border: 'none',
  };
  const aboutPaneStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-card)',
    padding: '1.25rem',
  };

  return (
    <div className="home-main-card" style={{
      background: 'transparent',
      borderRadius: 'var(--radius-card)',
      border: 'none',
      boxShadow: 'none',
      padding: 0,
    }}>
      {/* 幕后 - 最新文章：栏目表整个空了（后台全删）时整块不渲染，别留一个空标题加一大片空白 */}
      {categoryData.length > 0 && <section id="blog" className="home-content-block" style={sectionCardStyle}>
        {/* 「首个词换强调色」那套写法在黑白灰里没有对比可言（强调色本身就是标题色），收成一色标题 */}
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          幕后
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', minHeight: '3.6rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          <BlogFadeText
            lead="一切都是为了正义"
            columnCount={categoryData.length}
            articleCount={categoryData.reduce((sum, category) => sum + category.count, 0)}
          />
        </p>

        {/* 栏目 chips：栏目总览入口（点进 /category/<name> 看该栏目全部文章）。
            角标只写到篇数，空栏目也留着——后台刚建的栏目要能看见。 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
          {categoryData.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
              style={{
                border: '1px solid var(--border-tag)',
                background: 'var(--bg-tag)',
                color: 'var(--text-link)',
                borderRadius: 'var(--radius-pill)',
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                margin: 0,
              }}
            >
              {category.name}
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                {category.count === 0 ? '还没有内容' : category.count}
              </span>
            </button>
          ))}
        </div>

        {/* 一行三张；≤1100px 退回两列、≤640px 一列，规则在 ContentSection.tsx 的 <style> 里 */}
        {newestArticles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {status === 'ready' ? '栏目已经建好了，还没有文章。' : '文章加载中…'}
          </p>
        ) : (
          <div className="home-post-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem' }}>
            {newestArticles.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} mood={mood} />
            ))}
          </div>
        )}
      </section>}

      {/* 关于 */}
      <section id="about" className="home-content-block" style={sectionCardStyle}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          关于本站
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          博客介绍
        </p>

        <div style={aboutPaneStyle}>
          <p style={{ color: 'var(--text-body)', fontSize: '1.15rem', lineHeight: 2.4 }}>
            {'一切以实际为准。欢迎交流学习，Ciallo～(∠・ω< )⌒★'}
          </p>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: aboutBoxBackground, borderRadius: 'var(--radius-card)', border: '1px solid var(--border-card)' }}>
            <p style={{ color: 'var(--text-body)', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
              📧 联系邮箱：<a href="mailto:19503862693@163.com" style={{ color: 'var(--text-link)', textDecoration: 'none', fontWeight: '600' }}>19503862693@163.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* 友链 */}
      <section id="links" className="home-content-block" style={sectionCardStyle}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          友链
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          其他小伙伴的博客
        </p>

        {/* 名单在 src/data/friend-links.ts，加一条就多一张卡片。
            一条都没有时给一句话，不然标题下面空一片，看着像坏了。
            有 cover 就铺一张 16:9 封面（对面首页没有 og:image 时用站点截图），没有就只显示文字。 */}
        {friendLinks.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>还没有友链，欢迎来留言板交换。</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {friendLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="friend-card"
              style={{
                display: 'block',
                background: aboutBoxBackground,
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                textDecoration: 'none',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              {link.cover && (
                <img
                  // 封面只是站点预览，卡片里已经有名字，所以 alt 留空，别让读屏念两遍
                  alt=""
                  src={link.cover}
                  loading="lazy"
                  decoding="async"
                  className="friend-card-cover"
                  style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ padding: '1.25rem' }}>
                <span style={{ display: 'block', color: 'var(--text-link)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {link.name} ↗
                </span>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {link.desc}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 评论区 */}
      <section id="comments" className="home-content-block" style={{ ...sectionCardStyle, marginBottom: 0 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
          留言板
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
          欢迎留下你的足迹
        </p>
        
        <div className="home-comment-box" style={{ 
          background: commentBoxBackground, 
          borderRadius: 'var(--radius-card)', 
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
