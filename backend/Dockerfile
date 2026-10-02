# 后端容器。用 Debian 底包（不是 Alpine）：better-sqlite3 的预编译二进制依赖 glibc，
# 走 Alpine 就得在镜像里装编译工具链。
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# dist/db.js 用 ../migrations 读建表 SQL，所以 migrations 必须在 dist 的上一级。
COPY migrations ./migrations
# 数据卷挂在 /data，属主给 node（命名卷首次创建会沿用镜像里的属主）。
RUN mkdir -p /data && chown node:node /data
USER node
# 容器内必须监听 0.0.0.0，否则宿主的端口映射进不来。
ENV HOST=0.0.0.0 PORT=4000 DATABASE_PATH=/data/blog.db
EXPOSE 4000
CMD ["node", "dist/server.js"]
