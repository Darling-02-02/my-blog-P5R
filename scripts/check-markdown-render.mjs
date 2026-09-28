// 渲染冒烟检查：确认 Markdown 正文里的代码高亮、语言标注、LaTeX 公式和
// 复制按钮用的纯文本提取都还正常。改 MarkdownBody / 升级 rehype 插件后跑一次。
//
// 用法：node scripts/check-markdown-render.mjs
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const markdownBody = path.join(root, 'src', 'components', 'MarkdownBody.tsx');
const hastText = path.join(root, 'src', 'lib', 'hast-text.ts');
const markdown = [
  '行内 `code` 和行内公式 $E = mc^2$。',
  '',
  '```c++',
  'int main() { return 0; }',
  '```',
  '',
  '```python',
  'def add(a: int, b: int) -> int:',
  '    return a + b',
  '```',
  '',
  '$$',
  '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
  '$$',
  '',
  '```',
  'plain 未标注语言的代码块',
  '```',
  '',
  '| 字段 | 类型 | 说明 |',
  '| --- | --- | --- |',
  '| `id` | int | 主键 |',
  '| $\\alpha$ | float | 表格单元格里的行内公式 |',
].join('\n');

// entry 必须写在仓库内，否则解析不到 node_modules 里的 react。
const dir = mkdtempSync(path.join(root, 'node_modules', '.md-render-check-'));
const entry = path.join(dir, 'entry.jsx');
const toRelative = (target) => path.relative(dir, target).split(path.sep).join('/');

writeFileSync(
  entry,
  [
    "import { renderToStaticMarkup } from 'react-dom/server';",
    `import MarkdownBody from ${JSON.stringify(toRelative(markdownBody))};`,
    `import { textOf } from ${JSON.stringify(toRelative(hastText))};`,
    `const content = ${JSON.stringify(markdown)};`,
    'export const html = renderToStaticMarkup(<MarkdownBody content={content} />);',
    'export { textOf };',
  ].join('\n'),
  'utf8',
);

const outfile = path.join(dir, 'bundle.cjs');

try {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    loader: { '.css': 'empty' },
    logLevel: 'error',
  });

  // react-dom/server 是 CJS，用 require 读打包结果最稳。
  const { html, textOf } = createRequire(import.meta.url)(outfile);

  // 长公式溢出只能在窄屏暴露，用样式表规则做一条廉价回归保护。
  const indexCss = readFileSync(path.join(root, 'src', 'index.css'), 'utf8');

  const checks = [
    ['代码块有 highlight.js token', html.includes('hljs-keyword')],
    ['语言标注保留 c++', html.includes('>c++<')],
    ['语言标注保留 python', html.includes('>python<')],
    ['行内公式渲染成 KaTeX', html.includes('class="katex')],
    ['块级公式渲染成 KaTeX display', html.includes('katex-display')],
    ['行内代码仍是行内', html.includes('bg-inline-code')],
    // KaTeX 会把原始 LaTeX 放进 <annotation>，所以不能断言"没有 \alpha"，
    // 而要断言它被解析成了公式节点（转义写法的 \$ 不会产生 annotation）。
    ['表格单元格里的行内公式也渲染', html.includes('application/x-tex">\\alpha')],
    ['复制按钮带 aria-live 播报', html.includes('aria-live="polite"')],
    ['复制按钮是 type=button', html.includes('type="button"')],
    // 样式表字符串检查：KaTeX 自己不给 .katex-display 加 overflow，删掉这条规则窄屏公式就会顶破卡片。
    ['长公式有横向滚动规则', /:root \.katex-display\s*\{[^}]*overflow-x/.test(indexCss)],
    [
      'textOf 能把高亮后的 span 树拼回纯文本',
      textOf({ children: [{ value: 'int ' }, { children: [{ value: 'main' }] }, { value: '()' }] }) ===
        'int main()',
    ],
  ];

  const failed = checks.filter(([, ok]) => !ok);

  for (const [label, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  }

  console.log(`\n诊断：代码块“复制”按钮出现 ${html.split('复制').length - 1} 次（示例里有 3 个围栏代码块）`);

  if (failed.length) {
    console.error(`\n${failed.length} 项失败。渲染片段：\n${html.slice(0, 1200)}`);
    process.exitCode = 1;
  } else {
    console.log(`\n全部通过（${checks.length} 项）。`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
