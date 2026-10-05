// 幕后栏目的唯一数据源：src/content/categories.json。
//
// 站点在构建期把这份 JSON 编译进来（见 src/data/category-source.ts），后台用
// GitHub Contents API 读写同一份文件，两边都走这里的解析/序列化，避免出现第二套约定。
// 这个模块刻意保持"纯函数"（不 import Vite 专有的 ?raw / import.meta），
// 这样 node 脚本（scripts/validate-content.mjs、scripts/category-content.test.mjs）能直接 import 做校验。

export interface CategoryInput {
  /** 栏目名：首页卡片标题、路由 /category/<name> 的一段 */
  name: string;
  /** 卡片上的一句话简介 */
  description: string;
  /** #rrggbb */
  color: string;
  /** 专题目录：src/content/topics/<dir>。有目录 = 该栏目用专题组织（机器学习/后端/随笔那种） */
  dir?: string;
  /** 子专题清单：纯分类栏目用（生物信息/三维重建那种） */
  subcategories?: string[];
}

export const categoryDirPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorPattern = /^#[0-9a-fA-F]{6}$/;

const requireText = (value: unknown, label: string) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(`${label}不能为空`);
  if (/[\r\n]/.test(text)) throw new Error(`${label}不能包含换行`);
  return text;
};

const optionalText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** 解析栏目表；任何一处不合法就抛错，让构建/后台立刻暴露问题，而不是静默少一个栏目。 */
export const parseCategoryDocument = (raw: string): CategoryInput[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`栏目配置不是合法的 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('栏目配置必须是一个数组');

  const names = new Set<string>();
  const dirs = new Set<string>();

  return parsed.map((entry, index) => {
    const label = `第 ${index + 1} 个栏目的`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`第 ${index + 1} 个栏目必须是一个对象`);
    const record = entry as Record<string, unknown>;

    const name = requireText(record.name, `${label}名称`);
    if (names.has(name)) throw new Error(`栏目名称重复：${name}`);
    names.add(name);

    const color = requireText(record.color, `栏目「${name}」的颜色`);
    if (!colorPattern.test(color)) throw new Error(`栏目「${name}」的颜色必须是 #rrggbb 形式`);

    const dir = optionalText(record.dir);
    if (dir) {
      if (!categoryDirPattern.test(dir)) throw new Error(`栏目「${name}」的专题目录只能包含小写字母、数字和连字符`);
      if (dirs.has(dir)) throw new Error(`专题目录重复：${dir}`);
      dirs.add(dir);
    }

    const rawSubcategories = record.subcategories ?? [];
    if (!Array.isArray(rawSubcategories)) throw new Error(`栏目「${name}」的子专题清单必须是数组`);
    const subcategories = rawSubcategories.map((item, subIndex) => requireText(item, `栏目「${name}」第 ${subIndex + 1} 个子专题的`));
    if (new Set(subcategories).size !== subcategories.length) throw new Error(`栏目「${name}」的子专题清单有重复项`);

    return {
      name,
      description: optionalText(record.description),
      color,
      ...(dir ? { dir } : {}),
      ...(subcategories.length ? { subcategories } : {}),
    };
  });
};

/** 按键顺序固定，让后台每次提交的 diff 只反映真实改动。 */
export const serializeCategoryDocument = (categories: CategoryInput[]) =>
  `${JSON.stringify(
    categories.map(({ name, description, color, dir, subcategories }) => ({
      name,
      description,
      color,
      ...(dir ? { dir } : {}),
      ...(subcategories?.length ? { subcategories } : {}),
    })),
    null,
    2,
  )}\n`;

/** 栏目名 -> 专题目录：站点用它把 src/content/topics/<dir> 还原成中文栏目名，后台用它拼发布路径。 */
export const topicDirectoriesFrom = (categories: CategoryInput[]): Record<string, string> =>
  Object.fromEntries(categories.flatMap((category) => (category.dir ? [[category.name, category.dir] as const] : [])));

// 后台表单改的是"整张表"，下面三个是纯函数，改完再交给 parseCategoryDocument 校验，
// 这样"插入/替换/删除/排序"这些容易出错的地方可以单独跑测试。

/** 新建（previousName 为空）时追加到末尾，编辑时按旧名字替换，顺序保持不变。 */
export const upsertCategory = (categories: CategoryInput[], next: CategoryInput, previousName?: string | null): CategoryInput[] =>
  previousName ? categories.map((item) => (item.name === previousName ? next : item)) : [...categories, next];

export const removeCategory = (categories: CategoryInput[], name: string): CategoryInput[] =>
  categories.filter((item) => item.name !== name);

/** index 处的栏目上下移动一格；越界就原样返回。 */
export const moveCategory = (categories: CategoryInput[], index: number, delta: number): CategoryInput[] => {
  const target = index + delta;
  if (target < 0 || target >= categories.length) return categories;
  const list = [...categories];
  [list[index], list[target]] = [list[target], list[index]];
  return list;
};
