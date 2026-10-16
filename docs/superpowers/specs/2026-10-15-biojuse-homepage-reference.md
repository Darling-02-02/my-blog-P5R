# biojuse.com 首页逆向参考（一手证据 + 可借鉴机制）

- 目的：用户要求用 REA 逆向 `https://biojuse.com/`（Hexo + Butterfly 个人博客），**只借鉴机制，不抄外观**；本文件是这次逆向的落点，也是后续"要不要借、借什么"的决策依据。
- 约束：本仓库保持自己的黑/白单色体系，**不引入紫色、不引入毛玻璃、不换主题框架**（用户既定：≤2 个有彩色的 UI 元素）。
- 日期：2026-10-15（按 REA 采集时间 `2026-10-15T02:38:21Z`）。

## 1. 结论先行

biojuse 首页和我们首页的**结构目标几乎一样**（一张全屏固定背景图 + 内容块浮在上面），差别只在两处，而且这两处正是"看着更整"的来源：

1. **背景图完全不透明度**，且**亮/暗两张不同的图**（亮 `pic/1121393.png`、暗 `pic/sygx.png`），不是同一张图做滤镜。
2. **内容卡片几乎不透明**（`rgba(255,255,255,.9)` / 暗色 `rgba(0,0,0,.8)`），把背景压在下面当"纹样"，正文对比度不靠模糊或遮挡来救。

我们现在的做法是**一张图 + 半透明纱**（`--page-veil` / `--content-veil`）。要"更像它"，最直接的杠杆是**改纱的浓度和分布**，而不是再描边、再加装饰。

## 2. 证据怎么取的

REA（`npx -y rea-agents@latest`，npm 包 `rea-agents` 6.5.0，非 biojuse 源码）**只附加用户自己的 Chrome**，不启动、不终止浏览器：

```powershell
# 已存在的无头 Chrome（CDP 9333）；biojuse 的 target_id 会随标签变化，先 list
npx -y rea-agents@latest list-browser-targets http://127.0.0.1:9333 --format json
npx -y rea-agents@latest inspect-web-page http://127.0.0.1:9333 <targetId> --include-script-sources --format json
npx -y rea-agents@latest capture-web-screenshot http://127.0.0.1:9333 <targetId> --format json
npx -y rea-agents@latest analyze-web-bundle http://127.0.0.1:9333 <targetId> --observation-ms 8000 --format json
npx -y rea-agents@latest export-web-scripts $env:TEMP/biojuse/rea/capture.json $env:TEMP/biojuse/rea/saved --format json
npx -y rea-agents@latest analyze-javascript-application $env:TEMP/biojuse/rea/saved/files --format json
```

产物（都不进仓：REA 那几份挪到 `$env:TEMP/biojuse/rea/`——导出目录里有 180 个第三方 `.js`，留在仓内会把 `npm run lint` 扫出 warning；自写探针留在已 gitignore 的 `.shots/`。要复现就重跑上面这几条命令）：

| 产物 | 尺寸 | 内容 |
| --- | --- | --- |
| `$env:TEMP/biojuse/rea/capture.json` | 491,669 B | `normalized_result`：browser / target / capture_window / completeness / frames / dom / accessibility / scripts / resources / network / console / workers / metadata / storage / limitations |
| `$env:TEMP/biojuse/rea/screenshot.json` | 796,756 B | 可见视口 PNG（`artifact.data_base64`） |
| `$env:TEMP/biojuse/rea/export.json` | 6,661 B | 18 个脚本落盘 + `manifest.json`（114,001 B 合计，逐文件 sha256 复核） |
| `$env:TEMP/biojuse/rea/js-app.json` | 11,487,423 B | `confidence: "derived"`；对**已导出脚本**做静态分析 |
| `$env:TEMP/biojuse/rea/web-bundle.json` | 10,562 B | 活体 bundle 分析（`analyze-web-bundle`，窗口 8 s） |

补充探针（自写，只读计算样式，不进仓）：

- `.shots/cdp-nav.mjs <endpoint> <targetId> <url> [probeFile]`：导航 + 在页面里 eval 探针文件；探针**必须走文件**，因为 PowerShell 传参会吞掉双引号（曾把 `#web_bg` 当 JS 执行 → `SyntaxError: Private field '#web_bg' must be declared in an enclosing class`）。
- `.shots/probe-biojuse.js`：只读 `getComputedStyle` + 资源清单。
- `.shots/json-shape.mjs <file> [depth]`：打印 JSON 形状；REA 证据动辄几百 MB / 11 MB，**永远先看形状再看字段**。

两条踩过的坑（会重复踩，记这里）：

- PowerShell 的 `1> file` 把 JSON 写成 **UTF-16**（BOM `FF FE`），`JSON.parse` 报 `Unexpected token '�', "��{"`；修法：`$out = npx … | Out-String` 再 `[IO.File]::WriteAllText($p, $out, [Text.UTF8Encoding]::new($false))`。
- 不要对 REA 的 `capture.json` 直接 `ConvertFrom-Json`（5.1 会抛 ArgumentException，并把整份 JSON 喷到 stderr）；用 `node` 读 + 只打印要看的字段。

