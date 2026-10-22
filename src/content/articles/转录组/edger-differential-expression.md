---
id: 10
title: "edgeR 差异表达分析"
excerpt: "基于 edgeR exactTest 的差异表达分析流程，含无重复样本的 bcv 处理说明。"
category: "转录组"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "差异表达"
  - "R"
---

> 用 edgeR 的 `exactTest` 做两两比较的差异表达分析。**注意：无生物学重复时结果仅供探索，需保守设置阈值**（代码里 bcv=0.4、放宽 CPM 过滤）。完整流程（从 count 到差异基因）见 `RNA_seq_self/code.md`。

```R
getwd()
library(edgeR)

# 读取count矩阵
count_matrix <- read.table("genes_expression.countsfeature.matrix", 
                           header=TRUE, row.names=1, sep="\t")

# 放宽基因过滤条件（获取更多基因）
cpm_matrix <- cpm(count_matrix)
keep <- rowSums(cpm_matrix > 0.1) >= 1  # CPM阈值从0.5→0.1
count_matrix <- count_matrix[keep, ]

# 定义比较列表
comparison_list <- list(
  list(name = "F3892vPal389OE2", groups = c("F389", "Pal389OE2")),
  list(name = "F389vsPal389OE9", groups = c("F389", "Pal389OE9"))
)

# 设置放宽的参数
bcv <- 0.4       # 离散度保持不变（无重复实验需要保守估计）
lfc_threshold <- 1.5   # 从1.5→1.0（对应2倍变化）
fdr_threshold <- 0.05   # 从0.05→0.1

# 循环处理每个比较
for (comp in comparison_list) {
  if (!all(comp$groups %in% colnames(count_matrix))) {
    message("跳过比较: ", comp$name, " - 样本不存在")
    next
  }
  
  samples <- comp$groups
  subset_counts <- count_matrix[, samples]
  group <- factor(c(1, 2), labels = samples)
  
  y <- DGEList(counts = subset_counts, group = group)
  y <- calcNormFactors(y)
  et <- exactTest(y, dispersion = bcv^2)
  res <- topTags(et, n = Inf, adjust.method = "BH")$table
  
  # 使用放宽的阈值标记差异基因
  res$regulation <- ifelse(res$FDR < fdr_threshold & res$logFC >= lfc_threshold, "up",
                           ifelse(res$FDR < fdr_threshold & res$logFC <= -lfc_threshold, "down", 
                                  "no change"))
  
  # 保存完整结果（文件名标注lenient）
  write.csv(res, file = paste0(comp$name, "_DE_results_lenient.csv"))
  
  # 保存显著差异基因子集
  sig_genes <- subset(res, regulation %in% c("up", "down"))
  write.csv(sig_genes, file = paste0(comp$name, "_significant_genes_lenient.csv"))
}
```
