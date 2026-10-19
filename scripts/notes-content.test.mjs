import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNotesDocument, serializeNotesDocument } from '../src/lib/notes-content.ts';

test('空内容是合法的（这块本来就是空的，等站主补）', () => {
  assert.deepEqual(parseNotesDocument('{"notes":""}'), { notes: '' });
  assert.deepEqual(parseNotesDocument('{"notes":"   "}'), { notes: '' });
});

test('往返后内容不变', () => {
  const content = { notes: '第一段\n\n第二段' };
  assert.deepEqual(parseNotesDocument(serializeNotesDocument(content)), content);
});

test('中间的换行不会被吃掉，末尾只留一个', () => {
  const parsed = parseNotesDocument('{"notes":"甲\\n\\n乙\\n"}');
  // Markdown 的空行分隔段落，中间的 \\n\\n 必须原样留下
  assert.equal(parsed.notes, '甲\n\n乙');
  assert.equal(parsed.notes.includes('\n\n'), true);
});

test('序列化以单个换行结尾，键顺序固定', () => {
  const raw = serializeNotesDocument({ notes: '正文' });
  assert.equal(raw, '{\n  "notes": "正文"\n}\n');
  assert.equal(raw.endsWith('\n'), true);
  assert.equal(raw.endsWith('\n\n'), false);
});

test('坏输入逐个报错', () => {
  assert.throws(() => parseNotesDocument('{'), /不是合法的 JSON/);
  assert.throws(() => parseNotesDocument('[]'), /必须是一个对象/);
  assert.throws(() => parseNotesDocument('{}'), /缺少 notes 字段/);
  assert.throws(() => parseNotesDocument('{"notes":[]}'), /必须是字符串/);
  assert.throws(() => parseNotesDocument('{"notes":123}'), /必须是字符串/);
});
