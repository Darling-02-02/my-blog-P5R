// 接单页文案解析：坏了要能报出坏在哪，而不是让 /hire 变成空壳（那是唯一收单入口）。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseHireDocument } from '../src/lib/hire-content.ts';

const realJson = readFileSync(new URL('../src/content/hire.json', import.meta.url), 'utf8');

test('仓库里的 hire.json 能正常解析，服务与流程非空', () => {
  const content = parseHireDocument(realJson);
  assert.ok(content.services.length >= 4);
  assert.ok(content.process.length >= 3);
  assert.match(content.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
});

test('坏 JSON 抛中文错误', () => {
  assert.throws(() => parseHireDocument('{ 不是 json'), /JSON|json/);
});

test('缺 headline / intro 这类必填文案要报出来', () => {
  const broken = JSON.parse(realJson);
  delete broken.headline;
  assert.throws(() => parseHireDocument(JSON.stringify(broken)), /headline|标题|主标题/);
});

test('services 里漏 title 会指到具体位置', () => {
  const broken = JSON.parse(realJson);
  broken.services[0] = { desc: '没有标题', items: [] };
  assert.throws(() => parseHireDocument(JSON.stringify(broken)), /services|服务/);
});

test('邮箱写错要拦住（页面上的兜底联系方式不能是坏值）', () => {
  const broken = JSON.parse(realJson);
  broken.email = 'not-an-email';
  assert.throws(() => parseHireDocument(JSON.stringify(broken)), /邮箱|email/);
});
