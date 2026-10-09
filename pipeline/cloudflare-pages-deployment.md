# Cloudflare Pages 部署流程

站点 `darling-02.cn` 的**线上部署方式**。`darling-02.cn` 的 NS 本来就在 Cloudflare（`chip.ns.cloudflare.com` / `marissa.ns.cloudflare.com`），所以 Pages 不需要备案、证书自动、推送后约 30 秒上线。

> 为什么不用 CloudBase：它的默认域名 `*.tcloudbaseapp.com` 对真实浏览器访问会返回 404「风险提醒」页（实测：带 `Sec-Fetch-Mode: navigate` 的请求被拦，裸 curl 才 200），要能看必须绑自定义域名，而绑域名要先备案。CI 曾经配好了也仍然看不到页面，所以 2026-10-03 整体迁到 Pages。细节留在 [`cloudbase-deployment.md`](cloudbase-deployment.md)。

## 链路

```
/admin 写文章 → GitHub Contents API 提交 Markdown 到 src/content/articles/<分类>/<slug>.md
              → push 到 main
              → GitHub Actions: npm ci → npm run build → wrangler pages deploy
              → 约 30 秒后 https://my-blog-p5r.pages.dev 与 https://darling-02.cn 同时更新
```

写文章那一半与部署无关：`src/lib/article-source.ts:56` 的 `githubSource` 直接用 GitHub Contents API 提交，不经过任何服务器。**唯一的部署环节就是 `.github/workflows/deploy.yml`。**

## 首次配置

### 0. 先建 Pages 项目

`deploy.yml` 靠 `wrangler pages deploy --project-name=my-blog-p5r` 上线。**项目不存在时 wrangler 在 CI（非交互）下不会自动创建**，只会报 project not found 让这一步失败（见 `cloudflare/workers-sdk#2405`，到 wrangler 4 仍未实现）。所以项目必须先手工建出来，否则 Secret 补齐了照样红。

`Workers & Pages` → `Create` → `Pages` → `Upload assets` → 名字一字不差填 `my-blog-p5r` → 创建（先传空内容也行，第一次 CI 部署会覆盖）。

本地也可以走：`npx wrangler login` 之后跑一次 `npx wrangler pages deploy --project-name=my-blog-p5r` —— 交互模式会顺手把项目建掉并直接首发。本地不用装 wrangler，`npx` 现拉。（产物目录不写在命令行里：仓库根目录的 `wrangler.toml` 用 `pages_build_output_dir = "dist"` 声明，Functions 目录按约定还是 `functions/`。）

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

2026-10-04 核对：这两条 A 记录还在，两个域名都返回 Cloudflare **HTTP 530**（隧道已停），也就是域名现在完全打不开 —— 删记录 + 绑 Pages 之后才会恢复。

### 5. 建 KV 命名空间（侧栏访客计数器）

侧栏「网站资讯」的访客数/访问量由 Pages Function `functions/api/stats.ts`（`POST /api/stats?firstVisit=1|0`）计数，数据存在一个 KV 命名空间里。绑定写在仓库根目录 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "BLOG_STATS"
id = "b9586df1f0fb471cb22faa3882ba35a7"
```

新建命名空间：`Workers & Pages` → 左侧 `KV`（新版在 `Storage & Databases` 下）→ `Create instance` → 名字 `blog-stats` → 列表里那串 32 位十六进制就是 `id`，粘回上面。命令行等价：`npx wrangler login` 之后 `npx wrangler kv namespace create blog-stats`，它会直接打印 `id = "..."`。

**别在项目页 `Settings` → `Bindings` 里再手动加一遍同名绑定**：绑定只留 `wrangler.toml` 这一个出处，两处都声明会互相覆盖。

命名空间没建/没绑定时是**优雅降级**而不是报错页：Function 回 503（带 `cache-control: no-store`），前端 `src/lib/site-visits.ts` 拿到非 ok 就显示「—」，不编数字。本地验证：

```powershell
npx wrangler pages dev dist                                    # 本地 KV，不会写到线上
curl.exe -X POST 'http://127.0.0.1:8788/api/stats?firstVisit=1'  # → {"pv":1,"uv":1}
curl.exe -X POST 'http://127.0.0.1:8788/api/stats?firstVisit=0'  # → {"pv":2,"uv":1}，uv 不动
```

## 日常

push 到 `main` 就自动部署，不用管。手动重跑在 Actions 页面点 `Run workflow`。

## 需要注意的

- **SPA 深链接能用**：`public/404.html` 会把 `/article/xxx` 之类改写成 `/?/article/xxx`，`index.html` 里的脚本再还原成真实路径交给前端路由。前提是整站部署在域名根目录（`vite.config.ts` 里 `base: '/'`）。
- **体积限制**：单文件 25 MB、总数 20000 个。当前 `dist` 是 167 个文件 / 10.72 MB / 最大 1.41 MB（`elk-*.js`，只在文章页懒加载那几个图形库时才下），离限制很远。
- **本地不需要装 wrangler**：workflow 用 `npx --yes wrangler@4 pages deploy ...`，每次现拉。
- **`--branch=main`**：Pages 项目的 production 分支默认是 `main`，带上它保证 push 到 main 的部署算生产发布而不是预览。
