// 往返契约：serializeArticle 写出来的文件，parseArticleSource 必须能读回来。
//
// 这里曾经不对：没有标签的文章会被写成一行空的 "tags:"，解析器却要求"至少一个标签"，
// 于是后台"保存成功"（GitHub 提交真的落地了）、文章永远读不回来，线上还会在模块加载时整片崩掉。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseArticleSource, serializeArticle } from '../src/lib/frontmatter.ts';

const base = {
  id: 1,
  title: '转录组',
  excerpt: '生信管道',
  category: '生物信息',
  date: '2026-10-10',
  body: '暂时先不放内容',
};

test('没有标签的文章能存能读（tags 允许是空列表）', () => {
  const source = serializeArticle({ ...base, tags: [] });
  assert.match(source, /\ntags:\n/);
  const { meta, body } = parseArticleSource(source, 'trans.md');
  assert.deepEqual(meta.tags, []);
  assert.equal(body, '暂时先不放内容');
});

// 回归用例：线上那条真的存不上过的文件（原样照抄）。
test('tags: 为空的真实文件现在能解析', () => {
  const committed = [
    '---',
    'id: 1',
    'title: "转录组"',
    'excerpt: "生信管道嗷~ Ciallo～(∠・ω< )⌒★"',
    'category: "生物信息"',
    'date: "2026-10-10"',
    'readTime: "1 分钟"',
    'tags:',
    '---',
    '',
    '暂时先不放内容',
    '',
  ].join('\n');

  const { meta, body } = parseArticleSource(committed, 'src/content/articles/生物信息/trans.md');
  assert.deepEqual(meta.tags, []);
  assert.equal(body, '暂时先不放内容');
});

test('标签写成单个字符串仍然报错，正常的标签照常解析', () => {
  const broken = '---\nid: 1\ntitle: "a"\nexcerpt: "b"\ncategory: "c"\ndate: "d"\nreadTime: "1 分钟"\ntags: nope\n---\nbody\n';
  assert.throws(() => parseArticleSource(broken, 'x.md'), /Article tags must be a list/);

  const { meta } = parseArticleSource(serializeArticle({ ...base, tags: ['AI', 'AI', ' '] }), 'y.md');
  assert.deepEqual(meta.tags, ['AI']);
});
