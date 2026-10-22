---
id: 13
title: "NGenomeSyn 共线性可视化"
excerpt: "NGenomeSyn 绘制多基因组共线性图，逐条解释 -MappingBin/-BinDir/-MinLenA 等参数。"
category: "比较基因组"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "比对"
  - "可视化"
---

> 用 NGenomeSyn 的 `GetTwoGenomeSyn.pl` 做两个基因组的共线性比对，画出点图/共线性图。

## 环境依赖

```bash
# NGenomeSyn 是 perl 脚本套件，克隆后即可用
git clone https://github.com/NGenomeSyn/NGenomeSyn.git
```

## 使用

```bash
perl $SOFTWARE_DIR/NGenomeSyn/bin/GetTwoGenomeSyn.pl \
    -InGenomeA $SOFTWARE_DIR/genomeA.fa \
    -InGenomeB genomeB.fa \
    -OutPrefix A2B \
    -MappingBin minimap2 \
    -BinDir /usr/bin/ \
    -MinLenA 10000 \
    -MinLenB 10000
```

> 参数说明：
> - `-InGenomeA/-InGenomeB`：两个待比对的基因组 FASTA。
> - `-MappingBin`：比对工具（`minimap2` 或 `mummer`）。
> - `-BinDir`：比对工具所在目录（已在 PATH 时可省略）。
> - `-MinLenA/-MinLenB`：只统计 ≥ 该长度（bp）的片段，过滤掉短碎片，让图更干净。
> - `-OutPrefix`：输出前缀，生成 `<前缀>.*` 的结果文件。

## 常见问题

- **报 `minimap2: command not found`**：确认 `-BinDir` 指向的目录里真的有 `minimap2`，或直接删掉 `-BinDir` 用 PATH。
- **图太乱**：调大 `-MinLenA/-MinLenB`，只保留大片段共线性。
