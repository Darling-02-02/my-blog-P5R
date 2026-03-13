import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import quotesRaw from '../../语录.txt?raw';

const base = import.meta.env.BASE_URL;
const images = [
  `${base}slideshow/slideshow-0.png`,
  `${base}slideshow/slideshow-1.png`,
  `${base}slideshow/slideshow-2.png`,
  `${base}slideshow/slideshow-3.png`,
  `${base}slideshow/slideshow-4.png`,
  `${base}slideshow/slideshow-5.png`,
  `${base}slideshow/slideshow-6.png`,
  `${base}slideshow/slideshow-7.png`,
  `${base}slideshow/slideshow-8.png`,
  `${base}slideshow/slideshow-9.png`,
  `${base}slideshow/slideshow-10.png`,
  `${base}slideshow/slideshow-11.png`,
  `${base}slideshow/slideshow-12.png`,
];

export default function Hero() {
  const quotes = useMemo(
    () =>
      quotesRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const marqueeText = useMemo(() => {
    const source = quotes.slice(0, 8);
    return [...source, ...source].join('  ·  ');
  }, [quotes]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const imgInterval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(imgInterval);
  }, []);

  return (
    <section id="home" className="hero-section">
      <Header />
      <div className="background-container">
        {images.map((src, index) => (
          <img key={src} src={src} alt="" className={`background-image ${index === currentIndex ? 'active' : ''}`} />
        ))}
        <div className="background-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-title-stack">
          <h1 className="hero-title">灵敏度加满的 blog</h1>
          <div className="hero-marquee" aria-label="站点语录滚动带">
            <div className="hero-marquee-track">
              <span>{marqueeText}</span>
              <span>{marqueeText}</span>
            </div>
          </div>
        </div>

        <button type="button" className="hero-scroll" onClick={() => scrollToSection('profile')}>
          向下阅读
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
          inset: 0;
        }

        .background-image {
          position: absolute;
          inset: 0;
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
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.38) 42%, rgba(0, 0, 0, 0.58)),
            radial-gradient(circle at center, rgba(255, 0, 64, 0.08), transparent 56%);
        }

        .hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1200px;
          padding: 1rem;
          display: grid;
          gap: 1.25rem;
          justify-items: center;
        }

        .hero-title-stack {
          width: min(100%, 940px);
          display: grid;
          gap: 1.25rem;
          justify-items: center;
          text-align: center;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(2.4rem, 11vw, 6rem);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: 0.02em;
          background: linear-gradient(45deg, #ffffff, #ffd9e3, #ff7c99, #ffffff);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 6s ease infinite;
          text-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero-marquee {
          width: min(100%, 920px);
          overflow: hidden;
          border-top: 1px solid rgba(255, 255, 255, 0.22);
          border-bottom: 1px solid rgba(255, 255, 255, 0.22);
          background: linear-gradient(90deg, rgba(10, 10, 16, 0.2), rgba(10, 10, 16, 0.62), rgba(10, 10, 16, 0.2));
          backdrop-filter: blur(8px);
        }

        .hero-marquee-track {
          display: flex;
          width: max-content;
          gap: 2.4rem;
          padding: 0.85rem 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: clamp(0.86rem, 2vw, 1rem);
          letter-spacing: 0.1em;
          white-space: nowrap;
          animation: marqueeMove 38s linear infinite;
        }

        @keyframes marqueeMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .hero-scroll {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.88);
          font-size: 0.9rem;
          letter-spacing: 0.16em;
          cursor: pointer;
          text-transform: uppercase;
          padding: 0.35rem 0.4rem;
        }

        @media (max-width: 768px) {
          .hero-content {
            padding: 4rem 1rem 2rem;
          }

          .hero-title {
            font-size: clamp(2.1rem, 16vw, 4rem);
          }

          .hero-marquee-track {
            animation-duration: 26s;
          }
        }
      `}</style>
    </section>
  );
}
