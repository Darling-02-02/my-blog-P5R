# Handover

Last updated: 2026-10-10

> 后续变更：专栏/专题子系统（`src/content/topics/`、`/topic/...` 路由、`src/data/topics.ts`、`src/lib/topic-*.ts`、后台「🌱 专题章节」）已整体删除；下文提到它的地方都是当时的记录。
>
> 2026-10-09：四个没被挂载的组件（`SidebarLayout.tsx`、`AboutSection.tsx`、`BentoSection.tsx`、`BlogSection.tsx`）和没人引用的静态资源（`public/vite.svg`、`p5_icon.ico`、`图片_1.jpg`、`主题.png`、`主题背景.jpg`）已删除；`/explore` 的默认定位从 ipapi.co（现在会被 Cloudflare 挡）换成 ipwho.is；新增 `public/_redirects`，按路由把深链接重写到 `/`（**不要**写成 `/*` 的 catch-all，那会把 `/assets/*` 一起吞掉，首页会白屏），深链接不再先吃一次 `404.html` 的跳转。`/about`（「关于我」）是仓库早期的占位页（`src/components/AboutMe.tsx`、`AboutMeSections.tsx`、`aboutMeContent.ts`、`useAboutMeTheme.ts`，统计数字写死 50+/20+/6+），导航里从来没有入口，已连同路由、`Header` 里的特判、没人用的 `--bg-about-box` 变量和 `_redirects` 里的那一行一起删除。

> 2026-10-10：修掉一次线上白屏 —— 后台存下来的文章在没有标签时会写出空的一行 `tags:`（`src/lib/frontmatter.ts` 的 `serializeArticle`），而解析器 `parseArticleSource` 和 `scripts/validate-content.mjs` 都拒绝这种文件（「Article tags must be a list」）；`src/data/articles.ts` 用 `import.meta.glob(..., {eager:true})` 在模块初始化时解析全部 md，一抛错整个 SPA 挂不上，表现就是「文章保存上了、页面却打不开」。现在两端都改成「允许空/缺省，仍然拦非列表」，并新增 `scripts/frontmatter.test.mjs`（3 例）钉住这条序列化/解析往返。已推送 `581d061`（3 files，+65/-5），Actions success，线上首页与文章页复验 console 0 条。**注意**：`.github/workflows/deploy.yml` 只跑 `npm run build`，不跑 `validate:content`，所以坏 md 照样会上线；要真拦得住，得把校验加进 workflow。
>
> 2026-10-10 新增 `/myself`「个人简介」独立页（`src/components/MyselfPage.tsx`，参考 `biojuse.com/myself/`），把「个人简介」和资料分享从 `/explore` 搬过去，`/explore` 第一屏直接是「幕后」；`src/components/ContentSection.tsx` 多了可选 `children` 让独立页复用同一套外壳与窄屏规则；`src/components/Header.tsx` 的「个人简介」由 `/explore#profile` 改成 `/myself`；`public/_redirects` 加 `/myself  /  200`（**依旧不用 `/*` catch-all**）。资料分享那四条是从 `git show fd8c7c1` 里捡回来的真实链接（GitHub / Papers with Code / Hugging Face / Bioinformatics Workbook），原来的「🔮 神秘力量 · 还在凝聚中，链接随后补上～」占位已删。
>
> 同一天一起落地的还有三批：① 暗色主题抬底（`src/index.css`、`src/components/GlobalBackground.tsx`、`src/components/Hero.tsx`，等用户确认亮度够不够）；② 后台「Failed to fetch」的网络层提示（`src/lib/github.ts`、`src/components/AdminPage.tsx`、`scripts/category-publisher-conflict.test.mjs` —— 那台机器的 DNS 对 `api.github.com` 有间歇污染，Chrome 会命中 `198.41.0.4` 黑洞）；③ `src/components/Footer.tsx` 的 `vpsLaunchedAt` **故意留 `null`**：按用户要求等正式部署到 VPS 那天再填 ISO 时间，现在显示「0天 0时 0分 0秒」，不再拿仓库第一次提交的日期冒充运行时长。
>
> 2026-10-10 这一轮已全部提交并上线：`0a4be03`（`/myself` 独立页）、`bd11c6e`（栏目页小卡封面改用「幕后」大卡那张作息动图，`src/components/ArchivePage.tsx` 用 `useWorkMood()` + `workMoodImage()`；大卡 `src/components/ContentSectionMain.tsx` 一个字节没动）、`da81831`（`/myself` 改成整张合并大卡，删掉失效的 `.home-profile-grid`/`.home-profile-pane`）、`2aae9ab`（暗色抬底）、`71e4e06`（Failed-to-fetch 的中文网络提示 + 回归测试）、`988a571`（页脚基准留 `null`）。改完 `src/lib/coverImage.ts`（`coverPool` + `hashKey`/`pickCoverByKey`/`pickCoverForArticle`）没有调用者了，按用户选择**先留着不删**。
>
> **工作方式（用户 2026-10-10 要求）**：每次改动都要 commit，不要攒批；视觉改动仍然先把截图给用户看再提交。
>
> 本地检查（2026-10-10，Node v22.22.3）全绿：`npx tsc -b` 0、`npm run lint` 0、`node --test scripts/*.test.mjs` 30/30、`npm run build` exit 0。`wrangler pages dev dist --port 8788` 预览验收：`/`、`/explore`、`/myself`、`/study-room`、`/admin` 全 200，`/myself` 的响应体与 `dist/index.html` SHA256 完全一致；`/assets/index-*.js` → `application/javascript`、`/assets/index-*.css` → `text/css`；未知路径 404；`POST /api/stats` 200。（验收完预览服务已关，日常只留 `npm run dev` 的 5173；注意它只绑 `::1`，要用 `http://localhost:5173`。）

