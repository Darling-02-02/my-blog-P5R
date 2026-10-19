// 构建期把 src/content/notes.json 固化进来。
//
// 解析失败只回退空内容 + 留一条 console.error：单块文案坏掉不许把整站拖白
// （`trans.md` 那次白屏就是模块初始化时抛错导致的）。真正拦人的是构建期校验：
// scripts/validate-content.mjs，CI 里在 npm run build 之前会跑它。
// 回退成空内容是安全方向：页面会退化成一句空态提示，而不是碎掉。
import raw from '../content/notes.json?raw';
import { defaultNotesContent, parseNotesDocument } from '../lib/notes-content';

export const notes: string = (() => {
  try {
    return parseNotesDocument(raw).notes;
  } catch (error) {
    console.error('[notes] 碎碎念配置解析失败，已回退为空内容：', error);
    return defaultNotesContent.notes;
  }
})();
