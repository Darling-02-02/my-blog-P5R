// 首页内容区骨架：只负责背景样式、响应式样式与「侧边栏 + 主内容」两栏编排。
import type { ReactNode } from 'react';
import { useTheme } from '../contexts/useTheme';
import MainContent from './ContentSectionMain';
import Sidebar from './ContentSectionSidebar';
import { useScrollBackgroundPosition, useSecondaryPageBackground } from './usePageBackground';

interface ContentSectionProps {
  standalone?: boolean;
  // 别的独立页（/myself）把自己的区块塞进来，复用同一套外壳与响应式样式；
  // 不传就是首页内容区。
  children?: ReactNode;
}

// 主组件
const ContentSection = ({ standalone = false, children }: ContentSectionProps) => {
  const { isDark } = useTheme();
  const secondaryBackground = useSecondaryPageBackground();
  const backgroundPosition = useScrollBackgroundPosition();
  // CY.webp 本身很亮（平均亮度 0.78），夜间模式必须压一层黑，否则页面背景还是白的；
  // 白天模式原来只叠了 3%~10% 白，正文直接糊在彩色插画上（实测对比度 1.1:1），同样要压一层白。
  const sectionBackground = isDark
    ? `linear-gradient(180deg, rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.72) 24%, rgba(0, 0, 0, 0.82) 100%), url(${secondaryBackground})`
    : `linear-gradient(180deg, rgba(255, 249, 244, 0.66), rgba(255, 246, 240, 0.72) 24%, rgba(255, 242, 235, 0.82) 100%), url(${secondaryBackground})`;

  return (
    <section
      id="content"
      className="home-content-section"
      style={{
        padding: standalone ? '5.9rem 1rem 2rem' : '2rem 1rem',
        position: 'relative',
        zIndex: 1,
        backgroundImage: sectionBackground,
        backgroundSize: 'cover',
        backgroundPosition,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="home-content-shell" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          {children ?? <MainContent />}
        </div>
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
            padding: ${standalone ? '5.25rem 0.85rem 1.35rem' : '1.25rem 0.85rem'} !important;
            background-attachment: scroll !important;
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

          .home-content-block {
            margin-bottom: 3rem !important;
          }
        }

        @media (max-width: 640px) {
          .home-content-section {
            padding: ${standalone ? '4.95rem 0.75rem 1.15rem' : '1.25rem 0.85rem'} !important;
          }

          .home-main-card {
            padding: 0 !important;
          }

          .home-content-block {
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
