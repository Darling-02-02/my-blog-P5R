// 职责：/about 页面的静态文案数据（区块内容与引言），不含任何展示逻辑

export type AboutMeSection = {
  title: string;
  icon: string;
  content?: { label: string; value: string; link: string }[];
  list?: string[];
  skills?: { name: string; level: number }[];
  links?: { name: string; url: string; desc: string }[];
};

export const aboutMeContent: AboutMeSection[] = [
  {
    title: '母校',
    icon: '🎓',
    content: [
      { label: '高中', value: '某某中学', link: '' },
      { label: '大学', value: '某某大学（生物信息学）', link: '' },
    ],
  },
  {
    title: '兴趣爱好',
    icon: '🎮',
    list: [
      '编程，代码让我欲罢不能',
      '学习，探索未知的领域',
      '运动，保持健康的身体',
      '游戏，偶尔放松一下',
      '阅读，拓宽视野',
    ],
  },
  {
    title: '技能树',
    icon: '⚡',
    skills: [
      { name: 'Python', level: 90 },
      { name: 'R', level: 85 },
      { name: 'Linux', level: 80 },
      { name: '生物信息学', level: 85 },
      { name: '机器学习', level: 70 },
      { name: 'Docker', level: 65 },
    ],
  },
  {
    title: '常用网站',
    icon: '🔗',
    links: [
      { name: 'GitHub', url: 'https://github.com', desc: '代码托管' },
      { name: 'Google', url: 'https://www.google.com', desc: '搜索引擎' },
      { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'AI助手' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '技术问答' },
      { name: 'Bilibili', url: 'https://www.bilibili.com', desc: '学习娱乐' },
    ],
  },
  {
    title: '近期动态',
    icon: '📢',
    list: [
      '持续更新博客中...',
      '学习三维重建技术',
      '探索单细胞测序分析',
      '准备新项目开发',
    ],
  },
];

export const aboutMeQuotes = [
  '人生是旷野，不是轨道',
  'Stay hungry, stay foolish',
  '代码改变世界',
];
