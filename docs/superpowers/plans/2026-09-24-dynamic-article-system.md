# Dynamic Article System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small Fastify + SQLite article backend and connect the existing React blog to published article list/detail and admin draft/publish CRUD without changing the static topic system.

**Architecture:** Keep the current Vite/React frontend and `src/content/topics` static topic flow. Add a standalone `backend/` service with Fastify, SQLite, Zod validation, and token-protected admin routes; expose a small frontend article context that loads published articles from the API and falls back to the current static article index when the API is disabled or unavailable.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, Fastify, better-sqlite3, Zod, Node `node:test`, tsx, Caddy/systemd templates.

**Spec:** `docs/superpowers/specs/2026-09-24-dynamic-article-system-design.md`

## Global Constraints

- Preserve the existing visual design and all `src/content/topics` routes.
- Keep the backend independently runnable on Ubuntu with SQLite persisted outside Git.
- Public API responses must exclude drafts server-side.
- Never embed `ADMIN_TOKEN` in the public frontend bundle.
- Validate all admin input at the API boundary with Zod and parameterize SQL.
- Keep production Fastify behind HTTPS reverse proxy; do not expose port 4000 directly.
- Use the existing Markdown renderer; do not add raw HTML or script execution.
- Run `npm run lint`, `npm run validate:content`, and `npm run build` before completion.

---

### Task 1: Scaffold the backend contract and failing integration tests

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/app.ts`
- Create: `backend/src/db.ts`
- Create: `backend/src/articles/article.types.ts`
- Create: `backend/test/app.test.ts`
- Modify: `package.json` only if adding root wrapper scripts is useful

**Interfaces:**
- `createDatabase(filename: string): Database`
- `migrateDatabase(db: Database): void`
- `buildApp(options: { db: Database; adminToken: string; corsOrigin: string[] }): FastifyInstance`
- `ArticleStatus = 'draft' | 'published'`
- `ArticleRecord` contains `id`, `slug`, `title`, `excerpt`, `content`, `coverUrl`, `category`, optional `subcategory`, `readTime`, `tags`, `status`, `publishedAt`, `createdAt`, and `updatedAt`.

- [ ] **Step 1: Add backend package metadata and scripts**

Create a standalone package with these scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "tsx --test test/**/*.test.ts"
  }
}
```

Use runtime dependencies `fastify`, `@fastify/cors`, `better-sqlite3`, and `zod`; use dev dependencies `@types/better-sqlite3`, `tsx`, and `typescript`.

- [ ] **Step 2: Write the failing API tests**

`backend/test/app.test.ts` must create an in-memory database and exercise Fastify through `app.inject()`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { createDatabase, migrateDatabase } from '../src/db.js';

test('health endpoint returns ok', async () => {
  const db = createDatabase(':memory:');
  migrateDatabase(db);
  const app = buildApp({ db, adminToken: 'test-token', corsOrigin: ['http://localhost:5173'] });

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
  await app.close();
  db.close();
});

