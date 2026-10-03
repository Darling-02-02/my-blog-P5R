# 流程文档索引

这里收纳「东西怎么从本地走到线上」的全部流程说明。仓库里其他目录（`docs/`、`security-audit/`）放的是设计与审计记录，不放流程。

| 文档 | 讲什么 | 状态 |
| --- | --- | --- |
| [`cloudflare-pages-deployment.md`](cloudflare-pages-deployment.md) | 前端静态站的**线上部署**：Cloudflare Pages + `darling-02.cn` | 当前方案；差两个 Secret 与一次自定义域名绑定 |
| [`cloudbase-deployment.md`](cloudbase-deployment.md) | 腾讯云 CloudBase 静态托管（含备案接入的坑） | 已弃用为 CI 目标，保留作手动备用 |
| [`backend-deployment-quickstart.md`](backend-deployment-quickstart.md) | 后端 Fastify + SQLite 上服务器（Node 22、systemd、反向代理） | 可部署；**当前不在线上链路里** |
| [`content-pipeline.md`](content-pipeline.md) | 专栏 / 文章 / 后端三条内容线，以及构建发布链路 | 专栏可用；文章与后端为半成品 |

## 两条独立链路

```text
前端静态站   src/ + public/  →  npm run build  →  dist/  →  Cloudflare Pages（push 自动部署）
后端 API     backend/        →  npm run build  →  dist/  →  systemd（未启用）
```

两条链路互不依赖：前端默认 `VITE_ARTICLE_SOURCE=static`，不请求后端也能完整渲染。

## 注意

- `content-pipeline.md` 写于 2026-09-28，当时站点走 GitHub Pages + 自购虚拟主机；**部署方式现已改为 Cloudflare Pages**，相关结论以 `cloudflare-pages-deployment.md` 为准。
- 部署方式换过三次：GitHub Pages → CloudBase → Cloudflare Pages。CloudBase 被换掉的原因是默认域名对浏览器访问返回「风险提醒」页、绑自定义域名又卡备案，CI 变绿也看不到页面。
