---
id: 18
title: "基因组质量评估（QUAST / BUSCO）"
excerpt: "QUAST 看连续性、BUSCO 看完整性，两者一起才是完整的基因组质量评估。"
category: "基因注释"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "质量评估"
---

> 对拼接出的基因组做两件事：QUAST 看连续性（N50 等），BUSCO 看完整性（基因是否拼全）。两者互补，缺一不可。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 组装结果 `assembly.fasta`（或 `scaffolds.fasta`） |
| 输出 | QUAST 的 `report.html`；BUSCO 的 `short_summary.*.txt` |

## 1. QUAST 评估（连续性）

```bash
# 单独评估一个组装
quast.py -t 12 -o quast_output assembly.fasta

# 有参考基因组时加上 -r，可额外得到错拼/漏拼统计
quast.py -t 12 -r reference.fasta -o quast_output assembly.fasta

# 一次评估多个组装，直接对比
quast.py -t 12 -o quast_all assembly1.fasta assembly2.fasta
```

> 关键指标：`N50`（把 contig 从长到短累加，累加到总长一半时的 contig 长度）、`L50`、`# contigs`、`Total length`、`Largest contig`。

## 2. BUSCO 评估（完整性）

```bash
# -l 按物种谱系选数据库；--offline 用已下载的库，避免联网
busco -i assembly.fasta \
      -l fungi_odb10 \
      -o busco_out \
      -m genome \
      -c 32 \
      --offline

# 把多个 BUSCO 结果放一个目录，画汇总柱状图
python /path/to/busco/scripts/generate_plot.py -wd busco_results_dir
```

> 输出 `C:xx.x%[S:xx.x%,D:xx.x%]` 里：`C`=完整、`S`=单拷贝、`D`=重复、`M`=缺失、`F`=片段化。`C` 越高越完整。

## 常见问题

- **QUAST 数字好看但 BUSCO 完整度低**：说明拼接碎片虽然长但基因没拼全，优先补测序深度或换 k-mer。
- **`-l fungi_odb10` 报找不到库**：先 `busco --list-datasets` 看已下载的库，或用 `busco --download fungi_odb10` 下载。
