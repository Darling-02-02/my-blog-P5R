---
id: 6
title: "SNP 变异检测（GATK / bcftools / snp-sites）"
excerpt: "三种 SNP 检测路线：GATK 联合分型、bcftools mpileup、mafft+snp-sites；含过滤、注释、建树、批量脚本。"
category: "变异检测"
date: "2026-10-20"
readTime: "2 分钟"
tags:
  - "GATK"
  - "SNP"
  - "bcftools"
  - "变异检测"
---

> 从二代测序 reads 出发，比对到参考基因组，用 GATK 或 bcftools 检测 SNP/Indel，再做过滤、注释、统计、建树。

## 背景 / 适用场景

- **适用**：已有参考基因组（已组装的菌株/物种 FASTA）+ 二代测序 reads（单样本或多样本），需要找变异位点。
- **典型用途**：菌株差异比较、群体遗传、SNP 密度图、系统发育建树、突变注释（找非同义突变）。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 参考基因组 `reference.fasta`；每个样本的双端 reads `sample_R1.fq.gz` / `sample_R2.fq.gz` |
| 输出 | 变异文件 `final.vcf`、过滤后 `*.pass.vcf`、注释结果 `*.eff.vcf`、`*.maf`、统计表 `*_count.txt` |

## 环境依赖

```bash
# GATK 4 需要 Java 17，建议用 conda 建独立环境
conda create -n gatk python=3.9 -y
conda activate gatk
conda install -c conda-forge openjdk=17 -y
conda install -c bioconda gatk4=4.4.0.0 bwa samtools bcftools picard -y

# 注释工具（可选）
# snpEff / vcf2maf 按官方文档单独安装，路径统一用 $SOFTWARE_DIR 占位
```

---

## 方法一：GATK HaplotypeCaller（推荐，适合后续联合分型）

> 思路：每个样本单独 call 出 GVCF → 合并所有 GVCF → 联合分型得到 VCF。
> 适合样本较多、后续要做群体分析的场景。

### 1. 质控（Trimmomatic）

```bash
# 接头和低质量碱基过滤；adapters 路径换成自己的
java -jar $SOFTWARE_DIR/Trimmomatic-0.39/trimmomatic-0.39.jar PE -threads 8 \
    sample_R1.fq.gz sample_R2.fq.gz \
    sample_R1.paired.fq.gz sample_R1.unpaired.fq.gz \
    sample_R2.paired.fq.gz sample_R2.unpaired.fq.gz \
    ILLUMINACLIP:$SOFTWARE_DIR/Trimmomatic-0.39/adapters/TruSeq3-PE-2.fa:2:30:10 \
    LEADING:5 TRAILING:5 SLIDINGWINDOW:4:15 MINLEN:50 TOPHRED33
```

### 2. 比对（bwa mem）+ 加 ReadGroup

```bash
# 建参考索引
samtools faidx reference.fasta
bwa index reference.fasta

# 比对；-R 写 ReadGroup，ID/SM 必须与样本一致，GATK 靠它区分样本
bwa mem -t 8 -R "@RG\tID:sample\tPL:illumina\tSM:sample" \
    reference.fasta sample_R1.paired.fq.gz sample_R2.paired.fq.gz \
    | samtools view -bS - > sample.bam
```

### 3. 排序、标记重复、建索引

```bash
samtools sort -@ 8 -o sample.sorted.bam sample.bam

gatk MarkDuplicates \
    -I sample.sorted.bam \
    -O sample.sorted.markdup.bam \
    -M sample.sorted.markdup_metrics.txt

samtools index sample.sorted.markdup.bam
```

### 4. 每个样本生成 GVCF

```bash
# 参考需要 .dict；用 GATK 生成
gatk CreateSequenceDictionary -R reference.fasta -O reference.dict

# --emit-ref-confidence GVCF：把"非变异位点"也记录下来，便于联合分型
gatk --java-options "-Xmx4G" HaplotypeCaller \
    -R reference.fasta \
    -I sample.sorted.markdup.bam \
    -O sample.g.vcf \
    --emit-ref-confidence GVCF
```

### 5. 合并 GVCF + 联合分型

