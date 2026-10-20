---
id: 24
title: "Jalview 多序列比对可视化"
excerpt: "muscle/clustalo 比对后导入 Jalview 着色、美化、导出图片的流程。"
category: "可视化"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "Jalview"
  - "多序列比对"
  - "可视化"
---

> 把多条同源序列做多序列比对（MSA），再用 Jalview 可视化比对、加注释、导出图片。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 多条同源序列的 FASTA（蛋白或核酸） |
| 输出 | 比对结果（`.aln`/`.fa`）、Jalview 可视化图、导出的 PNG/PDF |

## 环境依赖

- 比对软件：`muscle` 或 `clustalo`（CLI）
- 可视化：Jalview 桌面版（https://www.jalview.org/）或网页版 https://www.jalview.org/jalview-js/

```bash
conda install -c bioconda muscle clustalo
```

---

## 流程

### 1. 多序列比对

```bash
# muscle（快，适合中小规模）
muscle -align input.fa -output aligned.aln

# clustalo（更准，适合大规模/长序列）
clustalo -i input.fa -o aligned.aln --outfmt=clu   # 或 --outfmt=fa
```

### 2. 导入 Jalview

- 打开 Jalview → File → Input Alignment → From File → 选 `aligned.aln`。
- 或直接用网页版拖入比对文件。

### 3. 着色与注释

- **按保守性着色**：Colour → Percentage Identity（或 Clustal、Blosum62）。
- **显示保守位点/共识序列**：勾选菜单里的 Consensus / Conservation。
- **加序列注释**：选中区域右键 → Add Sequence Feature（如结构域、催化位点）。

### 4. 导出图片

- File → Export Image → PNG / SVG / PDF。
- 导出前可用 `View → Wrap` 控制换行，让长比对更紧凑。

## 常见问题

- **序列太长/太多导致卡顿**：先只取保守区（如某个结构域）再比对，或用 `clustalo` 替代 `muscle`。
- **配色看不清**：蛋白用 `Blosum62` 或 `Clustal` 配色，核酸用 `Nucleotide` 配色。
