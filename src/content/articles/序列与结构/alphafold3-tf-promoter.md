---
id: 23
title: "AlphaFold3 预测转录因子与启动子互作"
excerpt: "从启动子序列提取 → 转录因子筛选 → AlphaFold3 结构预测的 4 步研究流程。"
category: "序列与结构"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "AlphaFold3"
  - "转录因子"
  - "启动子"
---

> 用 AlphaFold3 预测候选转录因子蛋白与靶基因启动子 DNA 是否存在相互作用。

## 整体思路

1. 拿到**靶基因启动子 DNA 序列**（转录起始位点 TSS 上游约 2 kb）。
2. 拿到**候选转录因子的蛋白质序列**。
3. 把两者一起提交 AlphaFold3 预测复合物。

## 第一步：获取启动子区域

启动子位于转录起始位点上游约 2 kb。可用 `bedtools flank` 或直接按坐标提取：

```bash
# 已知基因 TSS 位置时，提取 TSS 上游 2kb
# bedtools flank 需要 BED 格式的 TSS 位点
bedtools flank -i tss.bed -g genome.sizes -l 2000 -r 0 -s > promoter.bed
bedtools getfasta -fi genome.fa -bed promoter.bed -fo promoter.fa
```

## 第二步：获取候选转录因子名称

通过动物转录因子数据库 **AnimalTFDB**（http://bioinfo.life.hust.edu.cn/AnimalTFDB/）检索目标家族（如 MYC 相关）的候选转录因子。

## 第三步：获取蛋白序列

通过 **UniProt**（https://www.uniprot.org/）按候选转录因子名称检索，下载 FASTA 格式蛋白序列。

## 第四步：AlphaFold3 预测

> 需要 **启动子 DNA 序列（约 2 kb）** + **转录因子蛋白序列**。

- AlphaFold3 官方服务器：https://alphafoldserver.com/
- 提交时：把转录因子蛋白序列和启动子 DNA 序列分别作为链，预测复合物结构。

## 常见问题

- **2 kb 太长**：AlphaFold3 对单链长度有限制，可分段（如每次 500 bp）或只取 TSS 上游 1 kb。
- **DNA 序列需标注类型**：提交 DNA 链时选择核酸类型，蛋白链选择蛋白类型。
