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

## Notes

- The app is configured with `base: /my-blog-P5R/` for GitHub Pages deployment.
- The AI companion panel currently calls a chat-completions style API directly from the browser.
- API keys entered in the Study Room are stored in `localStorage`, so a server-side proxy is recommended before using this in production.
