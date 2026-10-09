// 校验「幕后」卡片全天作息动图：四个时段边界 + 全天覆盖 + 素材文件确实存在。
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { workMoodAt } from '../src/lib/workMood.ts';

let checks = 0;
const check = (label, fn) => {
  fn();
  checks += 1;
  console.log(`  ok - ${label}`);
};

check('05:59 还是深夜小睡，06:00 切上午普通', () => {
  assert.equal(workMoodAt(5).key, 'nap');
  assert.equal(workMoodAt(6).key, 'normal');
});

check('11:59 上午普通，12:00 切下午疲倦', () => {
  assert.equal(workMoodAt(11).key, 'normal');
  assert.equal(workMoodAt(12).key, 'tired');
});

check('17:59 下午疲倦，18:00 切晚上生气', () => {
  assert.equal(workMoodAt(17).key, 'tired');
  assert.equal(workMoodAt(18).key, 'angry');
});

check('22:59 晚上生气，23:00 切深夜小睡', () => {
  assert.equal(workMoodAt(22).key, 'angry');
  assert.equal(workMoodAt(23).key, 'nap');
});

check('全天 24 小时都有状态，且四个动图全部用到', () => {
  const hourly = Array.from({ length: 24 }, (_, hour) => workMoodAt(hour));
  assert.equal(hourly.length, 24);
  assert.deepEqual([...new Set(hourly.map((mood) => mood.key))].sort(), ['angry', 'nap', 'normal', 'tired']);
  assert.equal(new Set(hourly.map((mood) => mood.file)).size, 4);
});

check('四个动图都已发布到 public/muhou/', () => {
  for (const file of ['work-normal.webp', 'work-tired.webp', 'work-angry.webp', 'work-nap.webp']) {
    assert.ok(existsSync(new URL(`../public/muhou/${file}`, import.meta.url)), `缺少 public/muhou/${file}`);
  }
});

console.log(`work-mood: ${checks}/${checks} checks passed`);
