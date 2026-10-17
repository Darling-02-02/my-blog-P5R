// 个人简介页（/myself）里那些「后台能改」的文案，唯一数据源：src/content/myself.json。
//
// 和栏目表（src/lib/category-content.ts）同一套约定：站点在构建期把这份 JSON 编译进来
// （见 src/data/myself.ts），后台用 GitHub Contents API 读写同一份文件，两边都走这里的
// 解析/序列化，避免出现第二套约定。
// 这个模块刻意保持"纯函数"（不 import Vite 专有的 ?raw / import.meta），
// 这样 node 脚本（scripts/validate-content.mjs、scripts/myself-content.test.mjs）能直接 import 做校验。

export interface MyselfContent {
  /** 「🔮 神秘力量」那段文案 */
  mystic: string;
}

/** 仓库里的配置读不到/坏了时的兜底，保证页面永远有东西显示。 */
export const defaultMyselfContent: MyselfContent = {
  mystic: 'Ciallo～(∠・ω< )⌒★',
};

/** 收尾：削掉首尾空白，再削掉末尾的一个换行
 *  不能直接用 .trim()——它连**中间**的换行也一起吃掉，而后台多行输入框里敲的回车
 *  是要显示出来的（/myself 那段靠 white-space: pre-line 渲染）。
 *  末尾那个换行单独削：serializeMyselfDocument 会补上文件结尾应有的那一个，
 *  不削的话每保存一次就多出一个空行。 */
export const normalizeText = (value: string) => value.trim().replace(/\n$/, '');

const requireText = (value: unknown, label: string) => {
  const text = typeof value === 'string' ? normalizeText(value) : '';
  if (!text) throw new Error(`${label}不能为空`);
  return text;
};

/** 解析个人简介配置；任何一处不合法就抛中文错，让构建/后台立刻暴露，而不是静默变成空白段落。 */
export const parseMyselfDocument = (raw: string): MyselfContent => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`个人简介配置不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('个人简介配置必须是一个对象');
  }

  return { mystic: requireText((parsed as Record<string, unknown>).mystic, '「神秘力量」文案') };
};

/** 键顺序固定，让后台每次提交的 diff 只反映真实改动。 */
export const serializeMyselfDocument = (content: MyselfContent) =>
  `${JSON.stringify({ mystic: content.mystic }, null, 2)}\n`;
