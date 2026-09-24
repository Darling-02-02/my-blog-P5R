# 动态文章系统设计

> 日期：2026-09-24
>
> 状态：待用户评审

## 目标

在不推翻现有 React 静态博客和专题系统的前提下，增加可独立部署在学校固定 IP Ubuntu 服务器上的动态文章系统，先完成文章列表、文章详情、草稿、发布和管理端 CRUD 的最小闭环。

## 当前代码事实

- 前端使用 React 19、TypeScript、Vite、React Router、Framer Motion、React Markdown 和 remark-gfm。
- `src/data/topics.ts` 通过 `import.meta.glob` 读取 `src/content/topics/**/*.md`，专题页面已经正常形成静态内容链路。
- `src/data/articles.ts` 已定义普通文章类型、列表排序、slug/id 查询和 Markdown frontmatter 解析，但当前仓库没有 `src/content/articles/` 文件，因此普通文章数组为空。
- `BlogSection`、`Article`、`ArchivePage`、`Header`、`ContentSection` 和 `SidebarLayout` 直接依赖 `src/data/articles.ts`。
- `.github/workflows/deploy.yml` 构建 `dist/` 并部署到 GitHub Pages；`public/CNAME` 使用 `darling-02.cn`，Vite 当前 base 为 `/`。

## 范围

### 第一阶段包含

- 后端独立 Node.js + TypeScript 服务。
- Fastify HTTP API。
- SQLite 持久化文章和标签。
- 公开文章列表与详情 API。
- 管理端文章创建、编辑、删除、保存草稿、发布、下线。
- 共享管理密钥作为第一阶段的最低限度写接口保护。
- 前端 API 客户端、加载状态和错误状态。
- `/admin` 管理页面。
- 固定 IP 服务器的 systemd + Caddy/Nginx 部署说明。

### 第一阶段不包含

- 用户注册登录。
- 多管理员和复杂权限系统。
- 评论、点赞、支付。
- 富文本编辑器。
- 图片上传服务。
- 微服务、Docker 集群、Kubernetes。
- 修改现有专题 Markdown 数据流。

## 架构

```text
浏览器
  ├── https://darling-02.cn       → GitHub Pages 静态前端
  └── https://api.darling-02.cn   → 学校固定 IP
                                      ↓
                                   Caddy/Nginx
                                      ↓
                                   Fastify :4000
                                      ↓
                                   SQLite 文件
```

开发环境：

```text
Vite :5173 → Fastify :4000 → SQLite
```

生产环境只允许反向代理暴露 80/443；Fastify 仅监听本机或内网地址，不直接暴露 4000 端口。

若学校网络的固定 IP 不是公网可达，或入站 80/443 被校园防火墙拦截，则固定 IP 方案不能直接对外提供服务，需要学校网络侧开放端口，或改用 VPN/隧道方案；这不影响本地开发和 API 代码。

## 后端模块边界

```text
backend/
  src/
    server.ts             进程入口和 Fastify 启动
    app.ts                Fastify 实例、插件和路由装配
    config.ts             环境变量读取和校验
    db.ts                 SQLite 连接和初始化
    articles/
      article.types.ts    请求、响应和领域类型
      article.schema.ts   Zod 输入校验
      article.repository.ts 数据库读写
      article.routes.ts   公开和管理路由
  migrations/
    001_init.sql          初始表结构
  data/
    .gitkeep              SQLite 数据目录占位
  package.json
  tsconfig.json
```

后端不依赖前端运行，能够在 Ubuntu 上单独执行。

## API 合同

### 公开

```text
GET /health
GET /api/articles?category=&tag=&page=&pageSize=
GET /api/articles/:slug
```

公开接口只返回 `status = published` 的文章。详情接口返回 Markdown 正文、封面、分类、标签、发布时间和更新时间。列表接口返回摘要数据，不返回正文。

### 管理

```text
GET    /api/admin/articles
POST   /api/admin/articles
PUT    /api/admin/articles/:id
DELETE /api/admin/articles/:id
POST   /api/admin/articles/:id/publish
POST   /api/admin/articles/:id/unpublish
```

管理接口要求：

```text
X-Admin-Token: <ADMIN_TOKEN>
```

管理密钥只从后端环境变量读取。前端管理页面由管理员在当前浏览器会话中输入密钥，默认只放在 `sessionStorage`，不写入生产构建和代码仓库。正式用户系统以后再替换该机制。

### 数据约定

