// 构建期把 src/content/myself.json 固化进来（后台提交后由 GitHub Actions 重新构建生效）。
//
// 解析失败只回退默认文案 + 留一条 console.error：单条文案坏掉不许把整站拖白
// （`trans.md` 那次白屏就是模块初始化时抛错导致的）。真正拦人的是构建期校验：
// scripts/validate-content.mjs，CI 里在 npm run build 之前会跑它。
import raw from '../content/myself.json?raw';
import { defaultMyselfContent, parseMyselfDocument } from '../lib/myself-content';

export const myselfContent = (() => {
  try {
    return parseMyselfDocument(raw);
  } catch (error) {
    console.error('[myself] 个人简介配置解析失败，已回退默认文案：', error);
    return defaultMyselfContent;
  }
})();