test('public article list excludes drafts', async () => {
  const db = createDatabase(':memory:');
  migrateDatabase(db);
  db.prepare(`INSERT INTO articles (slug, title, excerpt, content, category, read_time, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('draft-post', 'Draft', '', '# draft', '随笔', '', 'draft', '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z');
  const app = buildApp({ db, adminToken: 'test-token', corsOrigin: ['http://localhost:5173'] });

  const response = await app.inject({ method: 'GET', url: '/api/articles' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().items, []);
  await app.close();
  db.close();
});
```

- [ ] **Step 3: Run the backend test to prove the contract fails**

Run: `npm --prefix backend test`

Expected: FAIL because `src/app.ts` and `src/db.ts` do not yet implement the contract.

- [ ] **Step 4: Commit the red test scaffold**

```bash
git add backend package.json
 git commit -m "test: define article api contract"
```

---

### Task 2: Implement SQLite schema, public API, and admin CRUD

**Files:**
- Create: `backend/migrations/001_init.sql`
- Create: `backend/src/config.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/articles/article.schema.ts`
- Create: `backend/src/articles/article.repository.ts`
- Create: `backend/src/articles/article.routes.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/src/db.ts`
- Modify: `backend/test/app.test.ts`

**Interfaces:**
- `createArticleRepository(db)` returns `listPublished`, `findPublishedBySlug`, `listAll`, `create`, `update`, `remove`, `publish`, and `unpublish`.
- `buildApp` registers `/health`, `/api/articles`, and `/api/admin/articles` routes.
- `POST /api/admin/articles`, `PUT /api/admin/articles/:id`, and publish/unpublish routes require `X-Admin-Token`.

- [ ] **Step 1: Add the migration with current frontend metadata**

Use tables `articles`, `tags`, and `article_tags`. `articles` must include `slug`, `title`, `excerpt`, `content`, `cover_url`, `category`, `subcategory`, `read_time`, `status`, `published_at`, `created_at`, and `updated_at`; `status` is constrained to `draft` or `published`.

- [ ] **Step 2: Implement database initialization and parameterized repository methods**

`createDatabase()` enables foreign keys and applies `001_init.sql`. Repository methods must bind all user values and map snake_case database rows to the API shape (`coverUrl`, `readTime`, `publishedAt`, `createdAt`, `updatedAt`, `tags`). Tag writes must upsert tag names and replace `article_tags` inside the same transaction.

- [ ] **Step 3: Implement Zod schemas and route-level validation**

Reject empty title, empty slug, empty content, invalid slug characters, invalid status, oversized fields, and non-array tags. Return `{ error: { code, message } }` without stack traces.

- [ ] **Step 4: Implement public routes**

`GET /api/articles` supports `category`, `tag`, `page`, and `pageSize`, always filters `status = 'published'`, returns summaries without `content`, and orders by `published_at DESC, id DESC`.

`GET /api/articles/:slug` returns a published article with Markdown content or `404 ARTICLE_NOT_FOUND`.

- [ ] **Step 5: Implement token-protected admin routes**

Verify the exact `X-Admin-Token` header before any admin read or write. Implement create, update, delete, publish, unpublish, and all-status list. Publishing sets `published_at`; unpublishing clears it. Duplicate slugs return `409 SLUG_EXISTS`.

- [ ] **Step 6: Extend tests for the complete backend loop**

Add tests for token rejection, draft creation, edit, publish visibility, detail reads, unpublish hiding, delete, duplicate slug rejection, and invalid input. Use the in-memory database and `app.inject()`; do not add a second test framework.

- [ ] **Step 7: Run the backend checks to prove green**

Run:

```bash
npm --prefix backend test
npm --prefix backend run build
```

Expected: all backend tests pass and `backend/dist/` compiles without TypeScript errors.

- [ ] **Step 8: Commit the backend vertical slice**

```bash
git add backend
git commit -m "feat: add sqlite article api"
```

---

### Task 3: Add the frontend article types, API client, and shared data context

**Files:**
- Create: `src/lib/article-types.ts`
- Create: `src/lib/api.ts`
- Create: `src/contexts/ArticleContext.tsx`
- Modify: `src/data/articles.ts`
- Modify: `src/App.tsx`
- Create: `.env.example`

**Interfaces:**
- `Article` remains importable from `src/data/articles.ts` for existing callers, but its shape is compatible with remote records.
- `ArticleApiClient` exposes `listPublished`, `findPublishedBySlug`, `listAdmin`, `create`, `update`, `remove`, `publish`, and `unpublish`.
- `useArticles()` returns `{ articles, status, error, refresh }`.
- `useArticle(slug)` returns `{ article, status, error }`.

- [ ] **Step 1: Write a small API mapping test**

Add a pure helper test under `src/lib/article-types.test.ts` only if the project can run it with the existing backend test runner; otherwise keep the mapping covered by backend response assertions and TypeScript compilation. The helper must prove `cover_url/read_time/published_at` map to the existing UI fields without mutating the source object.

- [ ] **Step 2: Implement remote/static source selection**

Use `VITE_ARTICLE_SOURCE=api|static` and `VITE_API_BASE_URL`. With `static`, use the current `articles` array. With `api`, fetch once through the context; if the request fails, expose the error and fall back to the current static array. An empty successful API response must remain empty and must not silently fall back to stale data.

- [ ] **Step 3: Wrap the app with `ArticleProvider`**

Keep `ThemeProvider` and `Router` behavior unchanged. The provider owns one published article list so list cards, search, archives, and counts do not fetch competing copies.

- [ ] **Step 4: Run frontend typecheck/build before page rewiring**

Run: `npm run build`

Expected: the app still builds with the provider present and no behavior changes yet.

- [ ] **Step 5: Commit the shared data layer**

```bash
git add src/lib src/contexts/ArticleContext.tsx src/data/articles.ts src/App.tsx .env.example
git commit -m "feat: add frontend article data client"
```

---

### Task 4: Wire existing public pages without changing visual structure

**Files:**
- Modify: `src/components/BlogSection.tsx`
- Modify: `src/components/Article.tsx`
- Modify: `src/components/ArchivePage.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/ContentSection.tsx`
- Modify: `src/components/SidebarLayout.tsx`

**Interfaces:**
- Components read published articles from `useArticles()` or `useArticle()` instead of module-scope static arrays.
- `TopicPage.tsx`, `src/data/topics.ts`, and `MarkdownBody.tsx` remain unchanged.

- [ ] **Step 1: Add loading, empty, and error states to `BlogSection`**

Keep the current card markup and animations. Derive `mainPosts` and `morePosts` from the context article list with `useMemo`; show a compact loading message while the API is loading and a clear empty state when no published articles exist.

- [ ] **Step 2: Switch `Article` to slug-based async detail loading**

Keep the current article body, progress bar, tags, and not-found design. Use `useArticle(params['*'])`; show the existing not-found panel for `404`, and a retryable error state for transient API failures.

- [ ] **Step 3: Switch archives and header search to the shared list**

Replace direct `articles` imports in `ArchivePage` and `Header` with the context list. Keep topic search and topic archive behavior unchanged. Recompute category/tag counts from the current published list.

- [ ] **Step 4: Switch site stats and category/tag cards to published data**

Replace module-scope `articles` reads in `ContentSection` and `SidebarLayout` with context-derived values. Do not change visitor/view placeholder behavior or the existing topic counts.

- [ ] **Step 5: Run the frontend checks**

Run:

```bash
npm run lint
npm run validate:content
npm run build
```

Expected: all pass; static topic routes continue to compile and the article pages no longer assume a synchronous non-empty array.

- [ ] **Step 6: Commit the public read integration**

```bash
git add src/components
git commit -m "feat: connect blog pages to article api"
```

---

### Task 5: Add the minimal admin page for draft and publish workflow

**Files:**
- Create: `src/components/AdminPage.tsx`
- Create: `src/components/ArticleEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/lib/api.ts`

**Interfaces:**
- Route: `/admin`.
- Admin token is read from `sessionStorage` key `blog_admin_token` and can be replaced from the page.
- `ArticleEditor` accepts `initialArticle?: ArticleRecord` and `onSaved(article): void`.

- [ ] **Step 1: Implement the editor form**

Use native inputs and textarea for title, slug, excerpt, Markdown content, cover URL, category, subcategory, read time, and comma-separated tags. Add visible labels, required attributes, validation messages, and a status selector limited to draft/published.

- [ ] **Step 2: Implement the admin list and actions**

`AdminPage` loads all articles with the token, supports create/edit, save draft, publish, unpublish, and delete. Use `window.confirm` before delete. After every mutation, refresh the list through the same API client.

- [ ] **Step 3: Add the `/admin` route**

Do not add admin navigation to the public header. The route can be opened directly by the administrator and must preserve the existing global theme/background shell.

- [ ] **Step 4: Add frontend error handling for 401/403/409**

Show actionable messages for missing token, invalid token, duplicate slug, and failed requests. Never log or render the token value.

- [ ] **Step 5: Run frontend checks**

Run:

```bash
npm run lint
npm run build
```

- [ ] **Step 6: Commit the admin workflow**

```bash
git add src/components/AdminPage.tsx src/components/ArticleEditor.tsx src/App.tsx src/lib/api.ts
git commit -m "feat: add article admin page"
```

---

### Task 6: Add Ubuntu deployment templates and operator documentation

**Files:**
- Create: `backend/.env.example`
- Create: `backend/deploy/my-blog-api.service`
- Create: `backend/deploy/Caddyfile`
- Modify: `README.md`
- Modify: `.gitignore` only if SQLite/runtime directories need explicit ignores

**Interfaces:**
- The service template starts `backend/dist/server.js` from `/srv/my-blog-api/app`.
- The Caddy template serves `api.darling-02.cn` and proxies to `127.0.0.1:4000`.

- [ ] **Step 1: Add safe environment templates**

Document `PORT`, `HOST`, `DATABASE_PATH`, `ADMIN_TOKEN`, `CORS_ORIGIN`, and `NODE_ENV` without real secrets.

- [ ] **Step 2: Add systemd and Caddy templates**

Use placeholders only for user/group and paths; keep port 4000 private. Include comments for DNS A record, 80/443 firewall rules, and the campus-network public reachability check.

- [ ] **Step 3: Update README commands**

Document local startup:

```bash
npm run dev
npm --prefix backend install
npm --prefix backend run dev
```

Document production build, systemd installation, database backup, and the `api.darling-02.cn` DNS requirement.

- [ ] **Step 4: Commit deployment documentation**

```bash
git add backend/.env.example backend/deploy README.md .gitignore
git commit -m "docs: add ubuntu api deployment guide"
```

---

### Task 7: Run the complete verification and review the final diff

**Files:**
- Verify all changed files from Tasks 1–6.

- [ ] **Step 1: Run backend tests and build**

```bash
npm --prefix backend test
npm --prefix backend run build
```

- [ ] **Step 2: Run frontend checks**

```bash
npm run lint
npm run validate:content
npm run build
```

- [ ] **Step 3: Run the end-to-end API workflow test**

Use the existing Fastify injection test to verify:

```text
create draft → edit → publish → public list → public detail → unpublish → public 404 → delete
```

- [ ] **Step 4: Inspect the final diff and status**

```bash
git diff HEAD~6..HEAD --stat
git status --short
git log -8 --oneline
```

Confirm no `.env`, SQLite database, build output, or secret token is tracked.

- [ ] **Step 5: Report verified results**

Include exact commands and exit status, changed files, the local start commands, and the remaining deployment prerequisite: campus network must allow public DNS A record traffic to ports 80/443 or an alternate tunnel/VPN path is required.