- `slug` 全局唯一，使用小写字母、数字和连字符。
- `status` 只有 `draft` 和 `published`。
- `published_at` 仅在发布时设置，下线时清空。
- 日期使用 ISO 8601 字符串。
- 创建、更新、发布、删除失败时返回 JSON 错误，不返回堆栈。
- 所有管理输入在路由边界使用 Zod 校验。

## 数据库

### articles

```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### tags

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

### article_tags

```sql
CREATE TABLE article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

分类第一阶段保留为 `articles.category` 字段，避免为尚未需要管理的分类元数据增加表和后台页面。

## 前端边界

新增：

```text
src/lib/article-types.ts
src/lib/api.ts
src/lib/article-source.ts
src/components/AdminPage.tsx
src/components/ArticleEditor.tsx
```

改造：

```text
src/App.tsx
src/components/BlogSection.tsx
src/components/Article.tsx
src/components/ArchivePage.tsx
src/components/Header.tsx
src/components/ContentSection.tsx
src/components/SidebarLayout.tsx
```

保留不动：

```text
src/data/topics.ts
src/components/TopicPage.tsx
src/components/MarkdownBody.tsx
```

`src/lib/article-source.ts` 负责动态 API 和静态空数据/兼容模式的选择，避免把 fetch 逻辑散落到每个页面。第一轮先实现文章列表和详情读取，管理页面随后接入同一套 API 类型。

## 迁移策略

1. 保留现有 `src/data/articles.ts` 的类型和路径语义，先提取可复用的 `Article` DTO。
2. 增加后端健康检查和只读文章 API。
3. 将 `BlogSection` 和 `Article` 改为异步读取，保留现有视觉结构。
4. 验证专题路由、主题切换和静态首页不受影响。
5. 增加 `/admin`，实现草稿和发布闭环。
6. 将归档、导航搜索和站点文章统计切换到 API 数据。
7. 创建内容导入脚本时才迁移旧 Markdown；当前普通文章目录为空，不做虚假的数据迁移。

## 部署

Ubuntu 固定 IP 服务器：

- 安装 Node.js LTS。
- 将后端放在 `/srv/my-blog-api/app`。
- 将数据库放在 `/srv/my-blog-api/data/blog.db`。
- 用 `.env` 保存 `PORT`、`DATABASE_PATH`、`ADMIN_TOKEN`、`CORS_ORIGIN`。
- 用 systemd 管理 Fastify 进程。
- 用 Caddy 或 Nginx 将 `api.darling-02.cn` 反向代理到 `127.0.0.1:4000`。
- DNS 为 `api.darling-02.cn` 创建 A 记录指向固定公网 IP；如果学校提供的是校内固定 IP，需要先确认公网可达性或由网络管理员配置端口映射。
- 防火墙只开放 80 和 443，不开放 4000。
- 每日备份 SQLite 文件，先保留至少 7 个备份版本。

## 错误处理与安全

- API 统一返回 `{ error: { code, message } }`。
- 公开接口不返回草稿。
- 管理写接口必须验证 `X-Admin-Token`。
- 输入先校验再写数据库。
- SQL 使用参数绑定，禁止拼接用户输入。
- CORS 只允许生产前端域名和本地开发地址。
- 不把 `.env`、SQLite 数据库和管理密钥提交到 Git。
- Markdown 继续使用现有渲染组件；第一阶段不新增原始 HTML 或脚本执行能力。
- 共享管理密钥只是过渡性写接口保护，不等同于用户认证；必须通过 HTTPS 传输，并支持轮换，后续用户系统上线时替换。
- 公开前端通过客户端请求文章，第一阶段不保证搜索引擎预渲染和社交卡片完整性；若后续 SEO 成为重点，再评估预渲染或 SSR。
- 生产 API 必须使用 HTTPS，否则 GitHub Pages 页面调用 HTTP API 会被浏览器拦截为混合内容。

## 验证标准

每个阶段都执行最窄但完整的检查：

```bash
npm run lint
npm run validate:content
npm run build
```

后端新增：

```bash
npm run test --workspace backend
```

至少覆盖：

- 健康检查返回 200。
- 草稿创建后不能出现在公开列表。
- 发布后可以出现在公开列表和详情接口。
- 编辑后详情内容更新。
- 下线后公开详情不可读。
- 删除后管理列表中不存在。
- slug 重复、空标题和缺少正文会被拒绝。

最终手工联调：

```text
创建草稿 → 编辑 → 保存 → 发布 → 公共列表 → 公共详情 → 下线 → 公共不可见
```
