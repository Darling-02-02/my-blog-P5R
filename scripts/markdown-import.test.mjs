import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMarkdownImport } from '../src/lib/markdown-import.ts';

test('parses frontmatter and keeps fenced Markdown body intact', () => {
  const result = parseMarkdownImport('---\ntitle: "算法笔记"\nexcerpt: "公式与流程图"\ncategory: "机器学习"\ntags:\n  - "AI"\n  - "Markdown"\n---\n\n# 正文\n\n```python\nprint(1)\n```\n');

  assert.deepEqual(result.fields, {
    title: '算法笔记',
    excerpt: '公式与流程图',
    category: '机器学习',
    tags: ['AI', 'Markdown'],
  });
  assert.match(result.content, /```python\nprint\(1\)\n```/);
});

test('derives title and slug when frontmatter is absent', () => {
  const result = parseMarkdownImport('# Hello World\n\n正文');
  assert.equal(result.fields.title, 'Hello World');
  assert.equal(result.fields.slug, 'hello-world');
});

test('supports BOM, CRLF, inline tags and multiline YAML without inventing absent fields', () => {
  const result = parseMarkdownImport('\uFEFF---\r\ntags: [React, "C++"]\r\nexcerpt: >-\r\n  first\r\n  second\r\n---\r\ntext');
  assert.deepEqual(result.fields.tags, ['React', 'C++']);
  assert.equal(result.fields.excerpt, 'first second');
  assert.equal(Object.hasOwn(result.fields, 'title'), false);
  assert.equal(result.content, 'text');
});

test('rejects malformed metadata, empty content and oversized bodies', () => {
  for (const source of ['---\ntitle: bad', '---\ntags: nope\n---\ntext', '---\ntitle: [x]\n---\ntext', '---\ntitle: x\n---\n', 'x'.repeat(500_001)]) {
    assert.throws(() => parseMarkdownImport(source));
  }
});
