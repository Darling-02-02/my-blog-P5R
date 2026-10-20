---
id: 12
title: "Scanpy 单细胞分析流程"
excerpt: "read_10x_mtx → 过滤 → 归一化 → HVG → PCA → UMAP → Leiden 聚类的 Scanpy 流程。"
category: "单细胞"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "Scanpy"
  - "单细胞"
  - "Python"
---

> 用 Python 包 Scanpy 做 10x 单细胞数据的标准流程：读取 → 质控 → 归一化 → 高变基因 → PCA → 邻居图 → UMAP → 聚类 → 差异基因。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 10x 下机数据（`filtered_feature_bc_matrix/`、`.h5` 或 `.h5ad`） |
| 输出 | 聚类结果、UMAP 图、每个簇的标记基因列表（AnnData `.h5ad`） |

## 环境依赖

```bash
pip install scanpy leidenalg
```

## 完整流程

```python
import scanpy as sc
import numpy as np

sc.settings.verbosity = 3

# 1. 读取 10x 数据（三选一）
adata = sc.read_10x_mtx("path/to/filtered_feature_bc_matrix", var_names="gene_symbols")
# adata = sc.read_10x_h5("path/to/filtered_feature_bc_matrix.h5")
# adata = sc.read_h5ad("path/to/your.h5ad")   # 已存好的 AnnData

adata.var_names_make_unique()          # 避免基因名重复

# 2. 质控（QC）：线粒体比例、n_genes 过滤
adata.var["mt"] = adata.var_names.str.startswith("MT-")   # 人 MT-，小鼠 mt-
sc.pp.calculate_qc_metrics(adata, qc_vars=["mt"], percent_top=None, log1p=False, inplace=True)
sc.pl.violin(adata, ["n_genes_by_counts", "total_counts", "pct_counts_mt"], jitter=0.4, multi_panel=True)

sc.pp.filter_cells(adata, min_genes=200)
sc.pp.filter_genes(adata, min_cells=3)
adata = adata[adata.obs.n_genes_by_counts < 6000, :]      # 阈值按数据调
adata = adata[adata.obs.pct_counts_mt < 15, :]

# 3. 归一化 + 高变基因
sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
sc.pp.highly_variable_genes(adata, n_top_genes=2000)
adata.raw = adata                                    # 保留原始归一化表达，供后续绘图

# 4. 缩放 + PCA
sc.pp.scale(adata, max_value=10)
sc.tl.pca(adata, svd_solver="arpack")
sc.pl.pca_variance_ratio(adata, n_pcs=50, log=True)  # 看主成分贡献，决定 n_comps

# 5. 邻居图 + UMAP + 聚类（leiden）
sc.pp.neighbors(adata, n_neighbors=15, n_pcs=30)     # n_pcs 按 PCA 结果调整
sc.tl.umap(adata)
sc.tl.leiden(adata, resolution=0.8)                  # resolution 越大簇越多
sc.pl.umap(adata, color=["leiden"], legend_loc="on data")

# 6. 找每个簇的标记基因
sc.tl.rank_genes_groups(adata, "leiden", method="wilcoxon")
sc.pl.rank_genes_groups(adata, n_genes=10, sharey=False)

# 保存结果
adata.write("scanpy_result.h5ad")
```

## 结果解读

- **`n_genes_by_counts` 过低**：空液滴/死细胞；**过高**：可能 doublet。
- **`pct_counts_mt` 过高**：死细胞/裂解细胞，需过滤。
- **`rank_genes_groups` 的 `logfoldchanges`**：该簇相对其他簇的差异表达倍数（log）。

## 常见问题

- **`startswith("MT-")` 匹配不到**：小鼠用 `mt-`，或基因是 Ensembl ID（无 MT 前缀，改用别的方式标线粒体）。
- **UMAP 分群不好**：调 `n_neighbors`、`n_pcs` 或 `resolution`。
- **细胞类型注释**：用 `sc.tl.score_genes` 打分或参考 CellTypist 等工具。
