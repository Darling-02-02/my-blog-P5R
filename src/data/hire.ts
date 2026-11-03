// 构建期把 src/content/hire.json 固化进来（改文案只改 JSON，不动组件）。
//
// 解析失败只回退默认值 + 一条 console.error：单块内容坏掉不许把整站拖白
// （PRODUCT.md 约束 #4）。真正拦人的是 scripts/validate-content.mjs，CI 在 build 之前跑它。
import raw from '../content/hire.json?raw';
import { defaultHireContent, parseHireDocument } from '../lib/hire-content';

export const hireContent = (() => {
  try {
    return parseHireDocument(raw);
  } catch (error) {
    console.error('[hire] 接单页配置解析失败，已回退默认文案：', error);
    return defaultHireContent;
  }
})();
