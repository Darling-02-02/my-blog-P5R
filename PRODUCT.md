# PRODUCT.md

个人博客站。这份文件只记录**产品事实**（谁用、为什么存在、什么必须被保留），不记录视觉决策——颜色、字体、动效属于 DESIGN.md 的范围。

## What this is

一个单人维护的中文个人博客，部署为静态站点（Cloudflare Pages，域名 `darling-02.cn`），构建期把内容编译进产物。它不是 SaaS、没有账号体系、没有服务端渲染。

## Who uses it

| 角色 | 情况 | 要办的事 |
|---|---|---|
| 站主（唯一作者） | 通过 `/admin` 在浏览器里维护内容，靠 GitHub Contents API 提交 | 写文章、改栏目、改个人简介；发现 URL 打不开时要知道哪里坏了，而不是看白屏 |
| 读者 | 从搜索引擎或朋友分享进来，多数是中文读者 | 快速判断这人写了什么、值不值得收藏；读文章；看这个人是谁 |
| 朋友 / 互换友链的人 | 从友链或社交资料过来 | 找到「她是谁」和联系方式，看照片 |

## What it makes possible

站主在**不碰代码**的前提下维护一个长期存在的中文个人博客，同时保留完整的视觉控制权——不套模板主题，界面本身就是作品的一部分。

## Durable constraints

这些约束在过去的迭代里被明确确立，后续任何改动都必须保留：

1. **全站黑白灰**。原 Persona 5 彩色调色板已删除，只剩深浅两套主题。**永远不要把图片去色**去迁就这套配色——只降 UI 颜色。
2. **内容数据化**。文章、栏目表、个人简介都是数据文件 + 解析/序列化纯函数 + 构建期校验，不是写死在组件里的常量。加内容不该改代码。
3. **构建期拦住坏内容**。`npm run validate:content` 在 CI 的 `build` 之前运行；内容坏掉要让部署失败，而不是把线上刷成白屏。
4. **单条内容坏掉不能拖白整站**。解析失败一律回退默认值 + 一条 `console.error`。
5. **不引新依赖除非它能证明自己**。当前依赖只有 `framer-motion`、`react-markdown` 系列、`mermaid`、`katex`、`highlight.js`、`yaml`。动画一律用已在依赖里的 `framer-motion`。
6. **系统开了「减少动态效果」就静默降级**到静态可读状态，不是隐藏内容。
7. **不劫持滚动**。不用 scroll-snap、不接管滚轮。
8. **默认状态必须是可读的**。脚本失败不能让页面变空白——内容在没有任何 JS 动效时也看得见。

## Surfaces

| 路由 | 作用 |
|---|---|
| `/` | 首屏（个人名片）+ 幕后（最新文章卡 + 栏目 chips）/ 关于 / 友链 / 留言 |
| `/myself` | 个人简介全文（含「🏙️ OPC 同行社 · 城市代理」标题与「📮 中转站」入口） |
| `/article/*` | 文章正文 |
| `/admin` | 站主自己用的内容后台 |
| `/tag/:name`、`/category/:name` | 归档列表 |
| `/gallery` | **本轮新增**：「一些其他东西」——相册（3D 空间照片墙，初始合并成一叠、点击相册本身展开）+「一些碎碎念」 |

## Accessibility posture

- 正文与占位文本对比度 ≥4.5:1，大字 ≥3:1
- 键盘可达：交互元素可聚焦，焦点环用主题强调墨色
- `alt` 文案是内容的一部分，不是装饰

## Undecided / deliberately open

- 照片清单目前为空（占位卡代替）；真实照片由站主后续放进 `public/gallery/`
- 「一些碎碎念」（`src/content/notes.json`）当前为空，站主后续补充；Markdown 长文
- `/gallery` 暂无后台编辑页签，靠直接编辑 `src/content/photos.json` 与 `src/content/notes.json` 维护
- 友链表 `src/data/friend-links.ts` 当前 2 条（Zzzovozz、洗涤子）；加人只改这个数组，不动组件
- 首页卡片封面是**自动生成**的：`scripts/capture-article-covers.mjs` 用 headless Chrome 截文章页正文区，产出 `public/covers/<slug>.webp`；文章改过要重跑一次，否则截图是旧的。取图顺序：frontmatter `coverUrl` → 正文第一张图 → 自动截图 → 作息动图（加载态/兜底）

---

## Provenance

- 平台：**web**（依据：单页应用，无原生包装，`package.json` 为 Vite + React 19）
- 视觉世界的既有权威在代码与 `public/` 素材里（`src/index.css` 的令牌表、`CY.webp` 全局背景、`/impeccable document` 尚未运行）
- 本轮新增的 `/gallery` 页面，其方向（空间照片墙 · 鼠标视差 · 占位图先行）由站主在结构化提问中直接选定，非推断