## 3. 首页实测（light 主题，探针读数）

- `#web_bg`：`background-image: url("https://biojuse.com/pic/1121393.png")`、`background-attachment: local`、`position: fixed`、`z-index: -999`、`background-size: cover`、`background-position: 50% 50%`、`filter: none`、`opacity: 1` —— **图是全不透明铺满，没有纱**。
- `#page-header.full_page`：`background-image: none`、`background-color: rgba(0,0,0,0)`、高 485px（控制台里那张内联背景是 Hexo 输出的，运行时被覆盖成透明）。
- `#aside-content .card-widget`、`#recent-posts .recent-post-item`：`rgba(255,255,255,0.9)`、`border-radius: 8px`、`backdrop-filter: none`。
- `#footer`：`rgba(0,0,0,0.8)`，正文色 `rgb(76,73,72)`。
- `#ft`：自定义页脚，`display: flex`。
- `.text-module`（首页引语框）在本次快照里**不存在**（可能只挂在 `hp.css` 命中页面上）。
- 首屏有 preloader（REA 记录到 `.configure-border-2` / `.configure-core` / `.loading-word`）。
- 样式表：`/css/index.css`（Butterfly，151,984 B）、`/css/mycss.css`（5,077 B）、`/css/bg.css`（4,266 B）、`/css/hp.css`（689 B）。
- 脚本：`/js/utils.js`、`/js/main.js`、`/js/tw_cn.js`、`/js/search/local-search.js`、`/js/rightmenu.js`、`/js/txmap.js`、`/js/copy12.js`、`/js/ldex.js`、`/js/runtime.js` + busuanzi CDN。
- 背景/图片资产体积：`/pic/gitav.png` 72,207 B（头像）、`/pic/1121393.png`（亮背景）、`/pic/sygx.png`（暗背景）、`/pic/cover4.jpg` 128,171、`/pic/cover6.jpg` 128,033、`/pic/1114180.jpg` 604,848；文章封面 `/pic2/*.png` 里有多张 **1.0–1.7 MB** 的（`GPT16_05_44` 1,665,997 / `ChatGPT0915` 1,504,284 等）。

> 顺带结论（反面教材）：它首页为每篇文章加载的封面是**未经压缩的大 PNG**，单张就顶我们整页。**不要学这个**。

## 4. 机制清单（按出处）

### 4.1 背景与卡片（来源：`/css/bg.css`，4266 B）

- `#web_bg`：`position: fixed; inset: 0; z-index: -999; background: url(/pic/sygx.png) center/cover no-repeat; background-attachment: local;`，且这一块写在 `[data-theme="dark"]` 下 —— 亮/暗两套图，`hp.css` 同款手法。
- `.content-inner > #post`：`rgba(255,255,255,1)`；`[data-theme="dark"]` → `rgba(0,0,0,1)`（**正文卡片完全不透明**）。
- `#recent-posts .recent-post-item`、`#aside-content .card-widget`：`rgba(255,255,255,.9)`；暗色 `rgba(0,0,0,.8)`。
- `#footer`：`rgba(0,0,0,.8)`。
- `#page-header { background: transparent !important }`；暗色下 `#page-header::before { background-color: rgba(0,0,0,0.4) !important }`。
- 自定义页脚 `#ft`：`max-width: 1200px`、flex + wrap、文字 `rgb(255 255 255 / 80%)`；`.ft-item-1 { flex: 2 }`、`.ft-item-2 { flex: 1 }`、`.t-top .t-t-l { flex: 1.4 }`；按钮 `.btn-xz { background-color: var(--btn-bg); color: var(--btn-color); border-radius: 10px; line-height: 2.4 }`，容器 hover `background-color: #6f42c1`（紫，不借）；`.ft-links li a { width: 50% }` hover `color: #49b1f5`（蓝，不借）；图片组 `.ft-item-2 .ft-img-group .img-group-item { width: 18.4% }`，img `border-radius: 10px; max-height: 80px`；断点 768 / 576。
- `.juse-img` / `.juseimg { transform: scale(1.3); transition: transform .5s }`，`:hover { scale(1.5) }`。

### 4.2 首页引语框（来源：`/css/hp.css`，689 B；线上 689 B）

`.text-module` 固定 `300×100`、圆角 15px、`rgba(240,240,240,0.8)` 居中文字框、`overflow: hidden`；`.fade-out` = `opacity: 0; transform: scale(0.95) translateY(-10px); filter: blur(5px)`，`.fade-in` 是其反相，`transition: opacity 1s, transform 1s`，框线 `2px solid #888888`。即：**同一位置叠几个文案，淡出淡入轮播**。用户早期已因为"多余"删掉过我们的下滑提示，这类轮播要看用户意愿。

### 4.3 自定义脚本文案与行为（一手，来自 REA 导出的脚本）

