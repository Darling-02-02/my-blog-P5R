---
id: 2
title: "三代基因组组装（HiFi / hifiasm）"
excerpt: "BAM 转 fastq → hifiasm 组装 → BUSCO 评估的完整流程，附 bp.p_ctg 选材说明。"
category: "基因组组装"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "hifiasm"
  - "三代测序"
  - "BUSCO"
---

> 从 PacBio HiFi 测序的 BAM 出发，转 FASTQ → 合并 → hifiasm 组装 → 提取主组装 → QUAST/BUSCO 评估。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | PacBio HiFi reads 的 BAM（或多个 BAM） |
| 输出 | 组装结果 `assembly.fasta`、`assembly-stats` 统计、BUSCO 报告 |

## 环境依赖

```bash
conda install -c bioconda samtools hifiasm assembly-stats busco
```

---

## 步骤

### 1. BAM 转 FASTQ

```bash
# 单个 BAM 转 fq.gz
samtools fastq -@ 8 m84070_241025_163738_s1.hifi_reads.bc2072.bam | gzip > s1_reads.fq.gz
samtools fastq -@ 8 m84072_241107_185701_s4.hifi_reads.bc2072.bam | gzip > s4_reads.fq.gz
# 文件名按自己的数据改

# 多个测序批次合并成一个 fq.gz
cat s1_reads.fq.gz s4_reads.fq.gz > combined_hifi.fq.gz
```

### 2. hifiasm 组装

```bash
hifiasm -o output_prefix -t 32 combined_hifi.fq.gz
# -o 输出前缀，-t 线程数
```

### 3. 提取组装结果

hifiasm 输出是 GFA 格式，`p_ctg` 是 primary contigs（初步组装），提取成 FASTA：

```bash
awk '/^S/{print ">"$2"\n"$3}' output_prefix.p_ctg.gfa > assembly.fasta
```

> 说明：`output_prefix.bp.p_ctg.gfa`（bp = 已做 HiFi 预纠错）比 `.p_ctg.gfa` 质量更好，二选一时优先用 `bp` 版本。

### 4. 基础统计（连续性）

```bash
assembly-stats assembly.fasta
```

### 5. 完整性评估（BUSCO）

```bash
# -l 按物种谱系选库；真菌用 fungi_odb10
busco -i assembly.fasta -l fungi_odb10 -o busco_out -m genome -c 32 --offline
```

### 6. 准确性评估（回帖率）

```bash
# 把原始 HiFi reads 比对回组装，检查错误率（minimap2 比 bwa 更适合长读）
minimap2 -t 32 -ax map-hifi assembly.fasta combined_hifi.fq.gz | samtools sort -@ 8 -o reads_to_asm.bam
samtools index reads_to_asm.bam

# 统计比对率与错误率（>99% 的 reads 能回帖且错误率极低说明组装准确）
samtools flagstat reads_to_asm.bam
```

## 常见问题

- **hifiasm 内存不足**：`-t` 只是线程数，内存需手动限制；大基因组可加 `--write-paf` 分步或换更高内存机器。
- **`p_ctg` 和 `bp.p_ctg` 的区别**：`bp` 版本做了 HiFi 碱基级纠错，通常更准确，直接用它即可。
- **组装出很多碎片**：检查 HiFi 数据量是否 ≥ 30×，或是否混入了其他物种。
