// 正文图片引用检查：文章页在 /article/<分类>/<slug> 下，相对路径永远找不到 public 里的文件。
// 回归背景：2026-10-12 的 datadownload.md 三张图写成编辑器导出的 "数据库下载.assets/a.png"，线上全 404。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findLocalImageProblems } from '../src/lib/article-images.ts';

const existsIn = (...files) => (pathUnderPublic) => files.includes(pathUnderPublic);

test('远程图片和 data: URI 不检查', () => {
  const body = '![a](https://ctdbase.org/a.png)\n![b](data:image/gif;base64,R0lGODlhAQABAPABAP///wAA)\n![c](//cdn.example.com/c.png)';
  assert.deepEqual(findLocalImageProblems(body, () => false), []);
});

test('public 下的绝对路径、文件在，就通过', () => {
  const body = '![浏览器 F12 里 href="/reports/…" 的位置](/images/数据下载/6a661a21.png)';
  assert.deepEqual(findLocalImageProblems(body, existsIn('images/数据下载/6a661a21.png')), []);
});

test('绝对路径但仓库里没有这个文件 -> missing', () => {
  const body = '![a](/images/nope.png)';
  assert.deepEqual(findLocalImageProblems(body, () => false), [{ src: '/images/nope.png', reason: 'missing' }]);
});

// 真实坏文件：%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%8B%E8%BD%BD.assets/... （百分比编码的相对路径）
test('相对路径（编辑器导出的 xx.assets/a.png）-> relative', () => {
  const body = [
    '![img](%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%8B%E8%BD%BD.assets/6a661a21.png)',
    '![img](数据库下载.assets/83f930b5.png)',
  ].join('\n');
  assert.deepEqual(findLocalImageProblems(body, () => true), [
    { src: '%E6%95%B0%E6%8D%AE%E5%BA%93%E4%B8%8B%E8%BD%BD.assets/6a661a21.png', reason: 'relative' },
    { src: '数据库下载.assets/83f930b5.png', reason: 'relative' },
  ]);
});

test('百分比编码的绝对路径会先解码再找文件', () => {
  const body = '![a](/images/%E6%95%B0%E6%8D%AE%E4%B8%8B%E8%BD%BD/6a661a21.png)';
  assert.deepEqual(findLocalImageProblems(body, existsIn('images/数据下载/6a661a21.png')), []);
});

test('围栏代码块里的图片语法不算引用', () => {
  const body = '看这段：\n```md\n![示例](数据库下载.assets/a.png)\n```\n完事';
  assert.deepEqual(findLocalImageProblems(body, () => false), []);
});
