import Header from './Header';
import { heroImage } from './imageConfig';

// 首屏：一张静态图 + 一行标题 + 一个「往下滑」的指示。
// 不再轮播（原先每 5 秒换图、每 5 秒换一句语录）：内容区（原 /explore）直接跟在下面，滚轮就能滑下去，
// 所以这里的按钮也只是把页面滚下去，不做路由跳转。
export default function Hero() {
  const scrollToContent = () => {
    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section">
      <Header />
      <div className="background-container">
        <img
          src={heroImage}
          alt=""
          className="background-image"
          aria-hidden="true"
          decoding="async"
          loading="eager"
        />
        <div className="background-overlay" />
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <h1 className="hero-title">灵敏度加满</h1>
        </div>

        <button type="button" className="hero-scroll" onClick={scrollToContent} aria-label="进入内容区">
          <span className="hero-scroll-label">往下滑</span>
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
          pointer-events: none;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .background-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.4));
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

        /* 首屏标题：用站点自己的红黑硬边字，而不是粉紫渐变色（渐变在深色插画上发灰，
           而且「渐变位移 + 上下弹跳」两条无限动画同时跑会把视线从正文拉走）。 */
        .hero-title {
          font-size: clamp(1.5rem, 8vw, 4rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
          text-shadow: 0.055em 0.055em 0 var(--p5-red), 0 6px 26px rgba(0, 0, 0, 0.55);
          word-break: break-word;
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

        @media (max-width: 768px) {
          .hero-content {
            padding: 4rem 1rem 2rem;
          }
        }
      `}</style>
    </section>
  );
}
