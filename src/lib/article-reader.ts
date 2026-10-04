// 读路径的数据源：和写路径（article-source.ts）一样，只有这一处决定内容从哪儿来。
//
// 上下文层只依赖下面的接口，自己不再判环境变量、也不再直接 import 构建期内容，
// 于是"后端不可用时回退到构建期 Markdown"这件事只发生在这里一次。
import { articleApi, ArticleApiError, isArticleApiEnabled } from './api';
import { articles as staticArticles, findArticle } from '../data/articles';
import type { Article, ArticleSummary } from '../../backend/src/articles/article.types';

export type ArticleReadStatus = 'loading' | 'ready' | 'error';

export interface ArticleReadResult {
  items: ArticleSummary[];
  /** 有值表示走了回退：后端读不到，用构建期内容顶上，界面需要提示 */
  error?: string;
}

export interface ArticleReadPayload {
  article?: Article;
  error?: string;
}

export interface ArticleReader {
  /** 首屏就能用的内容，静态来源因此不会闪一下加载态 */
  initial: ArticleSummary[];
  initialStatus: ArticleReadStatus;
  /** 静态来源是同步数据，只有异步来源才需要显示"加载中" */
  loadsAsync: boolean;
  list: () => Promise<ArticleReadResult>;
  find: (articleKey: string | undefined) => Promise<ArticleReadPayload>;
  /** 先用列表里的摘要撑住首屏，正文随后替换（仅异步来源需要） */
  preview?: (summary: ArticleSummary) => Article;
}

export const getErrorMessage = (error: unknown) => {
  if (error instanceof ArticleApiError) return error.message;
  if (error instanceof Error) return error.message;
  return '文章加载失败';
};

const staticReader: ArticleReader = {
  initial: staticArticles,
  initialStatus: 'ready',
  loadsAsync: false,
  list: async () => ({ items: staticArticles }),
  find: async (articleKey) => ({ article: findArticle(articleKey) }),
};

const apiReader: ArticleReader = {
  initial: [],
  initialStatus: 'loading',
  loadsAsync: true,
  list: async () => {
    try {
      const response = await articleApi.listAllPublished();
      return { items: response.items };
    } catch (requestError) {
      return { items: staticArticles, error: getErrorMessage(requestError) };
    }
  },
  find: async (articleKey) => {
    const decodedKey = decodeURIComponent(articleKey ?? '');
    if (!decodedKey) return { article: undefined };

    try {
      return { article: await articleApi.findPublishedBySlug(decodedKey) };
    } catch (requestError) {
      // 后端明确说没有 = 文章不存在；其他错误才回退到构建期内容并提示
      if (requestError instanceof ArticleApiError && requestError.status === 404) {
        return { article: undefined };
      }
      return { article: findArticle(articleKey), error: getErrorMessage(requestError) };
    }
  },
  preview: (summary) => ({ ...summary, content: '' }),
};

export const activeArticleReader: ArticleReader = isArticleApiEnabled ? apiReader : staticReader;
