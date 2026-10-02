# 流程文档索引

这里收纳「东西怎么从本地走到线上」的全部流程说明。仓库里其他目录（`docs/`、`security-audit/`）放的是设计与审计记录，不放流程。

| 文档 | 讲什么 | 状态 |
| --- | --- | --- |
| [`cloudbase-deployment.md`](cloudbase-deployment.md) | 前端静态站部署到腾讯云 CloudBase，以及绑定自定义域名 `darling-02.cn` | 站点已上线（110 文件）；自定义域名卡在**备案接入** |
| [`backend-deployment-quickstart.md`](backend-deployment-quickstart.md) | 后端 Fastify + SQLite 上服务器（Node 22、systemd、反向代理） | 可部署；**当前不在线上链路里** |
| [`content-pipeline.md`](content-pipeline.md) | 专栏 / 文章 / 后端三条内容线，以及构建发布链路 | 专栏可用；文章与后端为半成品 |

## 两条独立链路

```text
前端静态站   src/ + public/  →  npm run build  →  dist/  →  CloudBase 静态托管
后端 API     backend/        →  npm run build  →  dist/  →  systemd（未启用）
```

两条链路互不依赖：前端默认 `VITE_ARTICLE_SOURCE=static`，不请求后端也能完整渲染。

## 注意

- `content-pipeline.md` 写于 2026-09-28，当时站点走 GitHub Pages + 自购虚拟主机；**部署方式现已改为 CloudBase**，相关结论以 `cloudbase-deployment.md` 为准。
- `cloudbase-deployment.md` 里的备案章节是当前唯一的阻塞项，其余步骤均已完成。
