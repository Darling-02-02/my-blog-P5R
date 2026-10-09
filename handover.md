# Handover

Last updated: 2026-09-28

> 后续变更：专栏/专题子系统（`src/content/topics/`、`/topic/...` 路由、`src/data/topics.ts`、`src/lib/topic-*.ts`、后台「🌱 专题章节」）已整体删除；下文提到它的地方都是当时的记录。
>
> 2026-10-09：四个没被挂载的组件（`SidebarLayout.tsx`、`AboutSection.tsx`、`BentoSection.tsx`、`BlogSection.tsx`）和没人引用的静态资源（`public/vite.svg`、`p5_icon.ico`、`图片_1.jpg`、`主题.png`、`主题背景.jpg`）已删除；`/explore` 的默认定位从 ipapi.co（现在会被 Cloudflare 挡）换成 ipwho.is；新增 `public/_redirects`，按路由把深链接重写到 `/`（**不要**写成 `/*` 的 catch-all，那会把 `/assets/*` 一起吞掉，首页会白屏），深链接不再先吃一次 `404.html` 的跳转。

## Current Objective

Serve the dynamic article API publicly. The school server runs Node.js 16 only, and its campus network currently blocks all inbound connections from the internet. A concrete alternative host has now been identified (see "Host Candidate" below).

## Project Status

- Frontend: React 19 + TypeScript + Vite + React Router (GitHub Pages, still in static mode).
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
