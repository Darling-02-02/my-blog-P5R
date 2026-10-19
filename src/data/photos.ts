// 构建期把 src/content/photos.json 固化进来。
//
// 解析失败只回退空清单 + 留一条 console.error：照片清单坏掉不许把整站拖白
// （`trans.md` 那次白屏就是模块初始化时抛错导致的）。真正拦人的是构建期校验：
// scripts/validate-content.mjs，CI 里在 npm run build 之前会跑它。
// 回退成空清单是安全方向：页面会退化成占位卡与说明文案，而不是碎图。
import raw from '../content/photos.json?raw';
import { parsePhotoDocument, type PhotoInput } from '../lib/photo-content';

export type Photo = PhotoInput;

export const photos: Photo[] = (() => {
  try {
    return parsePhotoDocument(raw);
  } catch (error) {
    console.error('[photos] 照片清单解析失败，已回退为空清单：', error);
    return [];
  }
})();
