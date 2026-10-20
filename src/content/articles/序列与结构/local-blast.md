---
id: 19
title: "本地 BLAST 建库与比对"
excerpt: "makeblastdb 建库 → blastn 比对 → samtools 提取目标区域，附 outfmt6 十六列字段解读。"
category: "序列与结构"
date: "2026-10-20"
readTime: "2 分钟"
tags:
  - "BLAST"
  - "makeblastdb"
  - "序列比对"
---

> 在本地建库跑 BLASTN，批量比对、解读 outfmt 6 结果，并把命中区间从基因组里切出来做下游分析（ORF 预测、蛋白结构域注释）。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 参考库序列（如 `nc_cox1.fasta`）、查询序列 `query.fasta` |
| 输出 | BLASTN 结果（默认或 outfmt 6）、按命中坐标切出的片段 FASTA |

## 环境依赖

```bash
conda install -c bioconda blast samtools
```

---

## 步骤

### 1. 建库

```bash
makeblastdb -in nc_cox1.fasta -dbtype nucl -out nc_cox1_db
```

### 2. 单条 BLASTN

```bash
blastn \
  -query test.fasta \
  -db nc_cox1_db \
  -out blastn_results.txt \
  -task blastn \
  -evalue 1e-5
```

> 阈值：e-value 要小于 `1e-5`（越小越显著）。

### 3. 批量 BLASTN（遍历所有 FASTA）

```bash
#!/bin/bash
# 数据库名称变量（按需修改）
db_name="Fv_orf174_db"

# 遍历当前目录下所有 .fasta 文件
for sample in ./*.fasta; do
    sample_base=$(basename "${sample}" .fasta)                 # 样本基名（去掉路径和扩展名）
    out_name="${db_name}_${sample_base}.txt"                  # 输出名 = 库名_样本名

    blastn -query "${sample}" \
           -db "$db_name" \
           -out "$out_name" \
           -task blastn \
           -outfmt "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore qlen slen sstrand" \
           -evalue 1e-5
done
```

### 4. 按命中坐标提取序列（samtools）

```bash
# 建立基因组索引
samtools faidx Frn0044.fasta

# regions.txt 每行一个区间：contig:start-end
cat > regions.txt <<EOF
Frn0044_mt.K105.complete(circular):62885-63474
Frn0044_mt.K105.complete(circular):70346-70609
EOF

# 批量提取
samtools faidx -r regions.txt Frn0044.fasta > Frn0044_blast_hits.fasta

# 验证
echo "提取的序列数量: $(grep -c '^>' Frn0044_blast_hits.fasta)"
```

> 下游通常会把命中区间**前后各延伸 500–2000 bp** 再切，得到更完整的基因结构（含上游启动子或 UTR）。

---

## outfmt 6 字段解读（16 列）

| # | 字段 | 含义 |
| --- | --- | --- |
| 1 | qseqid | 查询（你的）序列 ID |
| 2 | sseqid | 参考（库）序列 ID，如 `NC_021373.1:1-11503` 表示参考线粒体基因组位置 |
| 3 | pident | 一致性百分比（95.287 = 95.287%） |
| 4 | length | 匹配片段长度（bp） |
| 5 | mismatch | 错配碱基数 |
| 6 | gapopen | 空位（gap）打开次数 |
| 7 | qstart | 匹配在查询序列上的起始位置 |
| 8 | qend | 匹配在查询序列上的结束位置 |
| 9 | sstart | 匹配在参考序列上的起始位置 |
| 10 | send | 匹配在参考序列上的结束位置 |
| 11 | evalue | 期望值（越小越显著） |
| 12 | bitscore | 比对得分（越高越好） |
| 13 | qlen | 查询序列总长度 |
| 14 | slen | 参考序列总长度 |
| 15 | sstrand | 匹配方向（`plus` 正链，`minus` 反链） |

---

## 下游分析建议

1. **ORF 预测**：把切出的核酸序列丢进 ORFfinder，选最长的 ORF 作为候选蛋白。
2. **比对验证**：把预测蛋白与核酸序列一起做多序列比对，看对应氨基酸是否一致。
3. **结构域注释**：把氨基酸序列提交 InterPro（https://www.ebi.ac.uk/interpro/）预测保守结构域，重点看催化位点（如 cox1 催化位点）。

## 常见问题

- **`makeblastdb` 报错**：确认输入是 FASTA、`-dbtype` 正确（核酸用 `nucl`，蛋白用 `prot`）。
- **outfmt 6 列顺序**：列完全由 `-outfmt "6 ..."` 决定，写错了列名顺序结果就错位。
- **samtools faidx 提取失败**：region 里的 contig 名必须和 `samtools faidx` 生成的索引名完全一致（含空格/括号）。
