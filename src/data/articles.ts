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
    title: 'SNP Calling 流程',
    excerpt: 'SNP突变分析完整流程，从数据处理到变异检测',
    category: '生物信息',
    date: '2026-02-22',
    readTime: '15 分钟',
    tags: ['生物信息', 'SNP', 'GATK'],
    content: `# SNP Calling 流程

## 材料准备

- 对照基因组（已组装完毕的菌株，fasta）
- 二代测序结果文件（fastq）

## 环境要求

- Linux系统
- 软件：GATK、Trimmomatic、bwa、samtools

## 主要步骤

### 步骤1：准备文件

在新建文件夹中放入：
- 测序结果文件（fq/fastq.gz）
- 对照基因组（fasta）
- snp_calling.py 脚本

### 步骤2：修改脚本

打开 snp_calling.py，修改文件名：

\`\`\`python
file_list = [
    {'input_file': ['./sample_1.fq.gz', './sample_2.fq.gz'],
     'output_file': ['sample_1.fq.gz', 'sample_1.unpaired.fq', 'sample_2.fq.gz', 'sample_2.unpaired.fq'],
     'reference': 'reference.fasta'},
]
\`\`\`

### 步骤3：运行脚本

\`\`\`bash
python snp_calling.py
\`\`\`

### 步骤4：合并GVCF文件

\`\`\`bash
gatk CombineGVCFs -R reference.fasta -O merged.g.vcf \\
  -V sample1.gvcf -V sample2.gvcf
\`\`\`

### 步骤5：变异过滤

\`\`\`bash
gatk VariantFiltration -R reference.fasta -O filtered.vcf \\
  -V merged.vcf \\
  --filter-expression "QD < 2.0" --filter-name lowQD \\
  --filter-expression "MQ < 40.0" --filter-name lowMQ
\`\`\`

## GVCF转VCF

\`\`\`bash
gatk --java-options "-Xmx4g" GenotypeGVCFs \\
  -R reference.fasta \\
  -V merged.g.vcf \\
  -O output.vcf
\`\`\`

## 拆分SNP/InDel

\`\`\`bash
# 得到SNP
gatk SelectVariants -R reference.fasta -V output.vcf \\
  -select-type SNP -O snps.vcf

# 得到Indel
gatk SelectVariants -R reference.fasta -V output.vcf \\
  -select-type INDEL -O indels.vcf
\`\`\`

## 过滤SNP

\`\`\`bash
gatk VariantFiltration \\
    -R reference.fasta \\
    -V output.vcf \\
    --cluster-size 4 \\
    --cluster-window-size 10 \\
    --filter-expression "MQRankSum < -12.5" --filter-name lowMQRankSum \\
    --filter-expression "FS > 60.0" --filter-name highFS \\
    --filter-expression "ReadPosRankSum < -8.0" --filter-name lowReadPosRankSum \\
    --filter-expression "MQ < 40.0" --filter-name lowMQ \\
    --filter-expression "QD < 2.0" --filter-name lowQD \\
    -O final_filter.vcf
\`\`\`

## SNP建树

\`\`\`bash
# 将vcf转为phy格式
python vcf2phylip.py -i final.vcf.gz

# 运行IQtree构建进化树
iqtree -s final.min4.phy -m MFP -T 16 -B 1000
\`\`\`

## IGV可视化

1. 在IGV中打开对照基因组（Genomes → Load Genome from File）
2. 加载VCF文件（File → Load from File）
3. 选择染色体和区域查看SNP位点

> **注意**：IGV中只有灰色条带是可信的

### 颜色说明

- **深蓝色**：杂合突变
- **青绿色**：纯合突变
- **灰色**：纯合未突变

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
