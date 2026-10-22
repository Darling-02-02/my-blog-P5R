---
id: 16
title: "gffread 将 GFF 转 GTF"
excerpt: "gffread -T 把 GFF 转成 GTF，附 AGAT 备选方案与格式差异说明。"
category: "基因注释"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "注释"
---

> 一行命令把 GFF3 转成 GTF 格式，供 HISAT2/featureCounts 等需要 GTF 的工具使用。

## 命令

```bash
gffread input.gff3 -T -o output.gtf
```

> 说明：`-T` 表示输出 GTF 格式，`-o` 指定输出文件。

## 备选：用 AGAT 转换

也可以用 AGAT 做同样的事，且能顺带修复格式问题：

```bash
agat_convert_sp_gff2gtf.pl --gff input.gff3 -o output.gtf
```
