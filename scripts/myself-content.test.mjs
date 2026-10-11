// 个人简介配置（src/content/myself.json）的解析规则。
//
// 这里刻意不把文件内容断言成某个具体字符串：那条文案就是给后台改的，
// 断言死等于让用户每改一次就得改测试。只钉住"文件合法、能解析出非空文案"和"坏输入必须抛错"。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  defaultMyselfContent,
  parseMyselfDocument,
  serializeMyselfDocument,
} from '../src/lib/myself-content.ts';

test('the shipped myself.json parses into a non-empty line', () => {
  const shipped = readFileSync(path.join(process.cwd(), 'src', 'content', 'myself.json'), 'utf8');
  const content = parseMyselfDocument(shipped);
  assert.ok(content.mystic.length > 0, '「神秘力量」文案不能是空的');
});

test('the fallback used when parsing fails still renders something', () => {
  assert.ok(defaultMyselfContent.mystic.trim().length > 0);
});

test('serialize → parse round-trips without changing the text', () => {
  const content = { mystic: '万事顺遂，毫无蹉跎～' };
  const text = serializeMyselfDocument(content);
  assert.deepEqual(parseMyselfDocument(text), content);
  assert.match(text, /\n$/, '提交上去的文件要以换行结尾');
});

test('缺字段、空白、非字符串、结构不对都抛中文错，而不是静默变成空段落', () => {
  const bad = [
    '{}',                          // 缺 mystic
    '{"mystic":""}',               // 空字符串
    '{"mystic":"   "}',            // 只有空白
    '{"mystic":123}',              // 不是字符串
    '[]',                          // 不是对象
    '"Ciallo"',                    // 顶层的字符串
    '{',                           // 不是合法 JSON
  ];
  for (const raw of bad) {
    assert.throws(() => parseMyselfDocument(raw), /神秘力量|个人简介配置/, `应该拒绝：${raw}`);
  }
});
