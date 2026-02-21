export interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

export const articles: Article[] = [
  {
    id: 1,
    title: '生物信息',
    excerpt: '生物信息学相关知识与技术分析',
    category: '生物信息',
    date: '2026-02-15',
    readTime: '10 分钟',
    tags: ['生物信息', 'RNA-seq', '单细胞'],
    content: `# 生物信息

## 研究方向

- **转录组分析**：RNA-seq、差异表达分析
- **基因组学**：SNP calling、变异检测
- **单细胞测序**：scRNA-seq 数据分析
- **系统发育**：进化树构建与分析

## 常用工具

| 工具 | 用途 |
|------|------|
| HISAT2 | 序列比对 |
| featureCounts | 基因定量 |
| Seurat | 单细胞分析 |
| GATK | 变异检测 |

## 学习资源

1. **生信技能树** - 优秀的中文教程
2. **Biostars** - 生信问答社区
3. **Nature Methods** - 前沿方法论文

---

*持续更新中...*`,
  },
  {
    id: 2,
    title: '三维重建',
    excerpt: '3D重建技术与计算机视觉',
    category: '三维重建',
    date: '2026-02-10',
    readTime: '10 分钟',
    tags: ['三维重建', 'NeRF', '点云'],
    content: `# 三维重建

## 技术方向

- **NeRF**：神经辐射场，从2D生成3D
- **摄影测量**：多视角立体匹配
- **点云处理**：配准、分割、重建

## 常用软件

| 软件 | 功能 |
|------|------|
| Nerfstudio | NeRF训练框架 |
| CloudCompare | 点云处理 |
| Metashape | 摄影测量 |
| Open3D | Python点云库 |

## 应用场景

- 文物数字化保护
- 建筑测量建模
- VR/AR场景创建
- 医学影像重建

---

*持续更新中...*`,
  },
  {
    id: 3,
    title: '机器学习',
    excerpt: 'ML工程实践与模型部署',
    category: '机器学习',
    date: '2026-02-05',
    readTime: '10 分钟',
    tags: ['机器学习', 'MLOps', 'Pipeline'],
    content: `# 机器学习

## 项目流程

1. **问题定义** → 明确目标
2. **数据收集** → 获取数据
3. **特征工程** → 提取特征
4. **模型训练** → 调参优化
5. **模型部署** → 上线服务

## 常用框架

| 框架 | 用途 |
|------|------|
| scikit-learn | 传统ML |
| PyTorch | 深度学习 |
| XGBoost | 梯度提升 |
| FastAPI | 模型部署 |

## 最佳实践

- 使用 **Git** 管理代码
- 使用 **DVC** 管理数据
- 使用 **MLflow** 追踪实验
- 使用 **Docker** 容器化部署

---

*持续更新中...*`,
  },
  {
    id: 4,
    title: '随笔',
    excerpt: '日常思考、生活感悟',
    category: '随笔',
    date: '2026-01-10',
    readTime: '3 分钟',
    tags: ['随笔', '思考'],
    content: `# 随笔

## 关于学习

学习是一个不断迭代的过程。

> 真正的掌握来自于应用。

## 关于技术

技术本身不是目的，解决问题才是。

- **简单**：易于理解
- **可靠**：稳定运行
- **高效**：节省时间

## 关于分享

写博客是整理思路的过程：

1. 加深理解
2. 建立连接
3. 记录成长

---

*保持好奇，保持学习，保持分享。*`,
  },
];
