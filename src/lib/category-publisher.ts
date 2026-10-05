// 后台读写幕后栏目表：整份 src/content/categories.json 一起提交。
//
// 栏目之间共享顺序、颜色这些约定，局部改动很容易和仓库里的实际情况脱节，
// 所以这里的接口就是"读整表 / 写整表"，并发改动交给 Contents API 的 sha 校验拦下来。
import { ArticleApiError } from './api';
import { contentsUrl, decodeBase64, encodeBase64, getFile, request } from './github';
import { parseCategoryDocument, serializeCategoryDocument } from './category-content';
import type { CategoryInput } from './category-content';

const path = 'src/content/categories.json';
const branch = 'main';

export interface CategorySnapshot {
  categories: CategoryInput[];
  /** 读取那一刻的文件 sha；写回时要原样带上，对不上就说明仓库里的表已被改过。 */
  sha: string;
}

const read = async (token: string): Promise<CategorySnapshot> => {
  const file = await getFile(token, path);
  if (!file) {
    throw new ArticleApiError(404, 'NOT_FOUND', `仓库里没有 ${path}，请先在仓库里建一个内容为 [] 的文件，再回来管理栏目`);
  }
  return { categories: parseCategoryDocument(decodeBase64(file.content)), sha: file.sha };
};

export const categoryPublisher = {
  /** 读仓库里"正在生效"的栏目表（不是构建期那份），后台列表以此为准。 */
  load: async (token: string): Promise<CategorySnapshot> => read(token),

  // sha 必须用 load 那一刻的：写回时再重新读一次 sha 就等于放弃了并发校验，
  // 另一个窗口刚删掉的栏目会被这份旧列表悄悄写回来。
  save: async (token: string, categories: CategoryInput[], sha: string, message: string) => {
    try {
      const saved = await request(token, contentsUrl(path), {
        method: 'PUT',
        body: JSON.stringify({ message, content: encodeBase64(serializeCategoryDocument(categories)), sha, branch }),
      });
      if (!saved) throw new Error('栏目配置提交失败，请刷新后重试');
    } catch (error) {
      // 409/422 是 sha 对不上（或文件被删了）；后台默认文案把它当成"slug 已存在"，在栏目这里会看不懂。
      if (error instanceof ArticleApiError && (error.status === 409 || error.status === 422)) {
        throw new Error(`仓库里的 ${path} 已经被改过（可能是另一个窗口或标签页），请刷新页面重新读取后再提交`);
      }
      throw error;
    }
  },
};
