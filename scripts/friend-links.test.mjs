import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { friendLinks } from '../src/data/friend-links.ts';

// 友链是手写数组，最容易坏的地方是「封面路径打错」——线上只会静默少一张图。
// 这里把它挡在构建前：名字、https 主页、cover 必须是 public 下真实存在的文件。
test('every friend link has a name, an https homepage, and an existing cover', () => {
  assert.ok(friendLinks.length > 0, '友链数组不该是空的（空的时候首页会显示「还没有友链」）');

  for (const link of friendLinks) {
    assert.ok(link.name.trim(), '友链缺少名字');
    assert.match(link.url, /^https:\/\//, `友链「${link.name}」的 url 必须是 https`);
    assert.ok(link.desc.trim(), `友链「${link.name}」缺少一句话说明`);

    if (link.cover === undefined) continue;
    assert.match(link.cover, /^\//, `友链「${link.name}」的 cover 要用 / 开头的站点路径`);
    const file = path.join(process.cwd(), 'public', link.cover);
    assert.ok(
      statSync(file, { throwIfNoEntry: false })?.isFile(),
      `友链「${link.name}」的封面 public${link.cover} 不存在`,
    );
  }
});
