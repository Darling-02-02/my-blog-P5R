// 端到端检查：后台数据源真的能写进后端。
//
// 它自己拉一个真后端（临时 SQLite + 随机端口），然后让 src/lib/article-source.ts
// 走真实 HTTP 跑完整流程：新建 → 草稿 → 发布 → 编辑 → 下架 → 删除 → 鉴权失败。
// 空腹跑，不依赖服务器上那份部署。
//
// 前置：cd backend && npm ci && npm run build
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(root, 'backend');
const serverEntry = path.join(backendDir, 'dist', 'server.js');

// config.ts 强制 ADMIN_TOKEN >= 32 位
const ADMIN_TOKEN = 'check-admin-api-token-0123456789abcdef';

if (!existsSync(serverEntry) || !existsSync(path.join(backendDir, 'node_modules'))) {
  console.error('后端未就绪：先执行 `cd backend && npm ci && npm run build`');
  process.exit(1);
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

const waitForHealth = async (base) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(`${base}/health`)).ok) return true;
    } catch {
      // 还没起来
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

// kill() 是异步的：不等子进程退出就删数据库，Windows 上会 EBUSY。
const stopServer = (child) =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once('exit', resolve);
    child.kill();
    setTimeout(resolve, 5_000);
  });

// 清理失败不该影响检查结论，残留临时目录无所谓。
const cleanup = (dir) => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // 文件偶尔还被锁着
  }
};

const dataDir = mkdtempSync(path.join(os.tmpdir(), 'admin-api-check-'));
const workDir = mkdtempSync(path.join(root, 'node_modules', '.admin-api-check-'));
const port = await freePort();
const base = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, [serverEntry], {
  cwd: backendDir,
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(port),
    DATABASE_PATH: path.join(dataDir, 'blog.db'),
    ADMIN_TOKEN,
    CORS_ORIGIN: 'http://localhost:5173',
    NODE_ENV: 'test',
  },
  stdio: 'ignore',
});

let exitCode = 0;

try {
  if (!(await waitForHealth(base))) throw new Error(`后端没能在 ${base} 上起来`);

  // 入口必须待在 node_modules 下，这样 esbuild 解析得到仓库的依赖树。
  const entry = path.join(workDir, 'entry.ts');
  const outfile = path.join(workDir, 'bundle.mjs');
  writeFileSync(
    entry,
    "import { activeArticleSource } from '../../src/lib/article-source';\nexport { activeArticleSource };\n",
    'utf8',
  );

  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    define: {
      'import.meta.env.VITE_ARTICLE_SOURCE': '"api"',
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(base),
    },
    logLevel: 'error',
  });

  const source = (await import(pathToFileURL(outfile).href)).activeArticleSource;
  const publicTotal = async () => (await (await fetch(`${base}/api/articles`)).json()).total;

  const checks = [
    ['数据源选中后端', source.kind === 'api'],
    ['声明支持草稿态', source.supportsDraft === true],
  ];

  const add = (label, ok) => checks.push([label, ok]);

  const input = {
    slug: 'admin-api-check',
    title: '后台直连后端检查',
    excerpt: '端到端检查用的文章',
    content: '# 正文\n\n检查内容',
    coverUrl: '',
    category: '测试栏目',
    subcategory: '',
    readTime: '1 分钟',
    tags: ['检查'],
  };

  let items = await source.list(ADMIN_TOKEN);
  add('连上后端并取回空列表', items.length === 0);

  await source.save(ADMIN_TOKEN, input);
  items = await source.list(ADMIN_TOKEN);
  add('新建文章默认存为草稿', items.length === 1 && items[0].status === 'draft');
  add('草稿不出现在公开接口', (await publicTotal()) === 0);

  await source.setPublished(ADMIN_TOKEN, items[0], true);
  add('发布后公开接口能读到', (await publicTotal()) === 1);
  items = await source.list(ADMIN_TOKEN);
  add('发布后状态为 published', items[0].status === 'published');

  // 关键回归：后端 update 的 status 有默认值 draft，客户端漏传原状态会把已发布文章静默下架。
  await source.save(ADMIN_TOKEN, { ...input, title: '改过标题' }, items[0]);
  items = await source.list(ADMIN_TOKEN);
  add('编辑已发布文章不会把它下架', items[0].status === 'published' && (await publicTotal()) === 1);

  await source.setPublished(ADMIN_TOKEN, items[0], false);
  add('下架后公开接口不再返回', (await publicTotal()) === 0);

  await source.remove(ADMIN_TOKEN, items[0]);
  items = await source.list(ADMIN_TOKEN);
  add('删除后列表为空', items.length === 0);

  let badStatus = 0;
  try {
    await source.list('wrong-token');
  } catch (error) {
    badStatus = error?.status ?? -1;
  }
  add('错误令牌被拒（401）', badStatus === 401);

  const failed = checks.filter(([, ok]) => !ok);

  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length} 项失败。`);
    exitCode = 1;
  } else {
    console.log(`\n全部通过（${checks.length} 项）。`);
  }
} catch (error) {
  console.error(`检查中断：${error instanceof Error ? error.message : String(error)}`);
  exitCode = 1;
} finally {
  await stopServer(server);
  cleanup(workDir);
  cleanup(dataDir);
}

process.exit(exitCode);