```bash
# 合并所有样本的 GVCF（这一步只是锁定变异位点位置）
gatk CombineGVCFs \
    -R reference.fasta \
    -V sample1.g.vcf -V sample2.g.vcf \
    -O cohort.g.vcf

# 联合分型：GVCF → VCF
gatk --java-options "-Xmx4g" GenotypeGVCFs \
    -R reference.fasta \
    -V cohort.g.vcf \
    -O output.vcf
```

---

## 方法二：bcftools mpileup + call（更轻量）

> 思路：把所有 BAM 一次性喂给 `mpileup`，直接得到群体 VCF。
> 适合样本不多、追求简单快速的场景。

```bash
# 比对、排序、去重同方法一，最后把所有 BAM 列出来
samtools mpileup -g -f reference.fasta \
    -o all_samples.bcf \
    sample1.sorted.markdup.bam sample2.sorted.markdup.bam

# -v 只输出变异位点；-c 用 consensus caller（比 -m 更保守）
bcftools call -v -c all_samples.bcf -o final.vcf
```

---

## 方法三：已组装序列直接找 SNP（针对线粒体/已组装序列）

> 如果手里已经是多条组装好的全长序列（不是 reads），直接做多序列比对再提取 SNP，无需比对到参考。

```bash
# 多序列比对
mafft --auto --reorder full_seq.fasta > aligned.fasta

# 提取变异位点为 VCF
snp-sites -v -o mito_snps.vcf aligned.fasta

# 过滤缺失比例过高（保留缺失 ≤ 20% 的位点）
vcftools --vcf mito_snps.vcf --max-missing 0.8 --recode --recode-INFO-all --out filtered

# 过滤次要等位基因频率 < 0.05 的位点
vcftools --vcf filtered.recode.vcf --maf 0.05 --recode --recode-INFO-all --out final_snps

# 直接用比对结果建树
iqtree -s aligned.fasta -m MFP -bb 1000 -nt AUTO -pre mito_tree
```

---

## 过滤变异

### GATK 硬过滤（区分 SNP / Indel 用不同阈值）

```bash
# 先拆出 SNP 和 Indel
gatk SelectVariants -R reference.fasta -V output.vcf -select-type SNP  -O snps.vcf
gatk SelectVariants -R reference.fasta -V output.vcf -select-type INDEL -O indels.vcf

# 过滤 SNP（各项阈值是 GATK 官方推荐值）
gatk VariantFiltration \
    -R reference.fasta \
    -V snps.vcf \
    --cluster-size 4 \
    --cluster-window-size 10 \
    --mask indels.vcf --mask-name aroundIndel \
    --filter-expression "MQRankSum < -12.5"  --filter-name lowMQRankSum \
    --filter-expression "FS > 60.0"          --filter-name highFS \
    --filter-expression "ReadPosRankSum < -8.0" --filter-name lowReadPosRankSum \
    --filter-expression "MQ < 40.0"          --filter-name lowMQ \
    --filter-expression "QD < 2.0"           --filter-name lowQD \
    --genotype-filter-expression "DP < 8.0"  --genotype-filter-name lowDP \
    -O final_filter_snp_scores.vcf \
    2> filter_snp.err

# 过滤 Indel
gatk VariantFiltration \
    -R reference.fasta \
    -V indels.vcf \
    --filter-expression "QD < 2.0 || FS > 200.0 || SOR > 10.0 || MQRankSum < -12.5 || ReadPosRankSum < -8.0" \
    --filter-name "INDEL_filter" \
    -O final_filter_indel_scores.vcf
```

### 只保留 PASS 位点（bcftools）

```bash
# 压缩 + 建索引（大文件建议）
bgzip -c final_filter_snp_scores.vcf > final_filter_snp_scores.vcf.gz
tabix -p vcf final_filter_snp_scores.vcf.gz

# 只保留 FILTER 为 PASS 的位点
bcftools filter --threads 12 \
    -i 'FILTER=="PASS"' \
    --no-version \
    -O z \
    -o final_filter_snp_pass.vcf.gz \
    final_filter_snp_scores.vcf.gz

# 查看最终位点数量
bcftools view -H final_filter_snp_pass.vcf.gz | wc -l
```

---

## 注释（snpEff）+ 转 MAF

