import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { photos } from '../data/photos';
import { notes } from '../data/notes';
import MarkdownBody from './MarkdownBody';
import Header from './Header';
import Footer from './Footer';

// 视差深度（px）按卡片轮转分配：靠前的照片动得多、靠后的动得少，整片才有纵深。
// 指针位移本来就很小，这里放大到可感知的程度，但单张最多 ~20px —— 再多就像在抖。
const DEPTHS = [20, 13, 17, 10, 15, 12];

// 交错倾斜同样轮转：给定值、不用随机数，否则每次渲染排布都会变。
const TILTS = ['-1.4deg', '1.1deg', '-0.7deg', '1.6deg', '-1.1deg', '0.8deg'];

const MAX_PHOTOS = 36;

// 一叠照片至少要有两张才叠得出效果；只有一张时收起态和展开态一模一样，
// 那颗展开按钮就成了按了没反应的假控件。少于两张直接显示为展开态。
const MIN_TO_STACK = 2;

// 窄屏不进入收起态：那里本来就是单列，卡片已经纵向排开，
// 再叠起来只是把五张盖住、还看不出是"一叠"。断点与 index.css 里那条
// @media (max-width: 640px) 是同一个值，改一个必须改另一个。
const STACK_BREAKPOINT = '(max-width: 640px)';

const PlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="M21 16l-5-5-9 8" />
  </svg>
);

