export interface CategoryDefinition {
  name: string;
  description: string;
  color: string;
  subcategories?: string[];
}

export interface CategoryData extends CategoryDefinition {
  count: number;
}

export const bioinformaticsSubcategories = [
  '转录组',
  '代谢组',
  '蛋白组',
  '网络药理学',
  'lncRNA',
  'ScRNA-seq',
  '线粒体',
  '比较基因组',
  'meta分析',
];

export const reconstructionSubcategories = [
  '单帧作物点云数据处理流程',
  'MVS(多视角重建)',
  '开源算法总结和使用',
];

export const categoryDefinitions: CategoryDefinition[] = [
  {
    name: '生物信息',
    description: '转录组、代谢组、蛋白组等生信专题整理',
    color: '#ff6b6b',
    subcategories: bioinformaticsSubcategories,
  },
  {
    name: '三维重建',
    description: '点云处理、多视角重建和开源算法学习记录',
    color: '#4ecdc4',
    subcategories: reconstructionSubcategories,
  },
  {
    name: '机器学习',
    description: '模型训练、数据处理、工程实践和实验复盘',
    color: '#45b7d1',
  },
  {
    name: '随笔',
    description: '学习复盘、生活记录和一些不太正经的想法',
    color: '#96ceb4',
  },
];

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
