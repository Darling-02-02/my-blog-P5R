import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTopicDocument, serializeSection, serializeTopic } from '../src/lib/topic-content.ts';

const topic = {
  category: '后端', slug: 'api-design', title: 'API 设计', summary: '接口设计',
  order: 2, tags: ['设计', '接口'],
  intro: '# 介绍\n\n```ts\nconst value = 1;\n```\n\n$$x^2$$',
};
const section = { slug: 'overview', title: '概览', order: 1, readTime: '5 分钟', content: '# 第一节\n\n![图](./image.png)' };

test('serializes multiline topic and section markdown with parseable frontmatter', () => {
  const parsed = parseTopicDocument(serializeTopic(topic), 'topic.md');
  assert.equal(parsed.meta.title, topic.title);
  assert.equal(parsed.meta.order, topic.order);
  assert.deepEqual(parsed.meta.tags, topic.tags);
  assert.equal(parsed.body, topic.intro);
  const first = parseTopicDocument(serializeSection(section), 'overview.md');
  assert.equal(first.meta.title, section.title);
  assert.equal(first.body, section.content);
});

test('rejects invalid slugs and empty content before publishing', () => {
  assert.throws(() => serializeTopic({ ...topic, slug: '../bad' }), /Slug/);
  assert.throws(() => serializeSection({ ...section, content: '  ' }), /不能为空/);
  assert.throws(() => serializeTopic({ ...topic, order: -1 }), /排序/);
});