```bash
# 1. 准备 snpEff 数据库（以物种"黑木耳 Auricularia auricula"，参考版本 MJ13 为例）
# 在 snpEff.config 末尾加入：
#   MJ13.genome : Auricularia auricula
# 在 snpEff 目录下建 data/genomes 与 data/MJ13 两个文件夹：
#   - genomes/ 放参考序列，改名 MJ13.fa
#   - MJ13/ 放注释文件，改名 genes.gff3（有蛋白则再加 protein.fa）

# 2. 建库（有蛋白序列）
java -jar $SOFTWARE_DIR/snpEff/snpEff.jar build -gff3 -v MJ13
# 没有蛋白/CDS 时（跳过 CDS 检查）
java -jar $SOFTWARE_DIR/snpEff/snpEff.jar build -gff3 -v MJ13 -noCheckCds -noCheckProtein

# 3. 注释
java -jar $SOFTWARE_DIR/snpEff/snpEff.jar ann MJ13 final_filter_snp_pass.vcf > annot/eff.vcf

# 4. 剔除同义突变，只保留可能影响蛋白的位点
java -jar $SOFTWARE_DIR/snpEff/SnpSift.jar filter \
    "(ANN[0].EFFECT != 'synonymous_variant') && (ANN[0].EFFECT != 'synonymous_SNV')" \
    eff.vcf > nonsyn.vcf

# 5. VCF 转 MAF（用于后续 R / maftools 可视化）
perl $SOFTWARE_DIR/vcf2maf/vcf2maf.pl \
    --input-vcf final_filter_snp_pass.vcf \
    --output-maf final.maf
```

### 补充：把 snpEff 注释结果转成易读表格

> 注释后的 VCF 一行一个位点、INFO 里塞着 `ANN=...|...` 字段，直接看很累。
> 下面这段 awk 把 `ANN` 里的**变异类型**（`fields[2]`）和**基因名**（`fields[4]`）抽出来，
> 再把每个样本的基因型（`GT`）从 `0/1` 转回 `A,G` 这类字母，输出成一张 TSV，方便 Excel / R 直接用。
> 注意：表头的样本名（`HmD0001` 等）是写死的，换成自己样本前先改 `BEGIN` 里的 `print` 和末尾的 `sample_gts[...]` 列。

```bash
awk '
BEGIN { FS="\t"; OFS="\t"; print "chr","pos","ref","alt","type","gene_ID","sample1","sample2" }
!/^#/ {
    chr=$1; pos=$2; ref=$4; alt=$5; type="."; gene_id=".";
    # 解析 INFO 里的 ANN= 字段
    split($8, info, ";");
    for (i in info) if (info[i] ~ /^ANN=/) {
        split(substr(info[i],5), ann_arr, ",");
        split(ann_arr[1], fields, "|");
        if (length(fields) >= 4) { type = fields[2]; gene_id = fields[4]; }
        break;
    }
    # 找 FORMAT 里 GT 的列号
    split($9, formats, ":"); gt_i=0;
    for (i in formats) if (formats[i]=="GT") { gt_i=i; break }
    # 逐样本把 0/1 还原成 ref/alt 字母
    for (i=10; i<=NF; i++) {
        split($i, s, ":"); gt=s[gt_i]; gsub(/\|/,"/",gt);
        if (gt=="./.") { gts[i]=".,." }
        else { split(gt,a,"/"); gts[i]=((a[1]=="0"?ref:(a[1]=="1"?alt:".")) "," (a[2]=="0"?ref:(a[2]=="1"?alt:"."))) }
    }
    print chr,pos,ref,alt,type,gene_id,gts[10],gts[11];
}' final_filter_snp_pass.vcf > variants_table.tsv
```

---

## 统计每个样本的变异数量

