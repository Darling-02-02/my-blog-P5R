import { useEffect, useState } from 'react';
import Header from './Header';

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

const quotes = [
  '保持专注，慢一点也没关系。',
  '今天学会一点点，明天就会强很多。',
  '你现在的每一分钟，都会在未来回报你。',
  '别和别人比，和昨天的自己比就够了。',
  '再坚持一下，这轮结束就休息。',
  '状态不好也没关系，先坐下开始。',
  '专注不是不分心，而是分心后再回来。',
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  useEffect(() => {
    const imgInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(imgInterval);
  }, []);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setIsQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsQuoteVisible(true);
      }, 450);
    }, 5000);
    return () => clearInterval(quoteInterval);
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
        <h1 className="hero-title">灵敏度加满的 blog</h1>
        <p className={`hero-quote ${isQuoteVisible ? 'quote-visible' : 'quote-hidden'}`}>{quotes[quoteIndex]}</p>
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
          text-align: center;
          z-index: 1;
          padding: 1rem;
          width: 100%;
          max-width: 100%;
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
          }
        }
      `}</style>
    </section>
  );
}
