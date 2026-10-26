// /opc 中转站反代的两条纯逻辑：路径映射和 Location 回写。
// Function 本身跑在 Cloudflare 上（本地跑不起来），所以把容易写错的部分拆出来单独钉住。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveProxyUrl, rewriteLocation } from '../functions/opc/[[path]].ts';

test('/opc 前缀被剥掉，查询串和子路径原样透传', () => {
  assert.equal(
    resolveProxyUrl('https://darling-02.cn/opc/docs/req.md?raw=1', 'https://router.example.com'),
    'https://router.example.com/docs/req.md?raw=1',
  );
  // 根路径（/opc 或 /opc/）落到上游的 /
  assert.equal(resolveProxyUrl('https://darling-02.cn/opc', 'https://router.example.com'), 'https://router.example.com/');
  assert.equal(resolveProxyUrl('https://darling-02.cn/opc/', 'https://router.example.com'), 'https://router.example.com/');
});

test('源站自带子路径时保留它', () => {
  assert.equal(
    resolveProxyUrl('https://darling-02.cn/opc/a', 'https://router.example.com/opc-app'),
    'https://router.example.com/opc-app/a',
  );
  // 源站地址结尾带斜杠也不会拼出 //
  assert.equal(
    resolveProxyUrl('https://darling-02.cn/opc/a', 'https://router.example.com/opc-app/'),
    'https://router.example.com/opc-app/a',
  );
});

test('指回源站的 Location 换成本站 /opc，外站地址不动', () => {
  const requestUrl = 'https://darling-02.cn/opc/login';
  const origin = 'https://router.example.com';
  assert.equal(rewriteLocation('https://router.example.com/dashboard', requestUrl, origin), '/opc/dashboard');
  assert.equal(rewriteLocation('/dashboard?x=1#top', requestUrl, origin), '/opc/dashboard?x=1#top');
  assert.equal(rewriteLocation('https://www.opc.community/china', requestUrl, origin), 'https://www.opc.community/china');
});
