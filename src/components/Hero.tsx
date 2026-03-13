import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { articles } from '../data/articles';
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
  const navigate = useNavigate();
  const quotes = useMemo(
    () =>
      quotesRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [],
  );
  const stats = useMemo(
    () => [
      { label: '文章', value: String(articles.length).padStart(2, '0') },
      { label: '分类', value: String(new Set(articles.map((article) => article.category)).size).padStart(2, '0') },
      { label: '标签', value: String(new Set(articles.flatMap((article) => article.tags)).size).padStart(2, '0') },
    ],
    [],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const imgInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(imgInterval);
  }, []);

  useEffect(() => {
    if (!quotes.length) return;
    const quoteInterval = setInterval(() => {
      setIsQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsQuoteVisible(true);
      }, 450);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, [quotes]);

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
        <div className="hero-surface">
          <p className="hero-kicker">PERSONA MODE · PERSONAL BLOG</p>
          <h1 className="hero-title">灵敏度加满的 blog</h1>
          <p className={`hero-quote ${isQuoteVisible ? 'quote-visible' : 'quote-hidden'}`}>
            {quotes[quoteIndex] ?? ''}
          </p>

          <div className="hero-stats">
            {stats.map((item) => (
              <div key={item.label} className="hero-stat-card">
                <span className="hero-stat-value">{item.value}</span>
                <span className="hero-stat-label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="hero-actions">
            <button type="button" className="hero-action hero-action-primary" onClick={() => scrollToSection('blog')}>
              进入幕后
            </button>
            <button type="button" className="hero-action hero-action-secondary" onClick={() => navigate('/study-room')}>
              打开 Study Room
            </button>
            <a className="hero-action hero-action-ghost" href="https://github.com/Darling-02-02" target="_blank" rel="noreferrer">
              GitHub
            </a>
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
          max-width: 1100px;
          display: grid;
          gap: 1.5rem;
          justify-items: center;
        }

        .hero-surface {
          width: min(100%, 840px);
          text-align: center;
          padding: clamp(1.5rem, 3vw, 2.2rem);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(180deg, rgba(16, 16, 22, 0.52), rgba(16, 16, 22, 0.28));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(12px);
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.9rem;
          margin-bottom: 1rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
          letter-spacing: 0.18em;
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

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
          margin-top: 1.8rem;
        }

        .hero-stat-card {
          display: grid;
          gap: 0.3rem;
          padding: 0.95rem 1rem;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .hero-stat-value {
          color: #fff;
          font-size: clamp(1.35rem, 3vw, 2rem);
          font-weight: 800;
        }

        .hero-stat-label {
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.9rem;
          margin-top: 1.8rem;
        }

        .hero-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 160px;
          padding: 0.8rem 1.2rem;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
        }

        .hero-action:hover {
          transform: translateY(-2px);
        }

        .hero-action-primary {
          color: #fff;
          background: linear-gradient(135deg, #ff0040, #ff5f6d);
          box-shadow: 0 12px 24px rgba(255, 0, 64, 0.28);
        }

        .hero-action-secondary {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
        }

        .hero-action-ghost {
          color: #fff;
          background: transparent;
          border-color: rgba(255, 255, 255, 0.28);
        }

        .hero-scroll {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.84);
          font-size: 0.88rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-transform: uppercase;
          padding: 0.35rem 0.4rem;
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

          .hero-surface {
            border-radius: 22px;
          }

          .hero-quote {
            max-width: 95%;
            min-height: 4.4rem;
          }

          .hero-stats {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            flex-direction: column;
          }

          .hero-action {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