## Current Objective

Serve the dynamic article API publicly. The school server runs Node.js 16 only, and its campus network currently blocks all inbound connections from the internet. A concrete alternative host has now been identified (see "Host Candidate" below).

另有前端上 VPS 的计划：页脚「已经运行了」的基准时间（`src/components/Footer.tsx` 的 `vpsLaunchedAt`）按用户要求等正式部署那天再填，现在故意留 `null`，见上方 2026-10-10 记录。

## Project Status

- Frontend: React 19 + TypeScript + Vite + React Router. 线上是 Cloudflare Pages（`my-blog-p5r.pages.dev`）：push `main` 触发 `.github/workflows/deploy.yml` → `wrangler pages deploy`；文章默认仍走 `static`（GitHub Contents API 提交）。`darling-02.cn`（香港 VPS `103.106.190.5`）是否还指向同一份产物，2026-10-10 未复验。
- Backend: Fastify 3 + SQLite + Zod REST API under `backend/`.
- Admin page: `/admin` now writes to **either** store, selected by `VITE_ARTICLE_SOURCE`:
  - `api` -> the backend API (token = `ADMIN_TOKEN`; supports `draft` / `published`).
  - anything else (default `static`) -> GitHub Contents API commit (no draft state; a commit goes live).
- Existing topic Markdown pages remain static and unchanged.

## Completed And Pushed

