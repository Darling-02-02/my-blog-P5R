# Cloudflare Pages 部署流程

站点 `darling-02.cn` 的**线上部署方式**。`darling-02.cn` 的 NS 本来就在 Cloudflare（`chip.ns.cloudflare.com` / `marissa.ns.cloudflare.com`），所以 Pages 不需要备案、证书自动、推送后约 30 秒上线。

> 为什么不用 CloudBase：它的默认域名 `*.tcloudbaseapp.com` 对真实浏览器访问会返回 404「风险提醒」页（实测：带 `Sec-Fetch-Mode: navigate` 的请求被拦，裸 curl 才 200），要能看必须绑自定义域名，而绑域名要先备案。CI 曾经配好了也仍然看不到页面，所以 2026-10-03 整体迁到 Pages。细节留在 [`cloudbase-deployment.md`](cloudbase-deployment.md)。

## 链路

```
/admin 写文章 → GitHub Contents API 提交 Markdown 到 src/content/articles/<分类>/<slug>.md
              → push 到 main
              → GitHub Actions: npm ci → npm run build → wrangler pages deploy dist
              → 约 30 秒后 https://my-blog-p5r.pages.dev 与 https://darling-02.cn 同时更新
```

写文章那一半与部署无关：`src/lib/article-source.ts:56` 的 `githubSource` 直接用 GitHub Contents API 提交，不经过任何服务器。**唯一的部署环节就是 `.github/workflows/deploy.yml`。**

## 首次配置

### 1. 建 API Token

打开 https://dash.cloudflare.com/profile/api-tokens → `Create Token` → 最下面 `Create Custom Token`：

| 字段 | 值 |
| --- | --- |
| Token name | `github-actions-pages` |
| Permissions | **Account** → **Cloudflare Pages** → **Edit**（只要这一条） |
| Account Resources | Include → 你的账号 |
| TTL | 自定 |

生成后是一串 40 位字符，**只显示一次**。

### 2. 拿 Account ID

打开 https://dash.cloudflare.com → 左侧 `Workers & Pages` → 右侧栏 `Account ID` 一行，就是它（也可以看地址栏 `dash.cloudflare.com/<Account ID>/workers-and-pages`）。它不是凭据，泄漏了也没有权限风险。

### 3. 加两个 Secret

仓库 → `Settings` → `Secrets and variables` → `Actions` → **`Secrets` tab 下 `Actions` 那块**的 `New repository secret`：

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 第 1 步那串 |
| `CLOUDFLARE_ACCOUNT_ID` | 第 2 步那串 |

三个常见错误（症状都是「配了但没用」）：

- 加到了 `Variables` tab —— 那里读的是 `${{ vars.X }}`，workflow 拿到的仍是空字符串
- 加到了 `Dependabot` 或 `Codespaces` 那一块 —— 那两块长得很像，但 Actions 读不到
- 名字拼错 / 前后带空格 —— 必须一字不差，区分大小写

加对之后页面会列出这两个名字（值永远看不到）。然后 `Actions` → `Build and deploy to Cloudflare Pages` → `Run workflow`，第 3 步 `Check required secrets` 应变成 `success`。

### 4. 绑自定义域名

`Workers & Pages` → `my-blog-p5r` → `Custom domains` → `Set up a custom domain` → 填 `darling-02.cn`（想要 `www` 就再加一次）。

因为 DNS 就在 Cloudflare，它会自动加 CNAME。**但先要处理掉旧记录**：`darling-02.cn` 和 `www` 目前有两条指向 `172.67.179.25` / `104.21.35.199` 的 A 记录（那是已经关掉的 cloudflared 隧道留下的），必须先删，否则冲突。

## 日常

push 到 `main` 就自动部署，不用管。手动重跑在 Actions 页面点 `Run workflow`。

## 需要注意的

- **SPA 深链接能用**：`public/404.html` 会把 `/topic/xxx` 之类改写成 `/?/topic/xxx`，`index.html` 里的脚本再还原成真实路径交给前端路由。前提是整站部署在域名根目录（`vite.config.ts` 里 `base: '/'`）。
- **体积限制**：单文件 25 MB、总数 20000 个。当前 `dist` 是 106 个文件 / 9.21 MB / 最大 1.16 MB，离限制很远。
- **本地不需要装 wrangler**：workflow 用 `npx --yes wrangler@4 pages deploy ...`，每次现拉。
- **`--branch=main`**：Pages 项目的 production 分支默认是 `main`，带上它保证 push 到 main 的部署算生产发布而不是预览。
