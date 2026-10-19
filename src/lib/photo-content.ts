// 照片清单的唯一数据源：src/content/photos.json。
//
// 站点在构建期把这份 JSON 编译进来（见 src/data/photos.ts），后台或手动编辑都改同一个文件。
// 这个模块刻意保持"纯函数"（不 import Vite 专有的 ?raw / import.meta），
// 这样 node 脚本（scripts/validate-content.mjs、scripts/photo-content.test.mjs）能直接 import 做校验。
// 与 src/lib/category-content.ts、src/lib/myself-content.ts 是同一套约定。

export interface PhotoInput {
  /** public/ 下的绝对路径，例如 /gallery/2026-10-17-01.jpg；也允许完整 http(s) 外链 */
  src: string;
  /** 照片标题，同时用作 <img alt> —— alt 是内容的一部分，不是装饰 */
  title: string;
  /** 拍摄日期，YYYY-MM-DD，可选 */
  date?: string;
  /** 图注，可选 */
  caption?: string;
}

// 日期只收 YYYY-MM-DD：其它格式（10/17/2026、2026年10月17日）在排序时会静默变成 NaN，
// 与其让它悄悄坏掉，不如在构建期直接拦下来。
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const requireText = (value: unknown, label: string) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(`${label}不能为空`);
  if (/[\r\n]/.test(text)) throw new Error(`${label}不能包含换行`);
  return text;
};

const optionalText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** 解析照片清单；任何一处不合法就抛错，让构建立刻暴露问题，而不是静默少一张照片。 */
export const parsePhotoDocument = (raw: string): PhotoInput[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`照片清单不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('照片清单必须是一个数组（没有照片时写 []）');

  const srcs = new Set<string>();

  return parsed.map((entry, index) => {
    const label = `第 ${index + 1} 张照片的`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`第 ${index + 1} 张照片必须是一个对象`);
    const record = entry as Record<string, unknown>;

    const src = requireText(record.src, `${label}图片路径`);
    // 本地图必须是根路径的绝对路径：写成 'gallery/a.jpg' 在 /gallery 路由下会解析成 /gallery/gallery/a.jpg，
    // 换到别的嵌套路由又变成另一个地方——这种错法在本地 dev 看不出来，只有部署后才发现。
    if (!src.startsWith('/') && !/^https?:\/\//.test(src)) {
      throw new Error(`照片「${src}」的路径必须是 / 开头的根路径（例如 /gallery/a.jpg）或 http(s) 链接`);
    }
    if (srcs.has(src)) throw new Error(`照片路径重复：${src}`);
    srcs.add(src);

    const date = optionalText(record.date);
    if (date && !datePattern.test(date)) throw new Error(`照片「${src}」的日期必须是 YYYY-MM-DD 形式，当前是「${date}」`);

    return {
      src,
      title: requireText(record.title, `${label}标题`),
      ...(date ? { date } : {}),
      ...(optionalText(record.caption) ? { caption: optionalText(record.caption) } : {}),
    };
  });
};

/** 按键顺序固定，让每次提交的 diff 只反映真实改动。 */
export const serializePhotoDocument = (photos: PhotoInput[]) =>
  `${JSON.stringify(
    photos.map(({ src, title, date, caption }) => ({
      src,
      title,
      ...(date ? { date } : {}),
      ...(caption ? { caption } : {}),
    })),
    null,
    2,
  )}\n`;