- Dynamic article system, frontend API/static fallback, and admin editor.
- Node 16 compatibility: Fastify `3.29.5`, `@fastify/cors` `7.0.0`, `better-sqlite3` `7.6.2`, `tsx` `3.12.1`, ES2021 target, Fastify 3 CJS type casts in `backend/src/app.ts`.
- Deployment guide: `docs/backend-deployment-quickstart.md`.
- Pushed commits: `d3b99b5` (article fixes), `d924198` (Node 16 support), `ff5d15a` (backend column + markdown code/math rendering), `5980684` (admin page can write to the backend API).
- 前端近期提交（2026-10 这一轮）：`fd8c7c1`（侧栏数据实时化；「资源分享」四条链接被换成「神秘力量」占位）、`91956c7`（WebP 迁移 + 字体非阻塞）、`79e10b3`（KV 访客计数）、`e993362`（小问题批量）、`e9667c5`（撤掉闯祸的 `/*` catch-all）、`f9c0e24`（按路由重写深链接）、`581d061`（空标签解析修复）、`0a4be03`（`/myself` 独立页）、`bd11c6e`（栏目页小卡封面同大卡）、`da81831`（`/myself` 合并大卡）、`2aae9ab`（暗色抬底）、`71e4e06`（网络提示）、`988a571`（页脚基准）。

## Local Verification (2026-09-28, frontend side only)

Verified on the local Windows machine (Node v22.22.3):

- `npm run check:admin-api` -> 11/11 assertions pass. It spawns a real backend (temporary SQLite, random port) and drives the admin data layer over real HTTP: create -> draft -> publish -> edit -> unpublish -> delete -> 401 with a wrong token.
- Regression it pins down: `articleWriteSchema` defaults `status` to `draft`, so an update that omits the current status silently unpublishes a published article. `apiSource.save` in `src/lib/article-source.ts` now always sends the current status.
- `npm run check:markdown` -> 11/11. `npm run lint`, `npx tsc -b`, `npm run validate:content` (5 topics / 11 sections), `npm run build` -> all clean.
- **Not verified**: the browser-level click-through of `/admin` in `api` mode (no browser automation on that machine), and anything on the deployed server.

## Server: Deployed And Verified (2026-09-24, not re-checked since)

Host `59.79.241.232` (`fafu-System-Product-Name`), Ubuntu 18.04.6, user `zhaoyihao`.

- Project path: `/home/zhaoyihao/project/my-blog-P5R`.
- Data path: `/home/zhaoyihao/project/my-blog-data`.
- `npm ci` used prebuilt `better-sqlite3` binaries (no `node-gyp`).
- `npm run build` succeeds with the nvm Node 16 toolchain.
- `my-blog-api.service` runs `active` and is enabled at boot:
  - `ExecStart=/home/zhaoyihao/.nvm/versions/node/v16.20.2/bin/node /home/zhaoyihao/project/my-blog-P5R/backend/dist/server.js`
- Verified over loopback:
  - `GET /health` -> 200 `{"status":"ok"}`
  - `GET /api/articles` -> 200 `{"items":[],"page":1,"pageSize":20,"total":0}`
  - `GET /api/articles/<unknown>` -> 404
  - `GET /api/admin/articles` without token -> 401
  - `GET /api/admin/articles` with token -> 200
  - SQLite `blog.db` created and persisting in the data directory.
- Non-interactive SSH does **not** load nvm, so plain `node` is the system v8.10.0. Always use the absolute Node 16 path.
- This record could not be re-verified on 2026-09-28: the local deploy key is still not installed on the server, so non-interactive SSH from the local machine fails with `Permission denied (publickey,password,keyboard-interactive)`.

## Blocking Issue: Campus Inbound Filtering

DNS is correct (`api.darling-02.cn` -> `59.79.241.232`, and that IP is bound directly to `enp37s0f1`, not NAT). The host has no firewall enabled (UFW inactive, iptables INPUT policy ACCEPT). Caddy listened on 80/443 correctly.

Nevertheless every inbound attempt from outside the campus failed:

- Let's Encrypt production: `tls-alpn-01` and `http-01` both `Connection refused`.
- Let's Encrypt staging: same result.
- External probes (US, Netherlands, Romania, Turkey, Iran): ports 80/443/8080/8443/4000 all refused or timed out.
- Mobile-data test from the user (China, WiFi off): page did not open.
- `59.79.241.232` is AS4538 (China Education and Research Network, Shanghai) per ipinfo.io — consistent with an edge that filters inbound.

