import { useState, useEffect } from 'react';
import { heroSlideshowImages } from './imageConfig';
import { useTheme } from '../contexts/ThemeContext';

const base = import.meta.env.BASE_URL;

interface BackgroundProps {
  children: React.ReactNode;
}

// 全局主题背景
export const GlobalBackground = ({ children }: BackgroundProps) => {
  const { isDark } = useTheme();

  return (
    <>
      {/* 全局固定背景图片 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${base}图片_1.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -2,
        }}
      />
      
      {/* 全局遮罩 - 根据主题调整透明度 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.35)',
          zIndex: -1,
          transition: 'background-color 0.4s ease',
        }}
      />
      
      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  );
};

// Hero区域背景 - 图片渐变切换
export const HeroSlideshowBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    // 预加载所有图片
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
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      overflow: 'hidden',
      backgroundColor: '#0a0a0a',
    }}>
      {/* 所有图片层 - 堆叠显示 */}
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

      {/* 渐变遮罩 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.2) 0%, rgba(10, 10, 10, 0.5) 100%)',
        zIndex: 2,
      }} />
    </div>
  );
};

export default GlobalBackground;
