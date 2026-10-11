# Repository Guidelines

## Project Structure & Module Organization

This is a React 19, TypeScript, and Vite personal blog with a Persona 5 inspired UI. Main code lives in `src/`.

- `src/App.tsx` and `src/main.tsx` define the app shell and entry point.
- `src/components/` contains page sections, layout, article views, and theme controls.
- `src/contexts/` contains theme context utilities.
- `src/data/articles.ts` indexes article metadata and content imports.
- `src/content/articles/` stores Markdown articles by category, such as `bioinformatics/` and `machine-learning/`.
- `src/content/myself.json` holds the 「神秘力量」 blurb shown on `/myself`; `src/lib/myself-content.ts` parses/serializes it and `src/lib/myself-publisher.ts` writes it through the GitHub Contents API. The admin tab `🔮 个人简介` edits it.
- `public/` stores static assets served as-is, including images, slideshow files, and `404.html`.
- `scripts/validate-content.mjs` validates Markdown frontmatter and bodies plus the JSON content files (`src/content/categories.json`, `src/content/myself.json`).
- `dist/` is generated build output and should not be edited directly.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Vite development server.
- `npm run build` runs TypeScript project checks with `tsc -b` and creates a production build.
- `npm run preview` serves the built app locally for production verification.
- `npm run lint` runs ESLint across the repository.
- `npm run validate:content` checks article frontmatter, duplicate IDs/slugs, tags, bodies, and the JSON content files under `src/content/`. CI (`.github/workflows/deploy.yml`) runs it before `npm run build`, so broken content fails the deploy instead of blanking the site.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Name React components in `PascalCase` (`Hero.tsx`, `ThemeToggle.tsx`) and hooks/utilities in `camelCase` (`usePageBackground.ts`). Keep article category folders and Markdown slugs lowercase with hyphens where needed.

Follow the existing style: two-space indentation, single quotes in config files, and concise component organization. ESLint is configured in `eslint.config.js` with TypeScript, React Hooks, and React Refresh rules.

## Testing Guidelines

There is no full unit test framework configured. Before submitting changes, run:

```bash
npm run lint
npm run validate:content
npm run build
node --test scripts/*.test.mjs
```

`node --test scripts/*.test.mjs` runs the `node:test` checks under `scripts/` (frontmatter round-trip, markdown import, reading time, category content, repo stats, work mood, site stats, IP location, category publisher conflicts, myself content, myself publisher conflicts).

Node **22+** is required: these scripts and `validate:content` import the `.ts` sources under `src/lib/` directly (type stripping is on by default from Node 22), so on Node 20 they fail with `ERR_UNKNOWN_FILE_EXTENSION`. CI runs on Node 22 for the same reason.

For article changes, ensure every Markdown file under `src/content/articles/` has frontmatter fields: `id`, `title`, `excerpt`, `category`, `date`, `readTime` (computed from the body, never typed by hand), and `tags` as a YAML list (an empty list is allowed).

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Refactor blog content to markdown categories` and `Adjust explore page content card layout`. Keep commit subjects specific and under about 72 characters.

Pull requests should include a brief description, testing commands run, and screenshots for visible UI changes. Link related issues and call out content model, deployment, or configuration changes.

## Security & Configuration Tips

The app builds for a root-path deploy (`base: '/'`) and is published to Cloudflare Pages; `.github/workflows/deploy.yml` rebuilds and deploys on every push to `main` (operational details in `pipeline/cloudflare-pages-deployment.md`). Do not commit secrets. The admin page keeps the GitHub token for the current browser session only and publishes through the GitHub Contents API: articles, the category table, and the profile blurb. Every write sends the `sha` it read, so a concurrent edit surfaces as a conflict instead of being overwritten.
