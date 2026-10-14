import Header from './Header';

// 首屏：一行标题 + 一个「往下滑」的指示，不再有自己的背景——原来每 5 秒换图的轮播早撤了，
// 撤剩的 slideshow-0.webp 也一起下掉，整站只留全局那一张 CY.webp。
// 内容区（原 /explore）直接跟在下面，滚轮就能滑下去，所以这里的按钮只是把页面滚下去，不做路由跳转。
export default function Hero() {
  const scrollToContent = () => {
    document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero-section">
      <Header />
      {/* 首屏不画自己的插画，字直接压在全局背景上；浅色主题那张图太亮，靠这一层暖白洗底压住 */}
      <div className="hero-scrim" aria-hidden="true" />

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

        /* 首屏洗底层：整块铺满、不做渐变——渐变会让首屏底部退回没洗过的原图，
           而下面的内容区是洗过的，两者之间会接出一条硬边。值按主题走：
           浅色是暖白洗底（跟内容区同一族，所以深字压得住），深色是 transparent（全局那档已经压过了）。 */
        .hero-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: var(--hero-scrim);
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

        /* 首屏标题：只留「字重 + 字号」，装饰全删，跟参考站一个路子。
           这里前后被改过两轮，方向都是「加格式」——先是粉紫渐变动画，后是 900 字重
           + 8 向黑描边 + 红色块面偏移——字本身没变好看，只是被装饰堆住了。
           字重停在 700：index.html 只请求了 400/500/700/900，写 600 会被挑到最近的 700。
           颜色走 --text-heading：浅色主题给深字（在暖白洗底上够亮），深色主题给白字。 */
        .hero-title {
          font-size: clamp(1.75rem, 5vw, 2.75rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text-heading);
          word-break: break-word;
        }

        .hero-scroll {
          border: none;
          background: transparent;
          color: var(--text-heading);
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
          border-right: 2px solid currentColor;
          border-bottom: 2px solid currentColor;
          transform: rotate(45deg);
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.36));
        }

        .hero-scroll-line {
          width: 2px;
          height: 28px;
          background: linear-gradient(180deg, currentColor, transparent);
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
