# 内容链路现状（专栏 / 文章 / 后端）

> 适用仓库：`Darling-02-02/my-blog-P5R`
>
> 上游站点：`darling-02.cn`（`public/CNAME`，整站挂在域名根目录，`vite base = '/'`）
>
> 更新日期：2026-09-28
>
> 目的：说清"内容到底怎么写、写完怎么上线、后端在哪一环"，避免重复排查。

> **后续变更**：整个专栏 `topics` 子系统（`src/content/topics/`、`/topic/...` 路由、`src/data/topics.ts`、`src/lib/topic-*.ts`、后台「🌱 专题章节」面板）已删除，现在只剩文章 `articles` 一条内容线。
> 下文是删除前的快照，仅作历史记录；第 1、2、7、8 节里关于专栏的部分已经不成立。

## 0. 一句话结论

**现在的实现是「本地写 Markdown → git push → GitHub Actions 构建 → 静态站」。
专栏（`topics`）是唯一真正跑通的书写方式，且只能手写文件；
后端 Fastify 已部署但不在内容链路上，`/admin` 只能管扁平文章。**
本文件的结论对应提交 `ff5d15a`。

## 1. 三条线总览

| 线 | 内容位置 | 写入方式 | 读取方式 | 状态 |
| --- | --- | --- | --- | --- |
| 专栏 `topics` | `src/content/topics/<分类>/<专栏>/topic.md` + `sections/*.md` | 手写文件 + git push | `src/data/topics.ts` 的 `import.meta.glob`（构建期打进包） | ✅ 在用 |
| 文章 `articles` | `src/content/articles/<分类>/<slug>.md` | `/admin` 页面 → GitHub Contents API | `src/data/articles.ts` 构建期读取；或 `VITE_ARTICLE_SOURCE=api` 走后端 | ⚠️ 通路在，内容为 0 |
| 后端 API | 服务器 SQLite `blog.db` | `/admin`（仅当 `VITE_ARTICLE_SOURCE=api`） | `src/lib/api.ts` | ⚠️ 部署了但公网不可达 |

## 2. 专栏 `topics`（唯一跑通的书写方式）

目录约定：

```text
src/content/topics/<分类目录>/<专栏目录>/topic.md       专栏头（title / summary / order / tags）
src/content/topics/<分类目录>/<专栏目录>/sections/<小节>.md   小节正文
```

- 分类白名单写在 `scripts/validate-content.mjs` 的 `topicDirs`，中文名映射写在 `src/data/categories.ts` 与 `src/data/topics.ts`（当前：`machine-learning` 机器学习、`essays` 随笔、`backend` 后端）。
- 路由：`/topic/:category/:topic` 与 `/topic/:category/:topic/:section`。
- 校验：`npm run validate:content` 检查 frontmatter、重复 id/slug、tags 与正文非空。
- 小节写作约定（暂未强制）：`前置条件 / 步骤 / 验证 / 踩坑`，见 `src/content/topics/backend/backend-notes/sections/how-to-add-a-section.md`。
- **没有任何 UI、后端或 API 参与**：改文件 → 提交 → 推送即可。

## 3. 文章 `articles`（半成品）

目标位置是 `src/content/articles/<分类>/<slug>.md`，但**该目录当前不存在（0 个文件）**。两条通路并存且都不完整：

1. **`/admin` → GitHub Contents API（可用）**
   `src/components/AdminPage.tsx` 只调用 `src/lib/github.ts` 的 `articlePublisher`，在浏览器里用 fine-grained token 直接 commit 到 `src/content/articles/...`，触发 Actions 重建。它按库存放，分类即目录名。**但它管不了 `topics`。**
2. **前端 → 后端 API（默认关闭）**
   `src/lib/api.ts` 读 `VITE_ARTICLE_SOURCE`（缺省 `static`）与 `VITE_API_BASE_URL`；`ArticleContext` / `useArticles` 在 api 模式下请求后端，失败则回落到静态数组。仓库里只有 `.env.example`，线上没有启用。

## 4. 后端 Fastify（部署了，但不在链路里）

