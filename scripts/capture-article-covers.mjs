// 给每篇文章生成一张「文章内容截图」当首页卡片封面（public/covers/<slug>.webp）。
//
// 为什么要它：首页卡片的图想用文章自己的内容，但绝大多数文章正文没有插图。
// 这个脚本用 headless Chrome 打开每篇文章页，裁正文容器（.article-body）的左上正方形，
// 转成 webp 存进 public/covers/。卡片按 src/lib/article-cover.ts 的约定去取。
//
// 前置：本机装有 Chrome + ffmpeg，并且 dev server 已经跑起来（默认 http://localhost:5173）。
// 用法：
//   npm run dev                                     # 另开一个终端
//   chrome --headless=new --remote-debugging-port=9355 --user-data-dir=%TEMP%\dsh-covers about:blank
//   node scripts/capture-article-covers.mjs 9355 http://localhost:5173/
// 文章改了要重新跑一次（截图不会自己更新），这是它唯一的使用成本。
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const port = process.argv[2] ?? '9355';
const base = process.argv[3] ?? 'http://localhost:5173/';
const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const OUT_DIR = path.join(process.cwd(), 'public', 'covers');
const RAW_DIR = path.join(process.cwd(), '.shots', 'covers-raw');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const listSlugs = async () => {
  const slugs = [];
  for (const category of await readdir(ARTICLES_DIR, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const file of await readdir(path.join(ARTICLES_DIR, category.name))) {
      if (file.endsWith('.md')) slugs.push(`${category.name}/${file.slice(0, -3)}`);
    }
  }
  return slugs.sort();
};

const connect = async () => {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('没找到可用的 Chrome 页面，先按文件头的命令起一个 headless Chrome');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    msg.error ? entry.reject(new Error(msg.error.message)) : entry.resolve(msg.result);
  });

  const send = (method, params = {}) => {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => pending.delete(id) && reject(new Error(`${method} 超时`)), 60000);
    });
  };

  const evaluate = async (expression, awaitPromise = false) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    return result.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  return { ws, send, evaluate };
};

const main = async () => {
  const slugs = await listSlugs();
  await mkdir(OUT_DIR, { recursive: true });
  await rm(RAW_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const { ws, send, evaluate } = await connect();
  // 正方形视口：卡片封面是 1:1，裁出来直接用
  await send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: 1, mobile: false });

  for (const slug of slugs) {
    const url = `${base}article/${slug.split('/').map(encodeURIComponent).join('/')}`;
    await send('Page.navigate', { url });
    await sleep(1600);
    await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true', true);
    // 图表/公式是懒加载的，多等一会儿再截
    await sleep(1200);

    const rect = await evaluate(`(() => {
      const el = document.querySelector('.article-body');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    })()`);

    if (!rect) {
      console.warn(`跳过 ${slug}：页面上找不到 .article-body`);
      continue;
    }

    const size = Math.min(rect.w, Math.max(rect.h, 400), 900);
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: rect.x, y: rect.y, width: size, height: size, scale: 1 },
    });

    const raw = path.join(RAW_DIR, `${slug.replace(/\//g, '-')}.png`);
    const out = path.join(OUT_DIR, `${slug.replace(/\//g, '-')}.webp`);
    await writeFile(raw, Buffer.from(shot.data, 'base64'));
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', 'scale=900:-1', '-c:v', 'libwebp', '-quality', '80', out]);
    const bytes = (await readFile(out)).length;
    console.log(`${slug} → public/covers/${path.basename(out)} (${Math.round(bytes / 1024)} KB)`);
  }

  ws.close();
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
