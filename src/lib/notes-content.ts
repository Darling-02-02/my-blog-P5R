// 「一些碎碎念」文案，唯一数据源：src/content/notes.json。
//
// 和栏目表（src/lib/category-content.ts）、个人简介（src/lib/myself-content.ts）同一套约定：
// 站点在构建期把这份 JSON 编译进来（见 src/data/notes.ts），两边都走这里的解析/序列化，
// 避免出现第二套约定。这个模块刻意保持"纯函数"（不 import Vite 专有的 ?raw / import.meta），
// 这样 node 脚本（scripts/validate-content.mjs、scripts/notes-content.test.mjs）能直接 import 做校验。

export interface NotesContent {
  /** 「一些碎碎念」的 Markdown 正文 */
  notes: string;
}

/** 读不到/坏了时的兜底。这里空串就是合法值 —— 见下面 parseNotesDocument 的说明。 */
export const defaultNotesContent: NotesContent = { notes: '' };

/** 收尾：削掉首尾空白，再削掉末尾的一个换行。
 *  不能直接用 .trim()——它连**中间**的换行也一起吃掉，而 Markdown 的空行分隔段落
 *  是正文的一部分（跟 myself-content.ts 里那条同样的坑）。
 *  末尾那个换行单独削：serializeNotesDocument 会补上文件结尾应有的那一个，
 *  不削的话每保存一次就多出一个空行。 */
export const normalizeNotes = (value: string) => value.trim().replace(/\n$/, '');

/** 解析碎碎念配置。
 *
 *  与其他内容文件唯一的区别：**notes 允许为空字符串**。
 *  这块本来就是"现在要求是空的、站主后面补充"，用 myself-content 那套 requireText（拒绝空）
 *  会让空态直接变成构建期报错。所以这里只校验类型，不校验非空。
 *  类型仍然严格：写错类型（比如写成数组）要立刻暴露，而不是静默变成空段落。 */
export const parseNotesDocument = (raw: string): NotesContent => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`碎碎念配置不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('碎碎念配置必须是一个对象，形如 { "notes": "正文" }');
  }

  const value = (parsed as Record<string, unknown>).notes;
  if (value === undefined) throw new Error('碎碎念配置缺少 notes 字段');
  if (typeof value !== 'string') throw new Error('notes 必须是字符串（Markdown 正文）');

  return { notes: normalizeNotes(value) };
};

/** 键顺序固定，让每次提交的 diff 只反映真实改动。 */
export const serializeNotesDocument = (content: NotesContent) =>
  `${JSON.stringify({ notes: normalizeNotes(content.notes) }, null, 2)}\n`;
