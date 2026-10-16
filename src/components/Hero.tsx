import { useMemo, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useArticles } from '../contexts/useArticles';
import { useContent } from '../contexts/useContent';
import Header from './Header';

// 首屏：一张头像 + 一行标题，不再有自己的背景——原来每 5 秒换图的轮播早撤了，
// 撤剩的 slideshow-0.webp 也一起下掉，整站只留全局那一张 CY.webp。
// 内容区（原 /explore）直接跟在下面，滚轮就能滑下去。
// 头像是 public/头像.jpg，跟侧栏 ProfileCard 用的是同一张（那边 90px，这边放大一档）。
// 首屏标题逐字「加载」进来：每个字从下方浮起 + 淡入，14 个字约 1 秒读完。
// 不用 CSS 打字机（width: 0→100% + steps()）：那套必须配合 overflow:hidden 与 nowrap，
// 窄屏上标题就只能被裁掉、不能折行。逐字 span 没这个问题，节奏还能单独调。
// prefers-reduced-motion: reduce 时直接输出整串，一个字都不动画。
const TITLE = '灵敏度加满のblog';

export default function Hero() {
  const base = import.meta.env.BASE_URL;
  const reduceMotion = useReducedMotion();

  // 首页 → 幕后的「转场」：首屏内容跟着滚动进度后退、淡出，内容区主栏（ContentSection 里那份）同时上浮淡入。
  // 用滚动进度映射而不是定时器：动画跟手，滚一半就停在一半，滚回去还能倒着回放。
  // 不劫持滚轮、不做整屏吸附——那会破坏触控板惯性、键盘翻页和锚点跳转。
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  // 不透明度用「函数式 useTransform」，不用输入区间。区间形式会被 motion 的 accelerate 快路径接走：
  // 它给元素挂一条 ScrollTimeline 动画（WAAPI 在层叠里压过内联样式），而那条时间轴的进度是「整页」的，
  // 不是 useScroll({ target }) 算出来的「这一段」的进度——实测滚动满一屏（元素进度 1.0）时不透明度只走到
  // 0.34，虽然它的 keyframes 里明写着 offset 0.75 就到 0。传函数不满足快路径的条件，值就由 JS 按
  // scrollYProgress（元素进度，和 y/scale 同一套刻度）算，声明什么就是什么。
  const heroOpacity = useTransform(scrollYProgress, (p) => Math.max(0, 1 - p / 0.75));
  // 系统开了「减少动态效果」就不下发这组值：元素停在默认的静止状态，什么都不动。
  const heroMotionStyle = reduceMotion
    ? undefined
    : { y: heroY, opacity: heroOpacity, scale: heroScale };

  // 「下滑到幕后」的提示：点了滚到 #blog——页头那项「幕后」跳的也是这一块，
  // 那边在 index.css 里留了 scroll-margin-top，落点不会被固定页头压住。
  // 栏目表整个空掉时首页上没有 #blog，那就不显示这个提示（跟页头藏「幕后」同一个判断，省得点了没反应）。
  const { articles } = useArticles();
  const { getCategoryData } = useContent();
  const hasColumns = useMemo(() => getCategoryData(articles).length > 0, [articles, getCategoryData]);

  const scrollToBlog = () => {
    // 开了「减少动态效果」就直接到位：CSS 里那条 scroll-behavior: auto 管不到 scrollIntoView 的显式参数。
    document.getElementById('blog')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section id="home" className="hero-section" ref={heroRef}>
      <Header />
      {/* 首屏不画自己的插画，字直接压在全局背景上（纱只由 GlobalBackground 铺一层）。
          这层现在自己不上色，只当「帘子」那两个伪元素的挂点：开页时向两侧拉开。 */}
      <div className="hero-scrim" aria-hidden="true" />

      <motion.div className="hero-content" style={heroMotionStyle}>
        <div className="hero-copy">
          <img
            className="hero-avatar"
            src={`${base}头像.jpg`}
            alt="灵敏度加满 的头像"
            width="132"
            height="132"
          />
          <h1 className="hero-title">
            {reduceMotion
              ? TITLE
              : [...TITLE].map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: '0.4em' }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.055, ease: 'easeOut' }}
                    style={{ display: 'inline-block' }}
                  >
                    {char}
                  </motion.span>
                ))}
          </h1>
        </div>

        {hasColumns && (
          <button type="button" className="hero-scroll-cue" onClick={scrollToBlog}>
            下滑到幕后
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 9.5 12 15.5 18 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </motion.div>

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

        /* 首屏不再自己铺纱：全站那唯一一层 --page-veil 已经在 GlobalBackground 里铺好了，
           这里再铺一遍就是两层叠着，首屏会比内容区明显发白。保留这个元素只因为下面那两块
           「帘子」挂在它的伪元素上。 */
        .hero-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* 背景上那两块「帘子」：进场时朝两侧拉开——先把背景遮住，再亮出来。
           不加灰度、也不碰插画（上面那层纱原地不动），帘子只是「比纱厚一档的布 + 一道竖褶」。
           挂在 .hero-scrim 的两个伪元素上，JSX 一行都不用改；fill-mode 的 both 让它停在拉开后的位置，
           .hero-section 的 overflow:hidden 负责把滑出去的布剪掉——少了它会被撑出横向滚动条。
           两块各占 51% 宽，中缝叠那 1% 是为了不露出发丝细的一条亮线。
           起点 0.1s 跟标题逐字进场的 0.15s 对齐：帘子刚开始动，字就开始浮上来。 */
        .hero-scrim::before,
        .hero-scrim::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 51%;
          background-color: var(--curtain);
          background-image: repeating-linear-gradient(
            90deg,
            rgba(128, 128, 128, 0.16) 0px,
            rgba(128, 128, 128, 0.16) 3px,
            rgba(128, 128, 128, 0) 3px,
            rgba(128, 128, 128, 0) 28px
          );
          pointer-events: none;
          animation: 1.1s cubic-bezier(0.46, 0.02, 0.24, 1) 0.1s both;
        }

        .hero-scrim::before {
          left: 0;
          animation-name: curtain-left;
          /* 前缘这道细边是「布边」：两块同色布滑过去时，好让人看出这是一片布而不是一层雾 */
          box-shadow: inset -1px 0 0 rgba(128, 128, 128, 0.38);
        }

        .hero-scrim::after {
          right: 0;
          animation-name: curtain-right;
          box-shadow: inset 1px 0 0 rgba(128, 128, 128, 0.38);
        }

        @keyframes curtain-left {
          from { transform: translateX(0); }
          to { transform: translateX(-101%); }
        }

        @keyframes curtain-right {
          from { transform: translateX(0); }
          to { transform: translateX(101%); }
        }

        /* 系统里开了「减少动态效果」：不放帘子，直接看背景；头像也不转（光标提示一并收掉，
           免得"看着能转却不动"）。滚轮转场不在这里关——那组值由 JS 侧的 useReducedMotion
           直接不下发，元素停在默认静止状态。 */
        @media (prefers-reduced-motion: reduce) {
          .hero-scrim::before,
          .hero-scrim::after {
            display: none;
          }

          /* 选择器带 :hover 是有意的：不带就会被下面那条同优先级的 .hero-avatar { cursor: pointer }
             盖掉（它写在后面）。带了 :hover 优先级更高，跟顺序无关。
             （注意这段是 JS 模板字符串，注释里别用反引号。） */
          .hero-avatar:hover {
            cursor: default;
            animation: none;
          }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          padding: 1rem;
          width: 100%;
          max-width: 920px;
          display: grid;
          justify-items: center;
        }

        .hero-copy {
          width: min(100%, 760px);
          text-align: center;
        }

        /* 「下滑到幕后」的按钮。它落在 .hero-content 里是有意的：跟着首屏一起后退、淡出，
           滑下去之后不会剩一个按钮挂在屏幕上。底色只用卡片那对变量，不开 backdrop-filter——
           外面这层带着 transform/opacity，里面再开模糊只会糊到自己这一组、糊不到身后的插画
           （侧栏那几张卡踩过同一个坑）。悬停只换边框和字色，不动位移：那档系统偏好下不需要再关一遍。 */
        .hero-scroll-cue {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 2.5rem;
          padding: 0.55rem 1.05rem;
          font: inherit;
          font-size: 0.92rem;
          letter-spacing: 0.02em;
          color: var(--text-body);
          background-color: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 999px;
          cursor: pointer;
        }

        .hero-scroll-cue svg {
          width: 14px;
          height: 14px;
        }

        .hero-scroll-cue:hover {
          color: var(--text-heading);
          border-color: var(--text-muted);
        }

        /* 首屏头像：跟侧栏 ProfileCard 是同一张 public/头像.jpg，只是放大一档（侧栏 90px）。
           原来那圈红描边删了——看着像贴上去的贴纸。改成「化进背景 + 发光」：外缘用 mask 渐隐，
           再拿 drop-shadow 往外洇两层次灰的光（不用 box-shadow，因为它在方框外发亮、还会被 mask 剪掉）。
           用中灰而不是纯白/纯黑：浅色主题下它是一圈柔和投影、深色主题下它是一圈微光，一个值两套主题都成立。
           宽高属性管 CLS，尺寸交给这里。 */
        .hero-avatar {
          display: block;
          cursor: pointer;
          margin: 0 auto 1.25rem;
          width: clamp(104px, 12vw, 132px);
          height: clamp(104px, 12vw, 132px);
          border-radius: 50%;
          object-fit: cover;
          mask-image: radial-gradient(circle at 50% 50%, #000 64%, rgba(0, 0, 0, 0.45) 86%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 64%, rgba(0, 0, 0, 0.45) 86%, transparent 100%);
          filter: drop-shadow(0 0 12px rgba(160, 160, 160, 0.55)) drop-shadow(0 0 32px rgba(160, 160, 160, 0.3));
        }

        /* 鼠标停留时转起来：跟侧栏那张 90px 头像同一个动作（@keyframes avatarSpin 声明在 index.css），
           只是周期放长到 0.6s——这边直径 104–132px 是那边的 1.2–1.5 倍，同样角速度压在大盘上边缘线速度
           更高、看着更急，所以转速相应降下来。纯 CSS 悬停，不加 state：进、出各由 :hover 管。
           遮罩和 drop-shadow 都在元素自己身上，圆形遮罩跟着转没有可见变化。 */
        .hero-avatar:hover {
          animation: avatarSpin 0.6s linear infinite;
        }

        /* 首屏标题：只留「字重 + 字号」。
           这里前后被改过两轮，方向都是「加格式」——先是粉紫渐变动画，后是 900 字重
           + 8 向黑描边 + 红色块面偏移——字本身没变好看，只是被装饰堆住了。
           字重停在 700：index.html 只请求了 400/500/700/900，写 600 会被挑到最近的 700。
           颜色不再走 --text-heading：两套主题统一用「深白」#f4f1ee（微微偏暖、不是纯白，
           压在插画上不刺眼）。白字落在浅色插画的亮块上会糊掉，所以带两层黑影把它托出来——
           一层贴身的（起描边的作用）+ 一层散开的；深色主题下影子看不见，白字本来就跟暗背景分得开。 */
        .hero-title {
          font-size: clamp(1.75rem, 5vw, 2.75rem);
          font-weight: 700;
          color: #f4f1ee;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.72), 0 0 18px rgba(0, 0, 0, 0.42);
          word-break: break-word;
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
