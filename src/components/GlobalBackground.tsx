import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/useTheme';
import { useSecondaryPageBackground } from './usePageBackground';

interface BackgroundProps {
  children: React.ReactNode;
}

// 全局主题背景
export const GlobalBackground = ({ children }: BackgroundProps) => {
  const { isDark } = useTheme();
  const location = useLocation();
  const secondaryBackground = useSecondaryPageBackground();
  const [isInHomeHeroSection, setIsInHomeHeroSection] = useState(location.pathname === '/');
  const isHomeRoute = location.pathname === '/';
  const useSecondaryTheme = !isHomeRoute;
  const useHomeBackground = isHomeRoute && isInHomeHeroSection;
  const activeBackground = useHomeBackground ? '' : secondaryBackground;
  // 次级页面的插画（CY.png 864x1216）被 cover 放大到铺满宽屏，只能看到中间一块；
  // 定位从 top 略往下 16%，让脸落在画面中间而不是被顶边切掉。
  const backgroundPosition = useHomeBackground ? 'center center' : 'center 16%';
  const overlayColor = useHomeBackground
    ? isDark
      ? 'rgba(0, 0, 0, 0.38)'
      : 'rgba(0, 0, 0, 0.08)'
    : isDark
      ? 'rgba(0, 0, 0, 0.42)'
      : 'rgba(255, 248, 242, 0.08)';

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    let frame = 0;

    const syncHeroState = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const heroSection = document.getElementById('home');

        if (!heroSection) {
          setIsInHomeHeroSection((prev) => (prev ? false : prev));
          return;
        }

        const rect = heroSection.getBoundingClientRect();
        const nextIsInHero = rect.bottom > 0;
        setIsInHomeHeroSection((prev) => (prev === nextIsInHero ? prev : nextIsInHero));
      });
    };

    window.addEventListener('scroll', syncHeroState, { passive: true });
    window.addEventListener('resize', syncHeroState);
    frame = window.requestAnimationFrame(syncHeroState);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', syncHeroState);
      window.removeEventListener('resize', syncHeroState);
    };
  }, [isHomeRoute]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: activeBackground ? `url(${activeBackground})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition,
          backgroundColor: useHomeBackground ? (isDark ? '#0a0a0a' : '#f5f5f7') : 'transparent',
          // CY.png 平均亮度 0.78，夜间要压得比"卡片"更狠，不然后面没铺深色遮罩的页面（如 /about）还是灰的
          filter: isDark ? 'brightness(0.35)' : 'none',
          transition: 'filter 0.4s ease',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: overlayColor,
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'background-color 0.4s ease',
        }}
      />

      <div className={useSecondaryTheme ? 'secondary-page-theme' : undefined} style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  );
};

export default GlobalBackground;
