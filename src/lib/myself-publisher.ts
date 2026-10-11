// 后台读写个人简介配置：整份 src/content/myself.json 一起提交。
//
// 和栏目表（category-publisher.ts）同一套"读整份 / 写整份"接口：并发改动交给
// Contents API 的 sha 校验拦下来，界面靠 isProfileConflict 认出冲突后重新读取再重试。
import { ArticleApiError } from './api';
import { contentsUrl, decodeBase64, encodeBase64, getFile, request } from './github';
import { parseMyselfDocument, serializeMyselfDocument } from './myself-content';
import type { MyselfContent } from './myself-content';

const path = 'src/content/myself.json';
const branch = 'main';

export interface MyselfSnapshot {
  content: MyselfContent;
  /** 读取那一刻的文件 sha；写回时要原样带上，对不上就说明仓库里的配置已被改过。 */
  sha: string;
}

export const myselfPublisher = {
  /** 读仓库里"正在生效"的配置（不是构建期那份），后台表单以此为准。 */
  load: async (token: string): Promise<MyselfSnapshot> => {
    const file = await getFile(token, path);
    if (!file) {
      throw new ArticleApiError(404, 'NOT_FOUND', `仓库里没有 ${path}，请先在仓库里建好这个文件再回来改文案`);
    }
    return { content: parseMyselfDocument(decodeBase64(file.content)), sha: file.sha };
  },

  // sha 必须用 load 那一刻的：写回时再重新读一次就等于放弃了并发校验，
  // 另一个窗口刚改掉的文案会被这份旧内容悄悄盖回去。
  save: async (token: string, content: MyselfContent, sha: string, message: string) => {
    try {
      const saved = await request(token, contentsUrl(path), {
        method: 'PUT',
        body: JSON.stringify({ message, content: encodeBase64(serializeMyselfDocument(content)), sha, branch }),
      });
      if (!saved) throw new Error('个人简介配置提交失败，请刷新后重试');
    } catch (error) {
      // 409/422 是 sha 对不上（或文件被删了）；后台默认文案把它当成"slug 已存在"，在这里会看不懂。
      if (error instanceof ArticleApiError && (error.status === 409 || error.status === 422)) {
        // 保留 status/code：调用方要靠它认出这是并发冲突，读回最新内容让用户重试。
        throw new ArticleApiError(error.status, 'PROFILE_CONFLICT', `仓库里的 ${path} 已经被改过（可能是另一个窗口或标签页）`);
      }
      throw error;
    }
  },
};

/** 并发冲突（仓库里的配置比手里这份新）：界面据此重新读取再让用户重试。 */
export const isProfileConflict = (error: unknown): boolean =>
  error instanceof ArticleApiError && error.code === 'PROFILE_CONFLICT';
