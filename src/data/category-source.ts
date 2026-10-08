// 构建期把 src/content/categories.json 固化进来（后台提交后由 GitHub Actions 重新构建生效）。
import raw from '../content/categories.json?raw';
import { parseCategoryDocument } from '../lib/category-content';
import type { CategoryInput } from '../lib/category-content';

export type { CategoryInput } from '../lib/category-content';

export const categoryInputs: CategoryInput[] = parseCategoryDocument(raw);