Conclusion: the campus edge rejects inbound connections, so no public listener can work and no ACME certificate can be issued. Caddy was stopped and disabled; its files remain under `/home/zhaoyihao/project/my-blog-data/` (binary, `Caddyfile`, `caddy.service` copy).

## Host Candidate: the Hong Kong VPS that already serves the site

- `darling-02.cn` and `www.darling-02.cn` resolve to `103.106.190.5` (Hong Kong, ASN 401696, I Layer Limited / cognetcloud). It is already serving the site over the public internet, so it has working inbound — this gives option 3 below a concrete target.
- `api.darling-02.cn` returned **no A record** in the 2026-09-28 lookup (the 2026-09-24 record had it pointing at the school server), so that name must be re-created before it can serve the API.
- Whether that VPS can be logged into is **unconfirmed** (the user is not sure who manages it).

## Remaining Options

1. Ask the campus network administrator to allow inbound TCP 80/443 to `59.79.241.232` (keeps the current architecture; Caddy is ready).
2. Run an outbound-only tunnel. Cloudflare Tunnel would require moving the domain's NS from the 宝塔 DNS panel to Cloudflare, which also means recreating the GitHub Pages records.
3. Host the API on the Hong Kong VPS (`103.106.190.5`) that already serves `darling-02.cn`. The code is portable; only `DATABASE_PATH`, `CORS_ORIGIN`, and DNS change. `backend/src/config.ts` defaults `HOST` to `127.0.0.1`, so the service stays behind a reverse proxy and port 4000 is never exposed directly.
   - Gap to plan for: the backend has **no rate limiting** (dependencies are only `fastify`, `@fastify/cors`, `zod`, `better-sqlite3`, `dotenv`). A public write endpoint protected by one static token deserves a proxy/WAF in front.

## Interim Local Workflow (works today)

The API is already running on the server, so the admin flow can be used now without public access:

```bash
# on the local Windows machine, tunnel the API port
ssh -L 4000:127.0.0.1:4000 zhaoyihao@59.79.241.232
```

Then run the frontend locally:

```powershell
$env:VITE_ARTICLE_SOURCE='api'; $env:VITE_API_BASE_URL='http://localhost:4000'; npm run dev
```

Open `/admin` and paste the server's `ADMIN_TOKEN`. Because the admin page now writes to whichever store `VITE_ARTICLE_SOURCE` selects, this tunnel is enough to create, draft, publish and unpublish real articles end to end. With the default (`static`), the deployed GitHub Pages site keeps committing to GitHub instead, so production behaviour is unchanged.

## Dependency Divergence (uncommitted)

- `backend/package.json` and `backend/package-lock.json` are modified in the working copy but not committed: `better-sqlite3 7.6.2 -> 13.0.3`, `@types/node ^16.18.126 -> 22.20.4`.
- The deployed Node 16 server still runs the committed versions; the working copy targets Node 22. Anyone deploying must know which pair they are building.

## Security Notes

- The server password was shared in plain text during this session; rotate it.
- A dedicated local deploy key exists at `%USERPROFILE%\.ssh\myblog_deploy.pub`; install the public key on the server to avoid password use. Still not installed as of 2026-09-28, which is why non-interactive SSH fails.
- Never commit `.env`, `ADMIN_TOKEN`, SQLite files, `dist/`, or the helper script under the system temp directory.
- `README.md`'s `ADMIN_TOKEN` example is a literal placeholder (`local-development-secret-...`), not a credential — checked 2026-09-28.
- This file is now tracked in a **public** repository and names the server host, IP, Linux user, and paths. Accept that disclosure or move the server details elsewhere.
- The school server currently has no public listener, so the disclosed IP is not reachable from the internet.

## Unrelated Untracked Files

- `.codegraph/`
- `public/p5_icon.ico`
