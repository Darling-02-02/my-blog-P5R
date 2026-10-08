import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { getArticlePath } from '../data/articles';
import { getCategoryData, getTagData } from '../data/categories';
import { ContentContext } from './content-context';

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  // 内容现在是构建期固化的，所以这层值永远不会变；等哪天真要异步拉取，
  // 组件那边也不需要动。
  const value = useMemo(
    () => ({
      getArticlePath,
      getCategoryData,
      getTagData,
    }),
    [],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};
