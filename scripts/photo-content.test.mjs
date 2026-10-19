import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePhotoDocument, serializePhotoDocument } from '../src/lib/photo-content.ts';

test('空清单是合法的', () => {
  assert.deepEqual(parsePhotoDocument('[]'), []);
});

test('合法清单往返后内容不变', () => {
  const photos = [
    { src: '/gallery/a.jpg', title: '第一张', date: '2026-10-17', caption: '一句话' },
    { src: '/gallery/b.webp', title: '第二张' },
  ];
  assert.deepEqual(parsePhotoDocument(serializePhotoDocument(photos)), photos);
});

test('可选字段缺失时不写进输出，diff 只反映真实改动', () => {
  const raw = serializePhotoDocument([{ src: '/gallery/a.jpg', title: '第一张' }]);
  assert.equal(raw.includes('date'), false);
  assert.equal(raw.includes('caption'), false);
  assert.equal(raw.endsWith('\n'), true);
});

test('外链照片允许，非根路径的本地路径拒绝', () => {
  assert.equal(parsePhotoDocument('[{"src":"https://example.com/a.jpg","title":"外链"}]').length, 1);

  // 'gallery/a.jpg' 在 /gallery 路由下会解析成 /gallery/gallery/a.jpg，必须拦住。
  assert.throws(
    () => parsePhotoDocument('[{"src":"gallery/a.jpg","title":"相对路径"}]'),
    /必须是 \/ 开头的根路径/,
  );
});

test('坏输入逐个报错', () => {
  assert.throws(() => parsePhotoDocument('{'), /不是合法的 JSON/);
  assert.throws(() => parsePhotoDocument('{}'), /必须是一个数组/);
  assert.throws(() => parsePhotoDocument('[null]'), /必须是一个对象/);
  assert.throws(() => parsePhotoDocument('[{"src":"/a.jpg"}]'), /标题不能为空/);
  assert.throws(() => parsePhotoDocument('[{"title":"没路径"}]'), /图片路径不能为空/);
  assert.throws(
    () => parsePhotoDocument('[{"src":"/a.jpg","title":"甲"},{"src":"/a.jpg","title":"乙"}]'),
    /照片路径重复/,
  );
  assert.throws(() => parsePhotoDocument('[{"src":"/a.jpg","title":"甲","date":"2026/10/17"}]'), /必须是 YYYY-MM-DD/);
});

test('标题里的换行会被拒绝（它会同时成为 alt 文案）', () => {
  assert.throws(() => parsePhotoDocument('[{"src":"/a.jpg","title":"上\\n下"}]'), /不能包含换行/);
});
