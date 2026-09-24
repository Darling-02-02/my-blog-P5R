# 后端部署简明流程

> 适用环境：Ubuntu、Node.js 16、Git、Caddy、SQLite。
>
> 当前项目后端目录：`backend/`。
>
> 示例项目路径：`/home/YOUR_USER/project/my-blog-P5R`。
>
> 更新日期：2026-09-24

## 1. DNS

在域名 DNS 控制台新增一条 A 记录：

```text
主机记录：api
记录类型：A
记录值：服务器公网固定 IP
```

结果应为：

```text
api.darling-02.cn -> 服务器公网固定 IP
```

检查：

```bash
nslookup api.darling-02.cn
```

DNS 只负责域名指向，不会自动部署代码。

## 2. 拉取项目

```bash
cd ~/project

git clone https://github.com/Darling-02-02/my-blog-P5R.git
cd my-blog-P5R
```

以后更新：

```bash
cd ~/project/my-blog-P5R
git pull origin main
```

## 3. 创建后端配置

```bash
cd ~/project/my-blog-P5R/backend
mkdir -p /home/$USER/project/my-blog-data
cp .env.example .env
openssl rand -hex 32
nano .env
```

`.env` 示例：

```env
HOST=127.0.0.1
PORT=4000
DATABASE_PATH=/home/YOUR_USER/project/my-blog-data/blog.db
ADMIN_TOKEN=粘贴刚才生成的随机字符串
CORS_ORIGIN=https://darling-02.cn
NODE_ENV=production
```

不要把真实 `.env` 提交到 GitHub。

## 4. 安装和编译后端

服务器使用 Node 16 时：

```bash
cd ~/project/my-blog-P5R/backend
node -v
npm -v
npm ci --no-audit --no-fund
npm run build
```

`better-sqlite3` 会优先尝试下载匹配 Node 16/Linux 架构的预编译文件。

验证 SQLite：

```bash
node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database(':memory:'); console.log(db.prepare('select 1 as ok').get())"
```

预期：

```text
{ ok: 1 }
```

如果出现 `No prebuilt binaries found` 或 `node-gyp rebuild`，说明当前服务器没有匹配的预编译包，需要补装编译工具或调整运行方案。

## 5. 先测试本机 API

```bash
cd ~/project/my-blog-P5R/backend
npm start
```

另开一个终端：

```bash
curl http://127.0.0.1:4000/health
```

预期：

```json
{"status":"ok"}
```

测试完成后按 `Ctrl+C` 停止临时进程。

## 6. 配置 systemd

创建服务：

```bash
sudo nano /etc/systemd/system/my-blog-api.service
```

将下面的 `YOUR_USER` 替换成服务器用户名，将 Node 路径替换成 `which node` 的结果：

```ini
[Unit]
Description=My Blog Article API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=YOUR_USER
Group=YOUR_USER
WorkingDirectory=/home/YOUR_USER/project/my-blog-P5R/backend
EnvironmentFile=/home/YOUR_USER/project/my-blog-P5R/backend/.env
ExecStart=/home/YOUR_USER/.nvm/versions/node/v16.20.2/bin/node /home/YOUR_USER/project/my-blog-P5R/backend/dist/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now my-blog-api
sudo systemctl status my-blog-api --no-pager
```

查看日志：

```bash
sudo journalctl -u my-blog-api -n 100 --no-pager
```

## 7. 配置 Caddy HTTPS

编辑：

```bash
sudo nano /etc/caddy/Caddyfile
```

加入：

```caddy
api.darling-02.cn {
    reverse_proxy 127.0.0.1:4000
}
```

检查并重载：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Caddy 自动申请 HTTPS 证书，因此公网 TCP 80/443 必须可达。

## 8. 防火墙和公网验证

如果使用 UFW：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

不要开放 4000 到公网，4000 只允许本机 Caddy 访问。

服务器本机：

```bash
curl http://127.0.0.1:4000/health
```

外部电脑：

```powershell
curl.exe https://api.darling-02.cn/health
```

预期：

```json
{"status":"ok"}
```

如果 DNS 正确但 80/443 不通，需要检查 Ubuntu 防火墙和学校网络是否开放入站 TCP 80/443。

## 9. 前端切换 API 模式

GitHub Actions 构建时设置：

```yaml
env:
  VITE_ARTICLE_SOURCE: api
  VITE_API_BASE_URL: https://api.darling-02.cn
```

不要把 `ADMIN_TOKEN` 放进前端或 GitHub Actions。

提交后：

```bash
git add .github/workflows/deploy.yml
git commit -m "chore: enable production article api"
git push origin main
```

后台地址：

```text
https://darling-02.cn/admin
```

后台登录密钥就是后端 `.env` 中的 `ADMIN_TOKEN`。
