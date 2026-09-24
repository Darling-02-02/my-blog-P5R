# my-blog-P5R

A Persona 5 inspired personal blog built with React, TypeScript, and Vite.

## Overview

This project combines three parts into one frontend app:

- A personal homepage with animated hero banners and themed sections
- A Markdown-based blog with article detail pages, tags, and category archives
- A "Study Room" with local progress tracking, todo management, Live2D support, and an AI companion panel

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Framer Motion
- React Markdown + remark-gfm
- Giscus comments

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Content Model

Blog articles are stored locally in:

- `src/data/articles.ts`

Each article includes:

- `title`
- `excerpt`
- `category`
- `date`
- `readTime`
- `tags`
- `content`

## Project Structure

```text
src/
  components/
  contexts/
  data/
  App.tsx
  main.tsx
public/
  cover.png
  slideshow/
  live2d-frame.html
```

## Dynamic Article API

The frontend can read published articles from the standalone service under `backend/`. The existing topic Markdown flow remains static and unchanged.

### Local development

Run the frontend and API in separate terminals:

```bash
npm run dev

cd backend
npm install
# PowerShell example; use the equivalent export syntax on Ubuntu/macOS.
$env:ADMIN_TOKEN='local-development-secret-012345678901234567890123'
$env:CORS_ORIGIN='http://localhost:5173'
npm run dev
```

To enable the frontend API source, create `.env.local` from `.env.example` and set:

```text
VITE_ARTICLE_SOURCE=api
VITE_API_BASE_URL=http://localhost:4000
```

If `VITE_ARTICLE_SOURCE=static`, the frontend keeps using the existing static article index. If the API is enabled but unavailable, the public article surfaces fall back to that static index and show a visible warning.

### Backend checks

```bash
npm --prefix backend test
npm --prefix backend run build
```

### Ubuntu fixed-IP deployment

1. Copy the repository to `/srv/my-blog-api/app` and build `backend`.
2. Copy `backend/.env.example` to `backend/.env` and replace `ADMIN_TOKEN` with a random secret.
3. Keep `DATABASE_PATH` outside the Git checkout, for example `/srv/my-blog-api/data/blog.db`.
4. Create a DNS A record for `api.darling-02.cn` pointing to the server's public fixed IP.
5. Install `backend/deploy/my-blog-api.service` into `/etc/systemd/system/` and replace the placeholder `blog` user/group if needed.
6. Install Caddy and use `backend/deploy/Caddyfile` to proxy HTTPS traffic to `127.0.0.1:4000`.
7. Open only TCP 80/443 at the host and campus edge firewall; keep port 4000 private.
8. Enable the service with `sudo systemctl enable --now my-blog-api`.
9. Back up `/srv/my-blog-api/data/blog.db` daily and retain at least seven copies.

The fixed IP must be publicly reachable for direct DNS access. If it is only a campus-network address or inbound 80/443 is blocked, public DNS alone is insufficient; use school-provided port mapping, VPN, or a tunnel.
