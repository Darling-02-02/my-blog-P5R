import { useTheme } from '../contexts/useTheme';

// 职责：按主题给出 /about 页面各层半透明面板与文字颜色，供 AboutMe 及其展示区块共用
export type AboutMeColors = {
  pagePanel: string;
  cardPanel: string;
  innerPanel: string;
  tilePanel: string;
  chipPanel: string;
  borderColor: string;
  subtleText: string;
  bodyText: string;
  headingText: string;
};

export const useAboutMeTheme = (): AboutMeColors => {
  const { isDark } = useTheme();
  // 这几个面板原本是写死的半透明白，夜间模式下会糊成中灰，所以按主题给两组值
  const pagePanel = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.18)';
  const cardPanel = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.22)';
  const innerPanel = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.16)';
  const tilePanel = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.2)';
  const chipPanel = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.18)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(110, 72, 84, 0.18)';
  const subtleText = 'var(--text-secondary)';
  const bodyText = 'var(--text-body)';
  const headingText = 'var(--text-heading)';

  return {
    pagePanel,
    cardPanel,
    innerPanel,
    tilePanel,
    chipPanel,
    borderColor,
    subtleText,
    bodyText,
    headingText,
  };
};
