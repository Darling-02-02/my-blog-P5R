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
          <button type="button" className="hero-scroll-cue" onClick={scrollToBlog} aria-label="下滑到幕后">
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
    </section>
  );
}
