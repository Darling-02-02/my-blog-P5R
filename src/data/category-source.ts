// 构建期把 src/content/categories.json 固化进来（后台提交后由 GitHub Actions 重新构建生效）。
//
// 单独一个模块是为了避开循环依赖：data/categories.ts 依赖 data/topics.ts，
// 而 topics.ts 也要"专题目录 -> 栏目名"这张表，所以两张方向相反的表都在这里派生，
// data/categories.ts 和 data/topics.ts 各自取用。
import raw from '../content/categories.json?raw';
import { parseCategoryDocument, topicDirectoriesFrom } from '../lib/category-content';
import type { CategoryInput } from '../lib/category-content';

export type { CategoryInput } from '../lib/category-content';

export const categoryInputs: CategoryInput[] = parseCategoryDocument(raw);

/** 栏目名 -> 专题目录 */
export const topicDirectories: Record<string, string> = topicDirectoriesFrom(categoryInputs);

/** 专题目录 -> 栏目名 */
export const categoryByDirectory: Record<string, string> = Object.fromEntries(
  Object.entries(topicDirectories).map(([name, dir]) => [dir, name]),
);
