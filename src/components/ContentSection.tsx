// 首页内容区骨架：只负责背景样式、响应式样式与「侧边栏 + 主内容」两栏编排。
import { useTheme } from '../contexts/useTheme';
import MainContent from './ContentSectionMain';
import Sidebar from './ContentSectionSidebar';
import { useScrollBackgroundPosition, useSecondaryPageBackground } from './usePageBackground';

interface ContentSectionProps {
  standalone?: boolean;
}

// 主组件
const ContentSection = ({ standalone = false }: ContentSectionProps) => {
  const { isDark } = useTheme();
  const secondaryBackground = useSecondaryPageBackground();
  const backgroundPosition = useScrollBackgroundPosition();
  // CY.png 本身很亮（平均亮度 0.78），夜间模式必须压一层黑，否则页面背景还是白的
  const sectionBackground = isDark
    ? `linear-gradient(180deg, rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.72) 24%, rgba(0, 0, 0, 0.82) 100%), url(${secondaryBackground})`
    : `linear-gradient(180deg, rgba(255, 249, 244, 0.03), rgba(255, 246, 240, 0.06) 24%, rgba(255, 242, 235, 0.1) 100%), url(${secondaryBackground})`;

  return (
    <section
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
          <MainContent />
        </div>
      </div>
      <style>{`
        @media (max-width: 1100px) {
          .home-main-card {
            padding: 0 !important;
          }

          .home-profile-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }

          .home-post-grid {
            gap: 1.5rem !important;
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

          .home-profile-pane {
            padding: 1rem !important;
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
