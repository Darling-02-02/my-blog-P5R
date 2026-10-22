---
id: 8
title: "VCF 转 MAF 注释（vcf2maf）"
excerpt: "vcf2maf.pl 把 VCF 注释成 MAF 格式，配合 maftools 做下游突变分析。"
category: "变异检测"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "注释"
  - "R"
---

> 把 VCF 格式的变异转成 MAF 格式，便于做下游的突变分析（如 maftools、MutSig 等）。

## 背景 / 适用场景

- **适用**：肿瘤体细胞变异，需要用 MAF 格式做突变全景分析、signature、driver 基因筛选。
- **核心**：vcf2maf 用 VEP（Ensembl Variant Effect Predictor）做注释，再转成 MAF。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 变异 `input.vcf` + 参考基因组 + VEP 缓存 |
| 输出 | `output.maf` |

## 环境依赖

```bash
# 1. 安装 VEP 及其缓存（较大，参考 Ensembl 官方文档）
# 2. 获取 vcf2maf 脚本
git clone https://github.com/mskcc/vcf2maf.git
cd vcf2maf
```

## 使用

```bash
perl vcf2maf.pl \
    --input-vcf input.vcf \
    --output-maf output.maf \
    --tumor-id SAMPLE_TUMOR \
    --normal-id SAMPLE_NORMAL \
    --ref-fasta /path/to/ref/genome.fa \
    --vep-path /path/to/vep \
    --vep-data /path/to/vep/cache \
    --ncbi-build GRCh38
```

> 参数说明：
> - `--tumor-id / --normal-id`：肿瘤/正常样本名，会写入 MAF 的对应列。
> - `--ref-fasta`：参考基因组；`--vep-path` VEP 安装目录；`--vep-data` VEP 缓存目录。
> - `--ncbi-build`：参考基因组版本（GRCh38 / GRCh37）。
> - 只有肿瘤样本（无配对正常）时加 `--vcf-tumor-id SAMPLE` 并省略 normal 相关参数。

## 下游分析（R / maftools）

```r
library(maftools)
laml <- read.maf(maf = "output.maf")
plotmafSummary(laml)
oncoplot(laml, top = 20)
```

## 常见问题

- **VEP 缓存不匹配**：`--ncbi-build`、参考基因组版本、VEP 缓存三者必须一致。
- **MAF 里注释列为空**：VEP 没装好或 `--vep-path/--vep-data` 指向错误。
- **报内存不足**：VEP 注释大 VCF 很吃内存，可用 `--vep-forks` 控制并发。
