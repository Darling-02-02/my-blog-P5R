import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { heroSlideshowImages } from './imageConfig';

interface BackgroundProps {
  children: React.ReactNode;
}

// 全局主题背景 - 使用主题.png
export const GlobalBackground = ({ children }: BackgroundProps) => {
  return (
    <>
      {/* 全局主题背景层 - 直接使用内联样式 */}
      <div 
        className="global-theme-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          overflow: 'hidden',
          backgroundColor: '#0a0a0a',
        }}
      >
        {/* 其他页面背景 - 图片_1.jpg，缩小显示 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/图片_1.jpg)',
            backgroundSize: '80%',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            opacity: 0.5,
          }}
        />

        {/* 浅色遮罩层 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 10, 10, 0.4)',
          }}
        />
      </div>

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
  const [loadedImages, setLoadedImages] = useState<boolean[]>(new Array(heroSlideshowImages.length).fill(false));

  useEffect(() => {
    // 预加载所有图片
    heroSlideshowImages.forEach((src, index) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLoadedImages(prev => {
          const newLoaded = [...prev];
          newLoaded[index] = true;
          return newLoaded;
        });
      };
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
