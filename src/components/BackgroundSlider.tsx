import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 背景图片配置 - 从fig文件夹直接访问
const backgroundImages = [
  '/芳泽霞.jpg',
  '/高卷杏.jpg',
  '/明智吾郎.jpg',
  '/摩尔加纳.jpg',
  '/新岛真.jpg',
  '/雨宫莲.jpg',
  '/佐仓双叶.jpg',
];

const heroBackground = '/1c4541beb03e03c9bf8e5ce7a0b2eeaf.jpg';

interface BackgroundSliderProps {
  children: React.ReactNode;
}

export const BackgroundSlider = ({ children }: BackgroundSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 背景层 - 固定在底层 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
      }}>
        {/* 主背景图 - 背景.png */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/背景.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
        }} />

        {/* 渐变切换的角色背景 */}
        <AnimatePresence mode="sync">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${backgroundImages[currentIndex]})`,
              backgroundSize: 'contain',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </AnimatePresence>

        {/* 深色遮罩层 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 26, 0.7) 50%, rgba(10, 10, 10, 0.8) 100%)',
        }} />
      </div>

      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  );
};

export const HeroBackground = () => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Hero背景图片 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* 渐变遮罩 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(10, 10, 10, 0.3) 0%, rgba(10, 10, 10, 0.6) 50%, rgba(10, 10, 10, 0.85) 100%)',
      }} />
    </div>
  );
};

export default BackgroundSlider;
