import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { moveCategory, parseCategoryDocument, removeCategory, serializeCategoryDocument, topicDirectoriesFrom, upsertCategory } from '../src/lib/category-content.ts';

const sample = [
  { name: '生物信息', description: '生信专题', color: '#ff6b6b', subcategories: ['转录组', '代谢组'] },
  { name: '机器学习', description: '模型训练', color: '#45b7d1', dir: 'machine-learning' },
];

test('round-trips the category table through the exact text the admin commits', () => {
  const text = serializeCategoryDocument(sample);
  assert.ok(text.endsWith('\n'));
  assert.deepEqual(parseCategoryDocument(text), sample);
  // 空的可选字段不能凭空留下来，否则后台"编辑后保存"会写出空的 dir / subcategories。
  assert.deepEqual(parseCategoryDocument(serializeCategoryDocument([{ name: '前端', description: '', color: '#ffffff' }])), [
    { name: '前端', description: '', color: '#ffffff' },
  ]);
});

test('rejects invalid tables before they reach GitHub', () => {
  assert.throws(() => parseCategoryDocument('not json'), /JSON/);
  assert.throws(() => parseCategoryDocument('{}'), /数组/);
  assert.throws(() => parseCategoryDocument(JSON.stringify([{ name: 'A', color: '#fff' }])), /#rrggbb/);
  assert.throws(() => parseCategoryDocument(JSON.stringify([{ name: '', color: '#ffffff' }])), /不能为空/);
  assert.throws(() => parseCategoryDocument(JSON.stringify([{ name: 'A', color: '#ffffff' }, { name: 'A', color: '#000000' }])), /重复/);
  assert.throws(
    () => parseCategoryDocument(JSON.stringify([{ name: 'A', color: '#ffffff', dir: 'same-dir' }, { name: 'B', color: '#ffffff', dir: 'same-dir' }])),
    /目录重复/,
  );
  assert.throws(() => parseCategoryDocument(JSON.stringify([{ name: 'A', color: '#ffffff', dir: 'Bad Dir' }])), /小写字母/);
});

test('the admin edit helpers never lose or duplicate a category', () => {
  const created = upsertCategory(sample, { name: '前端', description: '', color: '#7c5cff' });
  assert.deepEqual(created.map((category) => category.name), ['生物信息', '机器学习', '前端']);
  const renamed = upsertCategory(created, { name: '前端开发', description: 'x', color: '#7c5cff' }, '前端');
  assert.deepEqual(renamed.map((category) => category.name), ['生物信息', '机器学习', '前端开发']);
  assert.deepEqual(removeCategory(renamed, '机器学习').map((category) => category.name), ['生物信息', '前端开发']);
  assert.deepEqual(moveCategory(renamed, 0, 1).map((category) => category.name), ['机器学习', '生物信息', '前端开发']);
  assert.equal(moveCategory(renamed, 0, -1), renamed);
  assert.equal(moveCategory(renamed, 2, 1), renamed);
  // 改完的表照样能过发布时的校验
  assert.equal(parseCategoryDocument(serializeCategoryDocument(moveCategory(renamed, 1, -1))).length, 3);
});

test('the shipped categories.json still describes the same five home categories', () => {
  const categories = parseCategoryDocument(readFileSync(path.join(process.cwd(), 'src', 'content', 'categories.json'), 'utf8'));
  assert.deepEqual(categories.map((category) => category.name), ['生物信息', '三维重建', '机器学习', '后端', '随笔']);
  assert.deepEqual(topicDirectoriesFrom(categories), { '机器学习': 'machine-learning', '后端': 'backend', '随笔': 'essays' });
  assert.equal(categories[0].subcategories.length, 9);
  assert.equal(categories[1].subcategories.length, 3);
  // 后台把这张表实时传给专题编辑器：没有"用专题组织"的栏目时必须是空表，而不是回落到构建期的旧栏目。
  assert.deepEqual(topicDirectoriesFrom([]), {});
  assert.deepEqual(topicDirectoriesFrom([{ name: '前端', description: '', color: '#ffffff' }]), {});
});
