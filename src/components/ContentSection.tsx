// 首页内容区骨架：只负责背景样式、响应式样式与「侧边栏 + 主内容」两栏编排。
import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import MainContent from './ContentSectionMain';
import Sidebar from './ContentSectionSidebar';

interface ContentSectionProps {
  standalone?: boolean;
  // 别的独立页（/myself）把自己的区块塞进来，复用同一套外壳与响应式样式；
  // 不传就是首页内容区。
  children?: ReactNode;
}

// 主组件
const ContentSection = ({ standalone = false, children }: ContentSectionProps) => {
  // 这一层不铺纱、也不画图：整站那张 CY.webp（和压在它上面的唯一一层 --page-veil）归 GlobalBackground 管，
  // 只画一次（fixed、位置不动）。内容区以前还要再叠一层 --content-veil 把自己洗淡一点，代价是同一个页面
  // 里首屏和内容区亮度不一样，内页还得为此维护一整套「薄一档」的卡片颜色。
  // 现在纱只有一个值、一个位置，这里就什么都不铺了——底色跟首屏逐像素一致。

  // 首页 → 幕后的转场后半段：主栏跟着滚动进度淡入（前半段「首屏后退淡出」在 Hero 里）。
  // 只淡入、不上浮：主栏原来还挂着 translateY(64px → 0)，可 #blog / #links / #comments 这三个页内锚点
  // 就在主栏里面——锚点跟着滚动变形时，浏览器算 scrollIntoView 落点用的是「滚动前」的位置，
  // 实测点页头「幕后」落在 scrollY 1070，稳定后 #blog 顶边只剩 24px，正好被 74px 高的固定页头压住
  // （index.css 里那条 scroll-margin-top: 5.5rem 就是为这件事留的）。落点要准，主栏就不能在滚动中位移。
  // 动的是主栏、不动侧栏，这是技术原因不是图省事：侧栏每张卡都带 backdropFilter（SidebarCard），
  // 而带 backdrop-filter 的元素一旦落在带 transform/opacity 的祖先里，就只在该祖先的组内取样、
  // 不再糊到页面背景，玻璃卡片会失去质感；主栏里没有任何 backdrop-filter（ContentSectionMain 全文没有），
  // 所以它可以安全地淡。仓库里同一族行为也记过一次：MarkdownBody 的灯箱必须挂到 body 上。
  // 用滚动进度而不是定时器：跟手，滚一半停一半，滚回去能倒放。
  // 不透明度必须走函数式 useTransform，不能把 useScroll 的 scrollYProgress 直接塞进 style：
  // 两种写法都被 motion 的原生加速接走过，挂的是一条以「整页滚动」为刻度的 ScrollTimeline 动画
  // （WAAPI 在层叠里压过内联样式），progress 的含义就从「这一段」变成「整页」——实测这一段已经走到 1.0 时
  // 不透明度才 0.496（= scrollY / 整页可滚高度）。传函数不在加速条件的覆盖范围内，值由 JS 逐帧写。
  const mainColRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: mainColRef, offset: ['start end', 'start 0.6'] });
  const mainOpacity = useTransform(scrollYProgress, (p) => p);
  // 系统开了「减少动态效果」就不下发：主栏停在默认的静止状态（不透明度 1）。
  const mainColMotionStyle = reduceMotion ? undefined : { opacity: mainOpacity };

  return (
    <section
      id="content"
      className="home-content-section"
      style={{
        padding: standalone ? '5.9rem 1rem 0' : '2rem 1rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="home-content-shell" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <Sidebar />
        <motion.div
          className="home-main-col"
          ref={mainColRef}
          style={{ flex: 1, minWidth: 0, ...mainColMotionStyle }}
        >
          {children ?? <MainContent />}
        </motion.div>
      </div>
      <style>{`
        /* 幕后区块：参考 biojuse.com 的卡片/轮播交互，配色沿用本站红色 */
        .blog-card {
          box-shadow: var(--shadow-card);
        }

        .blog-card:hover {
          box-shadow: var(--shadow-hover);
        }

        .blog-card-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 375ms ease-in 0.2s, transform 0.6s;
        }

        .blog-card:hover .blog-card-cover img {
          transform: scale(1.1);
        }

        /* 封面右下角的时间段标签，配合「幕后」卡片的全天作息动图 */
        .blog-card-mood {
          position: absolute;
          right: 0.75rem;
          bottom: 0.75rem;
          padding: 0.2rem 0.6rem;
          border-radius: 15px;
          /* 55% 的黑底压在亮封面上只有 2.5:1，白字会糊；压到 85% 才是干净的黑底白字 */
          background: rgba(10, 6, 9, 0.85);
          color: #fff;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
        }

        .blog-card-title {
          transition: color 0.2s ease-in-out;
        }

        .blog-card-title::before {
          content: '🔗';
          margin-right: 8px;
          font-size: 0.9em;
        }

        .blog-card:hover .blog-card-title {
          color: var(--text-link);
        }

        .blog-card-desc {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-card-meta {
          color: var(--text-muted);
          /* 90% 会跟着卡片字号一起缩水，窄屏上掉到 10.5px；给它一个 12.8px 的下限 */
          font-size: max(0.8rem, 90%);
          transition: color 0.2s ease-in-out;
        }

        .blog-card:hover .blog-card-meta {
          color: var(--text-link);
        }

        .blog-fade-text {
          display: inline-block;
          transition: opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease;
        }

        .blog-fade-text.is-hidden {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
          filter: blur(5px);
        }

        @media (max-width: 1100px) {
          .home-main-card {
            padding: 0 !important;
          }

          .home-post-grid {
            /* 大屏一行三张；窄到这个宽度三张就挤了，退回两列 */
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 900px) {
          .home-content-section {
            padding: ${standalone ? '5.25rem 0.85rem 0' : '1.25rem 0.85rem'} !important;
          }

          .home-content-shell {
            flex-direction: column !important;
          }

          .home-sidebar {
            position: static !important;
            width: 100% !important;
            top: auto !important;
          }

          .home-main-card {
            padding: 0 !important;
          }

          /* 最后一个区块（留言板）要贴住页脚：这里不能一刀切给所有区块加下边距，
             否则会盖掉它自己的内联 margin-bottom: 0，页脚上方就空出一条。 */
          .home-content-block:not(:last-child) {
            margin-bottom: 3rem !important;
          }
        }

        @media (max-width: 640px) {
          .home-content-section {
            padding: ${standalone ? '4.95rem 0.75rem 0' : '1.25rem 0.85rem'} !important;
          }

          .home-main-card {
            padding: 0 !important;
          }

          .home-content-block:not(:last-child) {
            margin-bottom: 2.5rem !important;
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
