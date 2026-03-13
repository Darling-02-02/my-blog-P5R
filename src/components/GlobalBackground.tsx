import { useEffect, useState } from 'react';
import { heroSlideshowImages } from './imageConfig';
import { useTheme } from '../contexts/useTheme';

const base = import.meta.env.BASE_URL;
const kaguyaBackground = `${base}kaguya-background.jpg`;

interface BackgroundProps {
  children: React.ReactNode;
}

export const GlobalBackground = ({ children }: BackgroundProps) => {
  const { isDark } = useTheme();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${kaguyaBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
          zIndex: -2,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: isDark
            ? 'linear-gradient(180deg, rgba(8, 8, 14, 0.62), rgba(8, 8, 14, 0.78))'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.56))',
          zIndex: -1,
          transition: 'background 0.4s ease',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </>
  );
};

export const HeroSlideshowBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    heroSlideshowImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSlideshowImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
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
            inset: 0,
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
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.5) 100%)',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default GlobalBackground;
