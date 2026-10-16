import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/useTheme';
import { useSecondaryPageBackground } from './usePageBackground';

interface BackgroundProps {
  children: React.ReactNode;
}

// 全局主题背景：全站（含首页首屏）就这一张插画，不再随滚动在两张图之间切。
export const GlobalBackground = ({ children }: BackgroundProps) => {
  const { isDark } = useTheme();
  const location = useLocation();
  const secondaryBackground = useSecondaryPageBackground();
  const useSecondaryTheme = location.pathname !== '/';
  // /myself 用的也是 ContentSection；深色主题下它是「自己带纱」的那类，只跟首页一档。
  const paintsOwnVeil = location.pathname === '/myself';
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${secondaryBackground})`,
          backgroundSize: 'cover',
          // 插画（CY.webp 864x1216）被 cover 放大到铺满宽屏，只能看到中间一块；
          // 定位从 top 略往下 16%，让脸落在画面中间而不是被顶边切掉。
          backgroundPosition: 'center 16%',
          // CY.webp 平均亮度 0.78，夜里压一档免得插画抢文字；但 0.35 压过了头，整页会糊成一块黑。
          filter: isDark ? 'brightness(0.55)' : 'none',
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
          // 浅色主题：全站就这一层纱，值只由 --page-veil 决定（0.30），首页首屏、内容区、内页逐像素一致。
          // 以前内页在这儿单独压 0.66 白，那是「整个站太白」的主因——底色一旦被洗掉，卡片只能做得
          // 又白又厚去补对比，插画就没了。要调浓淡只改 index.css 里那一个令牌。
          // 深色主题维持原样：夜里这层是压暗用的，内页 0.66、首页 0.2（/myself 自己带纱，算首页那档）。
          backgroundColor: isDark
            ? (useSecondaryTheme && !paintsOwnVeil ? 'rgba(0, 0, 0, 0.66)' : 'rgba(0, 0, 0, 0.2)')
            : 'var(--page-veil)',
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
