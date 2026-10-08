import assert from 'node:assert/strict';
import { test } from 'node:test';
import { estimateReadTime } from '../src/lib/reading-time.ts';

test('estimates reading time from the body instead of asking the author', () => {
  assert.equal(estimateReadTime(''), '1 分钟');
  assert.equal(estimateReadTime('短'), '1 分钟');
  // 中文 400 字/分钟：2000 字 → 5 分钟，正好卡在整数上。
  assert.equal(estimateReadTime('字'.repeat(2000)), '5 分钟');
  // 英文 200 词/分钟。
  assert.equal(estimateReadTime(Array.from({ length: 600 }, () => 'word').join(' ')), '3 分钟');
  // 代码块不算阅读量：一篇只有代码的文章至少也是 1 分钟。
  assert.equal(estimateReadTime('```\n' + '字'.repeat(2000) + '\n```'), '1 分钟');
});