| 文件 | 体积 | 行为 |
| --- | --- | --- |
| `js/ldex.js` | 1,657 B | `setThemeBasedOnTime()`：没存过主题时，7:00–19:00 自动亮色，否则暗色，并用 `confirm()` 问"要切回白天模式吗"；`recordThemeChoice()` 在切换按钮点击时把偏好写进 `localStorage.userTheme`。控制端点在 `#darkmode`。 |
| `js/copy12.js` | 848 B | `copy` 事件弹通知"复制成功，Juse watching u…"+"本站采用 CC 协议，若要转载请提一嘴原文链接哦"；`F12` keydown 弹警告"哎哎哎让我看看你在干啥"。 |
| `js/rightmenu.js` | 10,370 B | `setMask()`：插一个 `position: fixed`、`background: #fff`、`opacity: 0` 的遮罩层做自定义右键菜单；配套内联脚本用 `localStorage.mouse` 在 `on/off` 间切"右键模式"，并弹通知提示。 |
| `js/txmap.js` | 9,446 B | `getDistance()` + `showWelcome()`：把访客位置/距离写进 `#welcome-info`（欢迎来自 XX 的朋友，距我 XX km）。 |
| `js/runtime.js` | 1,717 B | `setInterval` 把运行时长写进 `#workboard`（站点运行计时）。 |
| `js/utils.js` | 7,695 B | Butterfly 的 `btf` 工具集：`debounce` / `throttle` / `diffDate` / `loadComment`（IntersectionObserver 懒加载评论）/ `scrollToDest` / `animateIn` / `animateOut` / `wrap` / `unwrap` / `getEleTop` / `loadLightbox` / `initJustifiedGallery` / `updateAnchor`。 |
| `js/main.js` | 26,102 B | Butterfly 主体：`scrollDownInIndex()`（点 `#scroll-down` → `btf.scrollToDest(content-inner.offsetTop, 300)`）、`scrollDirection(currentTop)`、滚动监听控制 `#page-header`、TOC 阅读进度。 |

## 5. 和我们现状的对照

| 维度 | biojuse | 我们（当前） |
| --- | --- | --- |
| 背景图 | 亮/暗**两张**独立图，完全不透明，`z-index:-999` fixed | 一张 `public/CY.webp`，暗色 `brightness(0.55)`，上面还有 `--page-veil` / `--content-veil` 纱 |
| 内容卡片 | 近不透明（.9 / .8），无 `backdrop-filter` | 半透明 + 内容区 `blur(5px)` |
| Header | 透明 + 暗色下 `::before` 0.4 黑 | 透明 + 滚动后虚线底边 |
| 脚注 | `rgba(0,0,0,.8)` 实底 | 随主题的卡片色 |
| 主题策略 | 按本地时间自动亮/暗 + `confirm` 询问 | 纯手动（`blog_theme_v2`） |
| 首页动效 | preloader + 引语框淡入淡出轮播 | 标题逐字浮现（已有，用户认可） |
| 装饰 | 自绘页脚 / 右键菜单 / 复制与 F12 提示 / 访客距离 | 无（用户已删过"多余"装饰） |

## 6. 可借鉴候选（待用户挑，不能替他做审美决定）

**背景层次（三选一，互斥，体量从小到大）**

- A. **只提纱的对比**：首页纱再深一点、内容块纱再浅一点，让"背景纹样 vs 正文底"拉开一档；不动图、不动卡片不透明度。
- B. **背景不透明 + 卡片近不透明**：撤掉首页纱，靠卡片自身的 0.9/0.8 兜对比度 —— 最接近 biojuse，但会改我们"透出背景"的观感（用户此前明确否过纯色卡片）。
- C. **亮/暗两张背景图**：保留一张图 + 滤镜的现状，但为暗色单独准备一张低对比版本，替代 `brightness(0.55)`。

**其他**

- D. 主题按本地时间自动切换（`ldex.js` 思路），保留手动覆盖；把 `ldex.js` 的 `confirm()` 换成我们自己的浮层/静默，不打断。
- E. 访问者问候（`txmap.js` 思路）：需第三方 IP 定位接口 —— 引入外部依赖，**默认不做**，要做得先问。
- F. 复制正文时的版权提示（`copy12.js` 思路）：纯前端，无依赖，1 个小监听即可。

**明确不借**：紫色/蓝色强调色（违反单色体系）、`backdrop-filter` 毛玻璃（视觉重且用户没要）、右键菜单与 F12 拦截（用户已表态删多余装饰）、自动播放的引语轮播、大 PNG 封面（性能反例）。

## 7. 残留不确定性

- `.text-module` 只在 `hp.css` 里定义但本次没进 DOM，无法确认它挂在哪个页面、几张文案、切换间隔。
- Butterfly 的 `index.css` 151,984 B 只做了派生分析（chunk/路由/端点/指纹），**没有逐行读**；如果要精确抄某个组件行为，需要针对该组件再取一次样式。
- 截图证据我本人看不到（当前模型不吃图）；`screenshot.json` 里的 PNG 交换门需要用户自己看或换能读图的模型。
