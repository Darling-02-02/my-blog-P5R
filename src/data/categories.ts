import { categoryInputs } from './category-source';
import { getTopicCountByCategory } from './topics';

export interface CategoryDefinition {
  name: string;
  description: string;
  color: string;
  subcategories?: string[];
  usesTopics?: boolean;
}

export interface CategoryData extends CategoryDefinition {
  count: number;
  topicCount: number;
}

export interface TagData {
  name: string;
  count: number;
}

// 栏目表来自 src/content/categories.json（后台「幕后栏目」页可以增删改），构建期固化在这里：
//   dir            -> 用专题目录组织（src/content/topics/<dir>），首页卡片显示"N 个专题"
//   subcategories  -> 栏目表里的遗留字段：前台和后台都不再展示/编辑，只为了让老文件照旧解析
//   usesTopics 是给组件用的派生字段，不写进 JSON。
export const categoryDefinitions: CategoryDefinition[] = categoryInputs.map(
  ({ name, description, color, dir, subcategories }) => ({
    name,
    description,
    color,
    ...(subcategories ? { subcategories } : {}),
    ...(dir ? { usesTopics: true } : {}),
  }),
);

const fallbackColors = ['#f39c12', '#8e44ad', '#2ecc71', '#e67e22'];

export const getCategoryDefinition = (name: string) =>
  categoryDefinitions.find((category) => category.name === name);

export const getCategoryData = (items: Array<{ category: string }>): CategoryData[] => {
  const counts = items.reduce<Record<string, number>>((acc, article) => {
    acc[article.category] = (acc[article.category] ?? 0) + 1;
    return acc;
  }, {});

  const configured = categoryDefinitions.map((category) => ({
    ...category,
    count: counts[category.name] ?? 0,
    topicCount: getTopicCountByCategory(category.name),
  }));

  const configuredNames = new Set(categoryDefinitions.map((category) => category.name));
  const extra = Object.entries(counts)
    .filter(([name]) => !configuredNames.has(name))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([name, count], index) => ({
      name,
      count,
      topicCount: 0,
      description: '进入该栏目查看全部文章',
      color: fallbackColors[index % fallbackColors.length],
    }));

  return [...configured, ...extra];
};

export const getTagData = (items: Array<{ tags: string[] }>): TagData[] =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, article) => {
      article.tags.forEach((tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([name, count]) => ({ name, count }));