const GalleryPage = () => {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  // 指针只在真实产生过 pointermove（鼠标/触控笔）之后才能驱动视差 ——
  // 触屏没有 hover，用 pointer: coarse 猜会误伤可折叠屏。
  const [hasPointer, setHasPointer] = useState(false);
  // 相册初始是合并的一叠，点一下扇开成照片墙，再点一下收回去。
  const [spread, setSpread] = useState(false);
  // 窄屏不该有收起态。用 matchMedia 订阅而不是读一次 innerWidth：
  // 旋转屏幕/拖动窗口跨过断点时，收起态要跟着失效，否则会卡在"点不开的一摞"。
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(STACK_BREAKPOINT).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(STACK_BREAKPOINT);
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onPointerMove = (event: PointerEvent) => {
      // 只有真实鼠标/触控笔才驱动视差。第一条 pointermove 就把这层打开，
      // 但不能把它写进依赖数组：那样第一次移动会让 effect 立刻重跑，
      // 上一次的监听被移除、新的又被 hasPointer 挡住 —— 视差会永远卡在第一帧。
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      setHasPointer(true);

      const rect = stage.getBoundingClientRect();
      // -1..1，以舞台中心为原点。
      const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      stage.style.setProperty('--gallery-px', px.toFixed(3));
      stage.style.setProperty('--gallery-py', py.toFixed(3));
    };

    // 指针离开窗口时回正：否则视角停在最后一帧，看起来像卡住了。
    const onPointerLeave = () => {
      stage.style.setProperty('--gallery-px', '0');
      stage.style.setProperty('--gallery-py', '0');
    };

    window.addEventListener('pointermove', onPointerMove);
    // pointerleave 不冒泡，所以不能挂在 window 上等它冒上来；document 能收到光标离开视口的那次。
    document.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reduceMotion]);

  // 视差必须由真实指针驱动；没有指针（触屏 / reduce-motion）就完全不挂这层。
  const parallax = hasPointer && !reduceMotion;

  const visiblePhotos = useMemo(() => photos.slice(0, MAX_PHOTOS), []);
  const overflow = photos.length - visiblePhotos.length;
  // 无照片时渲染等量的占位卡，好让排布与视差现在就能看、换图时不用动布局。
  const slots = useMemo(() => (visiblePhotos.length > 0 ? visiblePhotos : Array.from({ length: 6 }, () => null)), [visiblePhotos]);

  // 少于两张、或窄屏时都不进入收起态。窄屏的判断放在这里（而不是只在 CSS 里把 transform 抹掉），
  // 是因为叠放现在靠 grid-area 让所有卡占同一格 —— 只抹 transform 的话卡会无声地摞在一起：
  // 六张里五张被完全盖住，既点不开也看不出是一叠。要么整套叠放都生效，要么整套都不生效。
  const canStack = slots.length >= MIN_TO_STACK && !narrow;
  const stacked = canStack && !spread;

  // 收起态下那一摞不参与视差（没有纵深可推）；展开后照旧。
  const stageLive = parallax && !stacked;

  // 卡片渲染两份状态共用。inStack 决定 --stack 发不发（叠放角度）、以及卡片是否可 Tab。
  // --stack 只在收起态下发：展开态没有 var(--stack)，叠放那条 transform 整条失效，
  // 卡片回落到照片墙排布。叠放的排版靠 grid-area 让所有卡占同一格，
  // 只要 --stack 缺席就一定回到展开的网格，不会出现占着同一格却没角度的一摞。
  const renderCards = (inStack: boolean) =>
    slots.map((photo, index) => {
      const depth = DEPTHS[index % DEPTHS.length];
      const tilt = TILTS[index % TILTS.length];
      const meta = [photo?.date, photo?.caption].filter(Boolean).join(' · ');
      const stackVars = inStack ? { ['--stack' as string]: index } : null;

      return (
        <figure
          key={photo?.src ?? `placeholder-${index}`}
          className="gallery-card"
          style={{ ['--depth' as string]: depth, ['--tilt' as string]: tilt, ...stackVars }}
          // 收起态整摞是按钮，卡片本身不该再进 Tab 序列；展开态每张都能单独聚焦。
          tabIndex={inStack ? -1 : 0}
          aria-label={photo ? `${photo.title}${meta ? `，${meta}` : ''}` : '待放入的照片'}
        >
          <div className="gallery-card-inner">
            <div className="gallery-frame">
              {photo ? (
                <img src={photo.src} alt={photo.title} loading="lazy" decoding="async" />
              ) : (
                <div className="gallery-placeholder" style={{ background: 'var(--placeholder-fill)' }}>
                  <PlaceholderIcon />
                </div>
              )}
              <figcaption className="gallery-meta">
                <strong>{photo ? photo.title : '待放入的照片'}</strong>
                {meta && <span>{meta}</span>}
              </figcaption>
            </div>
          </div>
        </figure>
      );
    });

  return (
    <>
      <Header />
      <section className="gallery-shell">
        <div className="gallery-inner">
          <header className="gallery-head">
            <h1 className="gallery-title">一些其他东西</h1>
            <p className="gallery-lede">
              拍摄的照片。散在桌上，移动光标的时候它们会跟着偏一点。
            </p>
          </header>

          <h2 className="gallery-subhead">📷 相册</h2>

          {/* id 挂在这里而不是 .gallery-plane 上：aria-controls 要指向一个真实存在的元素，
              而收起态与展开态渲染的是同一个节点（两种状态下它都在），指向它两种状态下都成立。 */}
          <div
            id="gallery-stack"
            className={`gallery-stage${stageLive ? ' gallery-stage-live' : ''}${stacked ? ' gallery-stage-stacked' : ''}`}
            ref={stageRef}
          >
            {stacked ? (
              // 收起态：整摞就是一个按钮 —— 用户点的就是相册本身，不需要额外那颗文字按钮。
              // 仍然用真 <button> 而不是给容器挂 onClick：键盘可达、有 aria-expanded 状态、
              // 也自带 Enter/Space。给 div 挂 onClick 会重演 ContentSectionMain 里
              // 那个键盘够不到的卡片，而且这摞卡在收起态下本来就不该各自可聚焦。
              <button
                type="button"
                className="gallery-plane gallery-plane-stack"
                aria-expanded={false}
                aria-controls="gallery-stack"
                aria-label={`展开相册，共 ${slots.length} 张照片`}
                onClick={() => setSpread(true)}
              >
                {renderCards(true)}
              </button>
            ) : (
              <>
                <div className="gallery-plane">{renderCards(false)}</div>
                {/* 展开态只剩"收回去"这一个动作，所以是一颗小按钮而不是原来的那颗主按钮。
                    没有它就没法回到收起态 —— 收起态那摞本身就承担了"展开"的入口。 */}
                {canStack && (
                  <button type="button" className="gallery-collapse" onClick={() => setSpread(false)}>
                    收起相册
                  </button>
                )}
              </>
            )}
          </div>

          <div className="gallery-note">
            {visiblePhotos.length === 0 && <p style={{ margin: '0 0 0.6rem' }}>还没有照片。</p>}
            <p style={{ margin: 0 }}>
              加照片：把图片放进 <code>public/gallery/</code>，再到 <code>src/content/photos.json</code> 里登记一项{' '}
              <code>{'{ "src": "/gallery/文件名.jpg", "title": "标题", "date": "2026-10-17" }'}</code>。建议 3:2 横向、长边不超过 1600px。
            </p>
            {overflow > 0 && <p style={{ margin: '0.6rem 0 0' }}>当前只显示前 {visiblePhotos.length} 张，还有 {overflow} 张未显示。</p>}
          </div>

          <h2 className="gallery-subhead">✍️ 一些碎碎念</h2>

          {/* 空内容时不渲染 MarkdownBody：那会留下一个撑高度的空 div，
              而且 MarkdownBody 挂的是文章正文的排版作用域，空着没意义。 */}
          {notes.trim() ? (
            <MarkdownBody content={notes} />
          ) : (
            <p className="gallery-note" style={{ marginTop: 0 }}>还没有写。</p>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default GalleryPage;
