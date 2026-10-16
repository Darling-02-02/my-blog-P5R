import { categoryInputs } from './category-source';

export interface CategoryDefinition {
  name: string;
  description: string;
  color: string;
  subcategories?: string[];
}

export interface CategoryData extends CategoryDefinition {
  count: number;
}

export interface TagData {
  name: string;
  count: number;
}

// 栏目表来自 src/content/categories.json（后台「幕后栏目」页可以增删改），构建期固化在这里：
//   subcategories  -> 栏目表里的遗留字段：前台和后台都不再展示/编辑，只为了让老文件照旧解析
export const categoryDefinitions: CategoryDefinition[] = categoryInputs.map(
  ({ name, description, color, subcategories }) => ({
    name,
    description,
    color,
    ...(subcategories ? { subcategories } : {}),
  }),
);

// 没有在后台栏目表里配过色的栏目（比如只靠文章 frontmatter 自动生成的这种）用这里的兜底色。
// 原来是一组高饱和色轮流取（#f39c12 琥珀 / #8e44ad 紫 / #2ecc71 绿 / #e67e22 橙），
// 整站改黑白灰之后只剩一个中性深灰：深浅主题下都是「白字压深灰块」，两层对比都达标。
// 后台里显式配过颜色的栏目不受影响，照旧用它们各自的颜色。
const fallbackColors = ['#3f3f3f'];

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
  }));

  const configuredNames = new Set(categoryDefinitions.map((category) => category.name));
  const extra = Object.entries(counts)
    .filter(([name]) => !configuredNames.has(name))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([name, count], index) => ({
      name,
      count,
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
