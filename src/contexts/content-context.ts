// 站点内容和它的纯函数都从这里取：组件不再直接 import src/data/*，
// 于是"内容从哪来"以后换成异步或其他实现时，不必挨个改组件。
//
// 名字刻意跟 src/data 层保持一致（getXXX），调用点因此只需要换 import 一行。
import { createContext } from 'react';
import type { CategoryData, TagData } from '../data/categories';
import type { Article } from '../../backend/src/articles/article.types';

export interface ContentContextValue {
  getArticlePath: (article: Pick<Article, 'slug'>) => string;
  getCategoryData: (items: Array<{ category: string }>) => CategoryData[];
  getTagData: (items: Array<{ tags: string[] }>) => TagData[];
}

export const ContentContext = createContext<ContentContextValue | null>(null);

export type { CategoryData, TagData };
