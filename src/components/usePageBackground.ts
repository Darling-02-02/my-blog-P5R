import { useEffect, useState } from 'react';

const base = import.meta.env.BASE_URL;

export const homePageBackground = `${base}CY.png`;
const secondaryPageBackground = `${base}CY.png`;

export const useSecondaryPageBackground = () => secondaryPageBackground;

export const useScrollBackgroundPosition = () => {
  const [backgroundY, setBackgroundY] = useState('0%');

  useEffect(() => {
    let frame = 0;

    const syncBackgroundPosition = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        setBackgroundY(`${Math.round(progress * 100)}%`);
      });
    };

    syncBackgroundPosition();
    window.addEventListener('scroll', syncBackgroundPosition, { passive: true });
    window.addEventListener('resize', syncBackgroundPosition);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', syncBackgroundPosition);
      window.removeEventListener('resize', syncBackgroundPosition);
    };
  }, []);

  return `center ${backgroundY}`;
};
