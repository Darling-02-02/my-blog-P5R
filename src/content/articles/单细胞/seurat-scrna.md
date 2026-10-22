---
id: 11
title: "Seurat 单细胞分析流程"
excerpt: "Read10X → QC → Normalize → PCA → 聚类 → UMAP → 差异基因的标准 Seurat 流程。"
category: "单细胞"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "差异表达"
  - "R"
---

> 用 R 包 Seurat 做 10x 单细胞数据的标准流程：读取 → 质控 → 归一化 → 高变基因 → 降维 → 聚类 → 差异基因。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 10x 下机数据（`filtered_feature_bc_matrix/` 或 `.h5`） |
| 输出 | 聚类结果、UMAP 图、每个簇的标记基因列表 |

## 环境依赖

```r
install.packages("Seurat")   # 建议在 R >= 4.1 环境
```

## 完整流程

```r
library(Seurat)

# 1. 读取 10x 数据（Cell Ranger 输出的 filtered 矩阵）
#    两种方式二选一：
data <- Read10X(data.dir = "path/to/filtered_feature_bc_matrix")          # 目录方式
# data <- Read10X_h5("path/to/filtered_feature_bc_matrix.h5")             # h5 方式
seu <- CreateSeuratObject(counts = data, project = "sample",
                          min.cells = 3, min.features = 200)

# 2. 质控（QC）：线粒体/核糖体比例、nFeature/nCount 过滤
seu[["percent.mt"]]  <- PercentageFeatureSet(seu, pattern = "^MT-")       # 人用 MT-，小鼠用 mt-
seu[["percent.ribo"]] <- PercentageFeatureSet(seu, pattern = "^RP[SL]")   # 核糖体基因（可选）
VlnPlot(seu, features = c("nFeature_RNA", "nCount_RNA", "percent.mt"), ncol = 3)

seu <- subset(seu, subset = nFeature_RNA > 200 & nFeature_RNA < 6000 &
                         percent.mt < 15)                                  # 阈值按数据调

# 3. 归一化 + 找高变基因
seu <- NormalizeData(seu, normalization.method = "LogNormalize", scale.factor = 10000)
seu <- FindVariableFeatures(seu, selection.method = "vst", nfeatures = 2000)

# 4. 缩放 + PCA
seu <- ScaleData(seu, features = rownames(seu))
seu <- RunPCA(seu, features = VariableFeatures(seu))
ElbowPlot(seu)   # 用拐点决定主成分数量

# 5. 聚类 + UMAP
seu <- FindNeighbors(seu, dims = 1:20)      # dims 按 ElbowPlot 结果调整
seu <- FindClusters(seu, resolution = 0.8)  # resolution 越大簇越多
seu <- RunUMAP(seu, dims = 1:20)
DimPlot(seu, reduction = "umap", label = TRUE)

# 6. 找每个簇的标记基因
markers <- FindAllMarkers(seu, only.pos = TRUE, min.pct = 0.25, logfc.threshold = 0.25)
write.csv(markers, "markers.csv")

# 查看 Top 基因，辅助注释细胞类型
top10 <- markers %>% dplyr::group_by(cluster) %>% dplyr::top_n(10, avg_log2FC)
FeaturePlot(seu, features = c("Cd3e", "Cd79a", "Lyz2"))   # 换成你关注的标记基因
```

## 结果解读

- **`nFeature_RNA` 过低**：可能是空液滴或死细胞；**过高**：可能是 doublet（双细胞）。
- **`percent.mt` 过高**：死细胞/裂解细胞，需过滤。
- **`FindAllMarkers` 的 `avg_log2FC`**：该簇相对其他簇的平均表达差异倍数（log2）。

## 常见问题

- **`^MT-` 匹配不到基因**：小鼠用 `^mt-`（小写），并确认基因名是 symbol 还是 Ensembl ID。
- **UMAP 分群不明显**：调 `dims`（用更多/更少主成分）或 `resolution`。
- **内存不足**：大样本可先做 `subset` 随机抽样，或用 `SCTransform` 替代 `NormalizeData+ScaleData`。
