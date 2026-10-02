# CloudBase 部署流程

## 关键信息

| 项 | 值 |
| --- | --- |
| envId | `self-d4g5iy3gmd8f1ce36` |
| 套餐 | 个人版（`baas_personal`），到期 `2027-04-01 23:59:59` |
| 地域 | ap-shanghai |
| 默认域名 | `https://self-d4g5iy3gmd8f1ce36-1469278019.tcloudbaseapp.com` |
| 静态托管桶 | `ae14-static-self-d4g5iy3gmd8f1ce36-1469278019` |
| 站点域名 | `darling-02.cn`（备案在宝塔侧，非腾讯云） |
| 证书 ID | `bEpYNNb0`（到期 2026-12-30 21:59:59） |
| DNS 托管 | Cloudflare（`chip.ns.cloudflare.com` / `marissa.ns.cloudflare.com`） |

## 已完成

```bash
tcb login
tcb env use self-d4g5iy3gmd8f1ce36
tcb hosting detail -e self-d4g5iy3gmd8f1ce36
npm run build
tcb hosting deploy ./dist -e self-d4g5iy3gmd8f1ce36 --verify
```

| 项 | 结果 |
| --- | --- |
| TXT `_cloudbase-challenge` = `self-d4g5iy3gmd8f1ce36` | 已生效，归属权预检通过 |
| SSL 证书 | `bEpYNNb0`，控制台申请 |
| 静态托管 | 110 个文件，`/`、`/study-room`、`/assets/*` 均 200 |

## 自动部署（网页写文章 → 自动上线）

链路：`/admin` 页面提交 → GitHub Contents API 提交 Markdown 到 `src/content/articles/<分类>/<slug>.md` → push 到 `main` → GitHub Actions 构建并推送到 CloudBase 静态托管根目录，约 1–2 分钟上线。

`.github/workflows/deploy.yml` 用 **CloudBase 环境级 API Key** 鉴权（只对本环境有效，可单独吊销），不是腾讯云 SecretId/SecretKey。

仓库需要在 **Settings → Secrets and variables → Actions** 里加两个 Secret：

| Secret | 值 |
| --- | --- |
| `TCB_ENV_ID` | `self-d4g5iy3gmd8f1ce36` |
| `CLOUDBASE_API_KEY` | 用下面的命令生成 |

```bash
tcb env apikey create github-actions -e self-d4g5iy3gmd8f1ce36   # 创建，返回值只显示一次
tcb env apikey list   -e self-d4g5iy3gmd8f1ce36                  # 查看 KeyId
tcb env apikey delete <keyId> -e self-d4g5iy3gmd8f1ce36          # 吊销（泄漏时用）
```

注意：workflow 里 `tcb hosting deploy ./dist /` 的 `/` 是云端目标路径，必须是根目录，否则 SPA 路由与外链资源都会 404。

写文章用的是另一个凭据：`/admin` 页面顶部要填一个 **fine-grained GitHub Token**（仅本仓库 `Contents: Read and write`），只存在浏览器 sessionStorage 里，不落盘、不入库。

## 当前阻塞：备案接入

绑定域名时被挡：

```text
[CreateHTTPServiceRoute] 域名未备案；如果域名已经完成备案，
由于腾讯云与工信部数据需要同步，请在1小时后重试。
```

**这不是同步延迟。** 官方 FAQ 已明确（[CloudBase ICP 备案](https://docs.cloudbase.net/faq/security/icp) 第 4 条）：

> 如果您的域名已在其他服务商（如阿里云、华为云等）完成过 ICP 备案，直接绑定到腾讯云开发会被系统拦截或提示未备案。您需要先在腾讯云办理**新增接入备案（备案转入）**，将备案信息接入腾讯云后，方可正常绑定和访问。

宝塔侧的备案对腾讯云无效，必须先做**接入备案**。

### 接入备案的准入条件

备案云资源三选一：

- 云开发环境：个人版及以上 + 剩余有效期 ≥ 6 个月 + 开启云托管固定 IP
- 轻量应用服务器：包年包月 3 个月及以上
- CVM 云服务器：包年包月含公网带宽，3 个月及以上

本环境实测：个人版 ✅ / 到期 2027-04-01（约 6 个月，卡在门槛线）⚠️ / 固定 IP 未确认 ❓

### 流程

1. 打开 [腾讯云备案控制台](https://console.cloud.tencent.com/beian) → 新增接入备案
2. 备案资源选本云开发环境
3. 填主体信息、网站域名、证件，做人脸核验
4. 腾讯云初审 → 各省管局审核，**1-20 个工作日**
5. 通过后回到 [HTTP 网关](https://tcb.cloud.tencent.com/dev?#/env/http-access) 重新绑定域名

### 绑定与路由（备案通过后执行）

```bash
tcb domains add darling-02.cn -e self-d4g5iy3gmd8f1ce36 --certid bEpYNNb0

tcb routes add -e self-d4g5iy3gmd8f1ce36 --data '{"domain":"darling-02.cn","routes":[{"path":"/","upstreamResourceType":"STATIC_STORE","upstreamResourceName":"staticstore"}]}'
```

再把 Cloudflare 的 A/CNAME 指向绑定后拿到的 CNAME 地址。

### 校验

```bash
tcb domains ls -e self-d4g5iy3gmd8f1ce36
tcb hosting list -e self-d4g5iy3gmd8f1ce36
curl -I https://darling-02.cn/
```

当前 `domains ls` 状态：`darling-02.cn` 已创建但 `DNS状态 EMPTY` / `状态 FAIL` / `路由 -`，是失败残留，可留待重试。

## 踩过的坑

1. **默认域名不能对外用**：`*.tcloudbaseapp.com` 对浏览器访问插中间页，其他请求加 `Content-Disposition: attachment`（浏览器会下载而不是打开页面）。唯一解法是绑自定义域名。
2. **其他服务商的备案不能直接绑**，必须先接入备案（见上）。
3. **归属权 TXT 先行**：缺 `_cloudbase-challenge` 时预检报 `OWNERSHIP_VERIFY_FAILED`。
4. **证书必须控制台申请**：CLI 身份无 `ssl:ApplyCertificate` 权限，报 `AuthFailure.UnauthorizedOperation`。
5. **用 `tcb hosting deploy`，不要用 `tcb deploy`**（后者是实验性命令）。
6. **`.htaccess` 无效** —— CloudBase 不解析 Apache 重写规则，SPA 回退由平台侧配置。
7. **`--verify` 会对 `.htaccess` 和中文文件名报 `missing`**，属预期，其余文件已正常上传。
8. **后端未部署**：Fastify 不能作为 SCF 事件函数，动态 API 需上 Cloud Run（容器）。前端当前走 `VITE_ARTICLE_SOURCE=static`。

## 已废弃的路径

```text
虚拟主机 FTP        103.106.190.5        Pure-FTPd PASV 地址不可路由，上传始终失败
cpolar 隧道         3389 / 8080          目标端口无服务，纯空转
cloudflared 隧道    91feaef8-…           ingress 指向 localhost:8080，同样无服务
```

云开发默认域名之外的这些方案都要求本机常开并暴露公网 IP，CloudBase 已取代它们。
