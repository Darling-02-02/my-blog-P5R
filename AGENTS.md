# Repository Guidelines

## Project Structure & Module Organization

This is a React 19, TypeScript, and Vite personal blog with a Persona 5 inspired UI. Main code lives in `src/`.

- `src/App.tsx` and `src/main.tsx` define the app shell and entry point.
- `src/components/` contains page sections, layout, article views, theme controls, and Study Room UI.
- `src/contexts/` contains theme context utilities.
- `src/data/articles.ts` indexes article metadata and content imports.
- `src/content/articles/` stores Markdown articles by category, such as `bioinformatics/` and `machine-learning/`.
- `public/` stores static assets served as-is, including images, slideshow files, `404.html`, and `live2d-frame.html`.
- `scripts/validate-content.mjs` validates Markdown frontmatter and bodies.
- `dist/` is generated build output and should not be edited directly.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Vite development server.
- `npm run build` runs TypeScript project checks with `tsc -b` and creates a production build.
- `npm run preview` serves the built app locally for production verification.
- `npm run lint` runs ESLint across the repository.
- `npm run validate:content` checks article frontmatter, duplicate IDs/slugs, tags, and bodies.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Name React components in `PascalCase` (`Hero.tsx`, `ThemeToggle.tsx`) and hooks/utilities in `camelCase` (`usePageBackground.ts`). Keep article category folders and Markdown slugs lowercase with hyphens where needed.

Follow the existing style: two-space indentation, single quotes in config files, and concise component organization. ESLint is configured in `eslint.config.js` with TypeScript, React Hooks, and React Refresh rules.

## Testing Guidelines

There is no dedicated unit test framework configured yet. Before submitting changes, run:

```bash
npm run lint
npm run validate:content
npm run build
```

For article changes, ensure every Markdown file under `src/content/articles/` has frontmatter fields: `id`, `title`, `excerpt`, `category`, `date`, `readTime`, and a non-empty `tags` list.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Refactor blog content to markdown categories` and `Adjust explore page content card layout`. Keep commit subjects specific and under about 72 characters.

Pull requests should include a brief description, testing commands run, and screenshots for visible UI changes. Link related issues and call out content model, deployment, or configuration changes.

## Security & Configuration Tips

The app is configured for GitHub Pages with `base: /my-blog-P5R/`. Do not commit secrets. The Study Room AI companion stores user-provided API keys in `localStorage`; prefer a server-side proxy before production use.
