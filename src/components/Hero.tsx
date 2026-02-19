import { useState, useEffect } from 'react';

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
  '你好，这里是未被发现的天才的家 ——《海绵宝宝》',
  'では、ゲームを始めましょう——《游戏人生》',
  '花无凋零之时 爱无传达之日 爱情亘古不变 紫罗兰与世长存——《紫罗兰永恒花园》',
  '未闻花名 但知花香 再遇花时 泪已成形——《未闻花名》',
  '天气因你变晴 世界因你变美 ——《天气之子》',
  '能哭的地方只有厕所和爸爸的怀里——《CLANNAD》',
  '愿你与重要的人能够再次相逢——《可塑性记忆》',
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
      }, 500);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, []);

  return (
    <section id="home" className="hero-section">
      {/* 背景图片层 */}
      <div className="background-container">
        {images.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`background-image ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
        <div className="background-overlay" />
      </div>

      {/* 内容层 */}
      <div className="hero-content">
        <h1 className="hero-title">灵敏度加满的blog</h1>
        <p className={`hero-quote ${isQuoteVisible ? 'quote-visible' : 'quote-hidden'}`}>
          {quotes[quoteIndex]}
        </p>
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
          background-color: #000;
        }

        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
        }

        .background-image.active {
          opacity: 1;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
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
          font-weight: bold;
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
          font-size: clamp(0.875rem, 4vw, 1.5rem);
          color: #fff;
          max-width: 90%;
          margin: 0 auto;
          min-height: 2rem;
          animation: quoteFloat 3s ease-in-out infinite, quoteGlow 2s ease-in-out infinite alternate;
          text-shadow: 0 0 20px rgba(255, 182, 193, 0.8), 0 0 40px rgba(255, 105, 180, 0.4);
          font-weight: 500;
          letter-spacing: 0.5px;
          line-height: 1.6;
          padding: 0 0.5rem;
        }

        @keyframes quoteFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }

        @keyframes quoteGlow {
          from { text-shadow: 0 0 20px rgba(255, 182, 193, 0.8), 0 0 40px rgba(255, 105, 180, 0.4); }
          to { text-shadow: 0 0 30px rgba(255, 182, 193, 1), 0 0 60px rgba(255, 105, 180, 0.6), 0 0 80px rgba(255, 159, 243, 0.4); }
        }

        .quote-visible {
          opacity: 1;
          transform: scale(1) translateY(0);
          transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .quote-hidden {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
          transition: all 0.5s ease-in;
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
