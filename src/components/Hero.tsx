import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import quotesRaw from '../../语录.txt?raw';
import { heroSlideshowImages } from './imageConfig';

const preloadSlide = (src: string) => {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
};

export default function Hero() {
  const navigate = useNavigate();
  const quotes = useMemo(
    () =>
      quotesRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [],
  );

  const [slideState, setSlideState] = useState({ current: 0, previous: 0 });
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const visibleSlideIndexes = [...new Set([slideState.previous, slideState.current])];

  useEffect(() => {
    heroSlideshowImages.slice(0, 2).forEach(preloadSlide);
  }, []);

  useEffect(() => {
    const imgInterval = setInterval(() => {
      setSlideState((prev) => {
        const next = (prev.current + 1) % heroSlideshowImages.length;
        preloadSlide(heroSlideshowImages[(next + 1) % heroSlideshowImages.length]);
        return { current: next, previous: prev.current };
      });
    }, 5000);
    return () => clearInterval(imgInterval);
  }, []);

  useEffect(() => {
    if (!quotes.length) return;
    let hideTimer = 0;
    const quoteInterval = setInterval(() => {
      setIsQuoteVisible(false);
      hideTimer = window.setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsQuoteVisible(true);
      }, 450);
    }, 5000);
    return () => {
      clearInterval(quoteInterval);
      window.clearTimeout(hideTimer);
    };
  }, [quotes]);

  return (
    <section id="home" className="hero-section">
      <Header />
      <div className="background-container">
        {visibleSlideIndexes.map((index) => (
          <img
            key={`${heroSlideshowImages[index]}-${index === slideState.current ? 'active' : 'previous'}`}
            src={heroSlideshowImages[index]}
            alt=""
            className={`background-image ${index === slideState.current ? 'active' : ''}`}
            decoding="async"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
        <div className="background-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <h1 className="hero-title">灵敏度加满的 blog</h1>
          <p className={`hero-quote ${isQuoteVisible ? 'quote-visible' : 'quote-hidden'}`}>
            {quotes[quoteIndex] ?? ''}
          </p>
        </div>

        <button type="button" className="hero-scroll" onClick={() => navigate('/explore')} aria-label="进入内容页">
          <span className="hero-scroll-label">点击进入内容页</span>
          <span className="hero-scroll-pointer">
            <span className="hero-scroll-chevron" />
            <span className="hero-scroll-chevron" />
            <span className="hero-scroll-line" />
          </span>
        </button>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .background-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 1.4s ease-in-out;
          will-change: opacity;
        }

        .background-image.active {
          opacity: 1;
        }

        .background-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.26), rgba(0, 0, 0, 0.52));
        }

        .hero-content {
          position: relative;
          z-index: 1;
          padding: 1rem;
          width: 100%;
          max-width: 920px;
          display: grid;
          gap: 1.1rem;
          justify-items: center;
        }

        .hero-copy {
          width: min(100%, 760px);
          text-align: center;
        }

        .hero-title {
          font-size: clamp(1.5rem, 8vw, 4rem);
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(45deg, #ff6b9d, #c44569, #ff9ff3, #feca57, #ff9ff3, #c44569, #ff6b9d);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite, bounce 2s ease-in-out infinite;
          word-break: break-word;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .hero-quote {
          font-size: clamp(0.9rem, 3.8vw, 1.35rem);
          color: #fff;
          max-width: 90%;
          margin: 0 auto;
          min-height: 2rem;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
          font-weight: 500;
          letter-spacing: 0.3px;
          line-height: 1.6;
          padding: 0 0.5rem;
        }

        .hero-scroll {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          display: grid;
          gap: 0.5rem;
          justify-items: center;
          padding: 0.25rem 0.4rem 0.8rem;
        }

        .hero-scroll-label {
          font-size: 0.92rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.5);
        }

        .hero-scroll-pointer {
          display: grid;
          justify-items: center;
          gap: 0.15rem;
          animation: pointerFloat 1.8s ease-in-out infinite;
        }

        .hero-scroll-chevron {
          width: 14px;
          height: 14px;
          border-right: 2px solid rgba(255, 255, 255, 0.92);
          border-bottom: 2px solid rgba(255, 255, 255, 0.92);
          transform: rotate(45deg);
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.36));
        }

        .hero-scroll-line {
          width: 2px;
          height: 28px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.18));
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
        }

        @keyframes pointerFloat {
          0%, 100% { transform: translateY(0); opacity: 0.84; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        .quote-visible {
          opacity: 1;
          transform: scale(1) translateY(0);
          transition: all 0.45s ease;
        }

        .quote-hidden {
          opacity: 0;
          transform: scale(0.96) translateY(14px);
          transition: all 0.45s ease;
        }

        @media (max-width: 768px) {
          .hero-content {
            padding: 4rem 1rem 2rem;
          }

          .hero-quote {
            max-width: 95%;
            min-height: 4.4rem;
          }
        }
      `}</style>
    </section>
  );
}