```python
#!/usr/bin/env python3
"""
统计多样本 VCF 中每个样本的变异数量。
分类：总突变、SNP、Indel（插入/缺失/其他）。
用法：python count_variants.py <in.vcf> [out.txt]
"""
import sys
import os
import subprocess

def get_sample_names(vcf_file):
    """用 bcftools 取样本名"""
    cmd = f"bcftools query -l {vcf_file}"
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"读取样本名失败: {r.stderr}")
    return [l for l in r.stdout.split('\n') if l.strip()]

def count_variants(vcf_file, samples):
    total = {s: 0 for s in samples}    # 总突变
    snp   = {s: 0 for s in samples}    # SNP
    ins   = {s: 0 for s in samples}    # 插入
    dele  = {s: 0 for s in samples}    # 缺失
    other = {s: 0 for s in samples}    # 其他/复杂变异

    cmd = f"bcftools view -H {vcf_file}"   # -H 去掉注释行
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"读取 VCF 失败: {r.stderr}")

    for line in r.stdout.split('\n'):
        if not line.strip():
            continue
        f = line.strip().split('\t')
        ref = f[3]
        alts = f[4].split(',')
        for idx, gt in enumerate(f[9:]):
            s = samples[idx]
            gt_val = gt.split(':')[0]      # 只取 GT
            if gt_val in ('.', './.', '.|.', '0', '0/0', '0|0'):
                continue                    # 参考型或缺失，跳过
            total[s] += 1
            # 取该样本实际的非参考等位基因
            var_alts = []
            for a in gt_val.replace('|', '/').split('/'):
                if a.isdigit() and int(a) > 0 and int(a) <= len(alts):
                    var_alts.append(alts[int(a) - 1])
            if not var_alts:
                continue
            is_snp, has_ins, has_del = True, False, False
            for alt in var_alts:
                if len(ref) < len(alt): is_snp, has_ins = False, True
                elif len(ref) > len(alt): is_snp, has_del = False, True
            if is_snp:          snp[s] += 1
            elif has_ins and not has_del: ins[s] += 1
            elif has_del and not has_ins: dele[s] += 1
            else:               other[s] += 1
    return total, snp, ins, dele, other

def main():
    if len(sys.argv) < 2:
        sys.exit("用法: python count_variants.py <in.vcf> [out.txt]")
    vcf_file = sys.argv[1]
    out_file = sys.argv[2] if len(sys.argv) > 2 else "variant_count.txt"
    if not os.path.exists(vcf_file):
        sys.exit(f"文件不存在: {vcf_file}")

    samples = get_sample_names(vcf_file)
    total, snp, ins, dele, other = count_variants(vcf_file, samples)

    with open(out_file, 'w') as fh:
        fh.write("Sample\tTotal\tSNP\tIndel\tInsertion\tDeletion\tOther\n")
        for s in samples:
            indel = ins[s] + dele[s] + other[s]
            fh.write(f"{s}\t{total[s]}\t{snp[s]}\t{indel}\t{ins[s]}\t{dele[s]}\t{other[s]}\n")
    print(f"结果已写入 {out_file}")

if __name__ == "__main__":
    main()
```

**输出列含义**：`Sample` 样本名；`Total` 总突变；`SNP` 单核苷酸多态；`Indel` 插入+缺失+其他；`Insertion/Deletion/Other` 细分类型。

---

## 基于 SNP 建系统发育树

```bash
# VCF 转 phylip 格式
python vcf2phylip.py -i final_filter_snp_pass.vcf.gz

# IQ-TREE 构建 ML 树；-m MFP 自动选模型，-B 1000 做 1000 次超快 bootstrap
iqtree -s final_filter_snp_pass.min4.phy -m MFP -T 16 -B 1000
```

---

## PCA（可选）

```bash
# 需要群体分组信息 pop.info（两列：样本名 \t 群体）
VCF2PCACluster -InVCF final_filter_snp_pass.vcf \
    -OutPut filter_snp_result \
    -InSampleGroup pop.info
```

---

## IGV 可视化

1. 下载 IGV：https://software.broadinstitute.org/software/igv/download
2. 在 IGV 里加载参考基因组 `reference.fasta`，再逐个载入过滤后的 VCF。
3. 位点颜色含义：**深蓝 = 杂合突变，青绿 = 纯合突变，灰 = 纯合未突变**。IGV 上只有灰色条带（覆盖度）上是可信的变异。
4. VCF 各列：`POS` 变异位置、`REF` 参考等位基因、`ALT` 变异等位基因（重点看这列）。

---

## 批量处理脚本（多线程并行）

> 适合样本多、想一次跑完"质控 → 比对 → 排序去重 → 建索引"的场景。
> 把样本名写进 `sample.list`，reads 放在 `00.raw/`，参考基因组放 `02.ref/reference.fasta`。

