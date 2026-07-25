import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { heroSlideshowImages } from './imageConfig';
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
  const backgroundPosition = useHomeBackground ? 'center center' : 'center top';
  const overlayColor = useHomeBackground
    ? isDark
      ? 'rgba(0, 0, 0, 0.38)'
      : 'rgba(0, 0, 0, 0.08)'
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
          backgroundColor: useHomeBackground ? '#0a0a0a' : 'transparent',
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

// Hero 区域背景 - 图片渐变切换
export const HeroSlideshowBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    heroSlideshowImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSlideshowImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
      }}
    >
      {heroSlideshowImages.map((src, index) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: index === currentIndex ? 1 : 0,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.5) 100%)',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default GlobalBackground;
