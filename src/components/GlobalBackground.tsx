import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { heroSlideshowImages } from './imageConfig';
import { useTheme } from '../contexts/useTheme';
import { homePageBackground, useSecondaryPageBackground } from './usePageBackground';

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
  const activeBackground = useHomeBackground ? homePageBackground : secondaryBackground;
  const overlayColor = useHomeBackground
    ? isDark
      ? 'rgba(0, 0, 0, 0.38)'
      : 'rgba(0, 0, 0, 0.08)'
    : 'rgba(255, 248, 242, 0.08)';

  useEffect(() => {
    if (!isHomeRoute) {
      setIsInHomeHeroSection(false);
      return;
    }

    const syncHeroState = () => {
      const heroSection = document.getElementById('home');
      if (!heroSection) {
        setIsInHomeHeroSection(false);
        return;
      }

      const rect = heroSection.getBoundingClientRect();
      setIsInHomeHeroSection(rect.bottom > 0);
    };

    window.addEventListener('scroll', syncHeroState, { passive: true });
    window.addEventListener('resize', syncHeroState);
    syncHeroState();

    return () => {
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
          backgroundImage: `url(${activeBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
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