```bash
#!/bin/bash
set -euo pipefail

ref="02.ref/reference.fasta"
mkdir -p 00.raw 01.clean 02.ref 03.bam

bwa index "$ref"
samtools faidx "$ref"
picard CreateSequenceDictionary R="$ref" O="${ref%.*}.dict"

# 并行函数：一个样本 → 一个最终 markdup BAM
process_sample() {
    local s=$1
    local r1="00.raw/${s}_R1.fq.gz"
    local r2="00.raw/${s}_R2.fq.gz"

    # 质控
    trimmomatic PE -phred33 "$r1" "$r2" \
        01.clean/${s}_1.paired.fq.gz 01.clean/${s}_1.unpaired.fq.gz \
        01.clean/${s}_2.paired.fq.gz 01.clean/${s}_2.unpaired.fq.gz \
        ILLUMINACLIP:$SOFTWARE_DIR/Trimmomatic-0.39/adapters/TruSeq3-PE.fa:2:30:10 \
        LEADING:20 TRAILING:20 SLIDINGWINDOW:4:20 MINLEN:50

    # 比对 + 排序
    bwa mem -t 4 -R "@RG\tID:${s}\tPL:illumina\tSM:${s}" \
        "$ref" 01.clean/${s}_1.paired.fq.gz 01.clean/${s}_2.paired.fq.gz \
        | samtools sort -@ 3 -o 03.bam/${s}.sorted.bam -

    # 去重 + 索引
    gatk MarkDuplicates -I 03.bam/${s}.sorted.bam \
        -O 03.bam/${s}.markdup.bam -M 03.bam/${s}.metrics.txt
    samtools index 03.bam/${s}.markdup.bam
    rm -f 03.bam/${s}.sorted.bam
}

# 最多同时跑 4 个样本
n=0
while read -r s; do
    process_sample "$s" &
    ((n++))
    (( n % 4 == 0 )) && wait
done < sample.list
wait

# 群体联合分型
bam_list=$(ls 03.bam/*.markdup.bam | sed 's/^/-I /' | tr '\n' ' ')
gatk HaplotypeCaller -R "$ref" $bam_list --genotyping_mode DISCOVERY -O raw.vcf
```

## 补充：旧版 bwa aln/sampe 比对路线（了解即可）

早期流程用 `bwa aln` 生成 `.sai` 再 `bwa sampe` 合并成 SAM，然后 `picard ReorderSam` 重排。**现在统一推荐 `bwa mem`**，只需一条命令，且输出质量更好。如果你在维护旧脚本，大致顺序是：

```bash
bwa aln ref.fasta R1.fq.gz > 1.sai
bwa aln ref.fasta R2.fq.gz > 2.sai
bwa sampe -r "@RG\tID:s\tLB:s\tSM:s\tPL:ILLUMINA" ref.fasta 1.sai 2.sai R1.fq.gz R2.fq.gz > s.sam
samtools view -b s.sam -o s.bam
samtools sort s.bam -o s.sorted.bam
picard MarkDuplicates INPUT=s.sorted.bam OUTPUT=s.markdup.bam METRICS_FILE=s.metrics
```

## 补充：线粒体基因组的 bwa mem 参数

线粒体数据异质性高、变异密度大，默认罚分可能漏检，可适当放宽：

```bash
bwa mem -t 8 -M -B 2 -O 5 -E 1 -L "3,3" \
    mt_reference.fasta sample_R1.fastq.gz sample_R2.fastq.gz > sample_mt.sam
# -B 2  降低错配罚分，容忍更多变异/异质性
# -O 5 -E 1  略降空位开放/延伸罚分
# -L 3,3  降低剪接罚分，保留更多末端信息
```

## 常见问题

- **GATK 报 `Invalid argument` 或 `-T` 不认识**：`-T SelectVariants` 等是 GATK3 旧语法，GATK4 已改为子命令形式（`gatk SelectVariants`），本文统一用 GATK4 语法。
- **`bwa aln` 比对后 call 不出 SNP**：改用 `bwa mem`（自带 soft-clip 与 RG 处理更稳），GATK 官方也只推荐 `bwa mem`。
- **`CombineGVCFs` 只锁定位点，不是最终结果**：合并后必须再跑 `GenotypeGVCFs` 才能得到可用的 VCF。
- **线粒体/已组装序列的 SNP**：直接走「方法三」的 `mafft + snp-sites`，不需要再比对到参考基因组。