- 目录 `backend/`，Fastify 3 + better-sqlite3 + Zod，systemd 单元 `my-blog-api.service`，主机 `59.79.241.232`，数据在 SQLite `blog.db`（`backend/data/`，已 gitignore）。
- 代码里**只有 `articles` 一个模块**：`backend/src/articles/{article.routes,article.repository,article.schema,article.types}.ts`。
  **没有任何 topic / 专栏 / 小节模型**，也没有草稿、版本或全文检索。
- 三条硬伤：
  1. 校园网拦截入站 → 公网与部署站点访问不到；
  2. 前端默认静态，即使可达也不会用；
  3. 数据结构只覆盖扁平文章，覆盖不了专栏。

## 5. 部署链路与一个未确认的断层

已核实的链路：

```text
本地 md  →  git push origin main
         →  GitHub Actions（.github/workflows/deploy.yml）
              npm ci  →  npm run build  →  upload-pages-artifact  →  deploy-pages
         →  GitHub Pages（自定义域名 darling-02.cn，public/CNAME）
```

深链接可用：`public/404.html` 把未命中路径改写成 `/?/<原路径>`，由 `index.html` 还原后交给前端路由。**前提是整站挂在域名根目录**；若改回 `/my-blog-P5R/`，需同步改 `404.html` 里的 `'/'` 与 `vite.config.ts` 的 `base`。

**未确认的断层**：`darling-02.cn` 的 A 记录指向 `103.106.190.5`（本机实测），不是 GitHub Pages 的 `185.199.x.x`；仓库里还有 `public/.htaccess` 与 `blog-static-upload.zip`（46 个 dist 文件快照）。证据指向"域名实际由自己的服务器提供内容"，若如此，**push 到 GitHub 不会改变 `darling-02.cn` 上看到的内容，需要重新上传新的 `dist`**。

## 6. 已核实 / 未核实

| 事项 | 结论 | 依据 |
| --- | --- | --- |
| 专栏会被打进构建产物 | ✅ | `dist/assets/index-*.js` 内含 `backend-notes` 与 `后端学习笔记` |
| `src/content/articles/` 为空 | ✅ | glob `src/content/**/*.md` 只返回 topics |
| 后端只有 articles 模块 | ✅ | `backend/src/app.ts` 只注册 `registerArticleRoutes` |
| `/admin` 不走后端 | ✅ | `AdminPage.tsx` 只 import `articlePublisher` |
| 前端默认静态 | ✅ | `src/lib/api.ts` 缺省 `static`；仓库只有 `.env.example` |
| CI 步骤与结果 | ✅ | 运行 #74：`build` success、`deploy` success；部署记录 `environment=github-pages`、`sha=ff5d15a` |
| 后端服务当前是否在跑 | ❓ 未核实 | 本机无该主机 SSH 密钥，`ssh` 返回 `Permission denied` |
| `darling-02.cn` 由谁提供内容 | ❓ 未核实 | 校园网对该域名 TLS 连接重置，无法取回 HTML |

## 7. 三条可选路线

| 路线 | 怎么写专栏 | 优点 | 代价 |
| --- | --- | --- | --- |
| 1. 维持现状 | 本地写 md + push | 零成本、已跑通，任何编辑器与智能体都能直接改文件 | 无可视化编辑器；手机改不了 |
| 2. 把 `/admin` 扩成能写 topics | 网页写，commit 到 topics 目录 | 复用现有 token 链路，手机上也能写 | 需处理小节目录与排序规则，约 1–2 天 |
| 3. 让后端真接管内容 | 网页 → Fastify → SQLite | 草稿、搜索、多端 | 静态站需改成运行时拉取；公网可达问题不解决则无意义 |

## 8. 当前建议

先走路线 1。专栏骨架刚建立且尚无正文，此时做书写界面等于给空仓库装修；
用真实写作验证 `前置条件 / 步骤 / 验证 / 踩坑` 这个结构确实好用之后，再决定界面形态——
那时才会知道界面需要解决什么。路线 3 在此之前不必考虑：它和"构建期固化内容的静态站"是架构冲突的。
