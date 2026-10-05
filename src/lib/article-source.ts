// 后台的数据源：同一个界面，两种存储。
//
// 选哪个不看新配置，而是跟随 VITE_ARTICLE_SOURCE —— 站点从哪儿读，后台就往哪儿写，
// 这样"读到的和写进去的是同一份内容"这件事不需要额外约定：
//   VITE_ARTICLE_SOURCE=api     -> 站点读后端 API，后台写后端 API（有草稿/发布状态）
//   其他（默认 static）          -> 站点读构建期固化的 Markdown，后台提交到 GitHub 仓库
import { articleAdminApi, isArticleApiEnabled } from './api';
import { articlePublisher } from './github';
import type { Article, ArticleStatus } from '../../backend/src/articles/article.types';
import type { ArticleWriteInput } from './article-form';

export interface ArticleSource {
  kind: 'github' | 'api';
  /** 面板顶部的一句话说明，让用户知道"保存"到底发生了什么 */
  panelHint: string;
  tokenLabel: string;
  /** 后端有 draft/published，GitHub 提交即上线 */
  supportsDraft: boolean;
  list: (token: string) => Promise<Article[]>;
  save: (token: string, input: ArticleWriteInput, existing?: Article) => Promise<void>;
  remove: (token: string, article: Article) => Promise<void>;
  setPublished?: (token: string, article: Article, published: boolean) => Promise<void>;
}

const githubSource: ArticleSource = {
  kind: 'github',
  panelHint: '保存即提交到 GitHub 仓库，约 1 分钟后自动上线；分类直接填，新栏目会自动出现在首页（要正经管理栏目请用「🗂 幕后栏目」）',
  tokenLabel: 'GitHub Token（Fine-grained，仅本仓库 Contents 读写；只保存在当前浏览器会话）',
  supportsDraft: false,
  list: (token) => articlePublisher.list(token),
  save: (token, input, existing) => articlePublisher.save(token, input, existing?.slug),
  remove: (token, article) => articlePublisher.remove(token, article.slug),
};

const apiSource: ArticleSource = {
  kind: 'api',
  panelHint: '保存即写入后端数据库；新文章先存为草稿，点「发布」后才会出现在公开接口里',
  tokenLabel: '后端管理令牌（ADMIN_TOKEN；只保存在当前浏览器会话）',
  supportsDraft: true,
  list: async (token) => (await articleAdminApi.list(token)).items,
  save: async (token, input, existing) => {
    // 带上当前状态：后端 update 缺省成 draft，漏传会把已发布的文章下架。
    const status: ArticleStatus = existing?.status ?? 'draft';
    const payload = { ...input, status };

    if (existing) await articleAdminApi.update(token, existing.id, payload);
    else await articleAdminApi.create(token, payload);
  },
  remove: async (token, article) => {
    await articleAdminApi.remove(token, article.id);
  },
  setPublished: async (token, article, published) => {
    await articleAdminApi.setPublished(token, article.id, published);
  },
};

export const activeArticleSource: ArticleSource = isArticleApiEnabled ? apiSource : githubSource;
