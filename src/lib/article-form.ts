// 后台编辑器表单的值：用户填完但还没决定发布状态（那是后端存储才有的事）。
// 字段不再本地重抄一遍，而是从唯一那份 API 契约里 omit+收紧，
// 这样后端加字段时这里会自动跟上，不会再出现两边漂移。
import type { ArticleWritePayload } from '../../backend/src/articles/article.types';

/** subcategory 一定给值：编辑器留空时提交空串，后端和 GitHub 前端的序列化都按“空即不写”处理。 */
export type ArticleWriteInput = Omit<ArticleWritePayload, 'status' | 'subcategory'> & {
  subcategory: string;
};
