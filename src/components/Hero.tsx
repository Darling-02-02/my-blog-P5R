import { useState, useEffect } from 'react';
import Header from './Header';

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
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

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
      <Header />
      <div className="background-container">
        <div className="background-overlay" />
      </div>

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
          background: linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,245,248,0.9));
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 20%, rgba(255, 0, 64, 0.18), rgba(255, 0, 64, 0.04) 45%, transparent 70%);
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
          color: #2a2a2a;
          max-width: 90%;
          margin: 0 auto;
          min-height: 2rem;
          animation: quoteFloat 3s ease-in-out infinite, quoteGlow 2s ease-in-out infinite alternate;
          text-shadow: 0 2px 8px rgba(255, 182, 193, 0.35);
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
          from { text-shadow: 0 2px 8px rgba(255, 182, 193, 0.35); }
          to { text-shadow: 0 4px 16px rgba(255, 105, 180, 0.25); }
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
