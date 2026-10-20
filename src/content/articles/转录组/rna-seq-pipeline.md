---
id: 9
title: "RNA-seq 分析流程（hisat2 + featureCounts）"
excerpt: "trim_galore 质控 → hisat2 比对 → featureCounts 定量，第 5 节是一键完整脚本。"
category: "转录组"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "RNA-seq"
  - "hisat2"
  - "featureCounts"
---

> 有参转录组定量流程：质控 → HISAT2 比对 → SAM 转 BAM → featureCounts 定量。
> **第 5 节是整合后的完整一键脚本（推荐直接用）**，第 1–4 节是分步说明，便于理解每一步。

# 1.软件安装和数据准备

略

# 2.质控和数据过滤

```bash
#!/bin/bash
# 遍历所有 *_1.clean.fq.gz 文件
for R1 in *_1.clean.fq.gz; do
  # 检查是否找到匹配文件
  if [[ ! -e "$R1" ]]; then
    echo "未找到 *_1.clean.fq.gz 文件"
    exit 1
  fi

  # 提取文件前缀（如 Pal389OE9）
  prefix="${R1%%_1.clean.fq.gz}"

  # 生成对应的 R2 文件名
  R2="${prefix}_2.clean.fq.gz"

  # 检查 R2 文件是否存在
  if [[ ! -e "$R2" ]]; then
    echo "错误：找不到配对的$R2"
    continue
  fi

  # 创建输出目录
  mkdir -p "./${prefix}"

  # 运行 trim_galore
  trim_galore \
    --quality 25 \
    --stringency 1 \
    --length 50 \
    --paired \
    --output_dir "./${prefix}" \
    "$R1" "$R2"

  # 显示进度
  echo "已完成处理: $prefix"
done

echo "所有文件处理完成！"


```

# 3.序列比对

```bash
#!/bin/bash
# 遍历所有 _1.clean.fq.gz 文件
for R1 in *_1.clean.fq.gz; do
    # 检查 R1 文件是否存在
    if [[ ! -e "$R1" ]]; then
        echo "错误: 未找到 _1.clean.fq.gz 文件"
        exit 1
    fi

    # 提取文件名前缀（移除 _1.clean.fq.gz 后缀）
    prefix="${R1%%_1.clean.fq.gz}"
    # 构建配对文件 R2 的名称
    R2="${prefix}_2.clean.fq.gz"  # 修复: 添加 $ 符号正确展开变量

    # 检查 R2 文件是否存在, 如果不存在则跳过当前循环
    if [[ ! -e "$R2" ]]; then
        echo "警告: 未找到配对文件 ${R2}, 跳过!"
        continue
    fi

    # 创建输出目录（-p 防止目录已存在时报错）
    mkdir -p "./${prefix}_hisat" "./${prefix}_bam" || { echo "目录创建失败"; exit 1; }

    echo "处理文件: ${prefix}..."
    
    # 运行 HISAT2 比对
    hisat2 --new-summary -p 10 -x ../01.ref/genome -1 "./$R1" -2 "./$R2" -S "./${prefix}_hisat/${prefix}.sam" --rna-strandness RF || { echo "HISAT2 失败"; exit 1; }
    echo "sam文件转化完成"  # 修复: 改为英文引号
    
    # 转换 SAM 到 sorted BAM
    samtools sort -o "./${prefix}_bam/${prefix}_sorted.bam" "./${prefix}_hisat/${prefix}.sam" || { echo "samtools 失败"; exit 1; }  # 修复: 输出指定为文件而非目录
    echo "完成sam_bam压缩"
    
    echo "${prefix} 处理完成!"
done

echo "所有文件已经处理完毕!"
```

# 4.表达定量



```
featureCounts -a ../../01.ref/ref_genomic.gtf -T 10 -p --countReadPairs -g gene_id -t exon -M -O -o H2DG85 ../sorted_bam/H2DG85_sorted.bam
```







# 5.完整一键脚本（推荐）

> 下面是把质控 → 比对 → 转换 → 定量串起来的完整脚本，带依赖检查、日志、错误处理。

```bash
#!/bin/bash
#######################################
# 参数设置（请根据实际情况修改）
#######################################
REF_DIR="../01.ref"                  # 参考文件目录
REF_FASTA="${REF_DIR}/ref_genomic.fa" # 参考基因组FASTA文件
REF_GTF="${REF_DIR}/ref.gtf"          # 参考基因组注释文件
INDEX_DIR="${REF_DIR}/hisat2_index"   # HISAT2索引存放目录
THREADS=10                            # 线程数
INDEX_NAME="genome"                   # 索引基名

#######################################
# 创建目录树结构
#######################################
mkdir -p \
  ../raw_data \
  ../trimmed \
  ../alignment/{hisat_sam,sorted_bam} \
  ../counts \
  logs || { echo "目录创建失败！"; exit 1; }

# 创建索引目录（如果不存在）
mkdir -p "$INDEX_DIR"

#######################################
# 检查依赖工具是否安装
#######################################
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "错误: $1 未找到，请安装后再运行脚本" >&2
    exit 1
  fi
}

for cmd in trim_galore hisat2 hisat2-build samtools featureCounts; do
  check_command "$cmd"
done

#######################################
# Step 0: 构建HISAT2索引
#######################################
echo "[$(date +'%F %T')] 步骤0: 检查参考基因组索引"
if [[ ! -e "${INDEX_DIR}/${INDEX_NAME}.1.ht2" ]]; then
  echo "HISAT2索引未找到，开始构建..."
  
  # 检查参考基因组文件是否存在
  if [[ ! -f "$REF_FASTA" ]]; then
    echo "错误: 参考基因组文件未找到：$REF_FASTA" | tee -a logs/error.log
    exit 1
  fi
  
  # 构建索引
  hisat2-build -p "$THREADS" \
    "$REF_FASTA" \
    "${INDEX_DIR}/$INDEX_NAME" > logs/index_build.log 2>&1
  
  # 检查索引是否构建成功
  if [[ $? -ne 0 ]] || [[ ! -e "${INDEX_DIR}/${INDEX_NAME}.1.ht2" ]]; then
    echo "索引构建失败，请检查日志：logs/index_build.log" | tee -a logs/error.log
    exit 1
  fi
  echo "HISAT2索引构建完成！"
else
  echo "检测到现有HISAT2索引，跳过构建步骤"
fi

#######################################
# 移动原始数据到统一目录
#######################################
mv *_1.clean.fq.gz *_2.clean.fq.gz raw_data/ 2>/dev/null

#######################################
# 主流程：质控 → 比对 → 转换 → 定量
#######################################
total_samples=0
processed_samples=0

# Step 1: 使用trim_galore进行质控
for R1 in raw_data/*_1.clean.fq.gz; do
  ((total_samples++))
  
  # 获取样本前缀
  prefix=$(basename "$R1" | sed 's/_1\.clean\.fq\.gz//')
  echo -e "\n>>> 开始处理样本($total_samples): $prefix"
  echo "[$(date +'%F %T')] 步骤1: 质控 - $prefix" | tee -a logs/process.log
  
  # 配对的R2文件
  R2="raw_data/${prefix}_2.clean.fq.gz"
  if [[ ! -e "$R2" ]]; then
    echo "错误: 找不到配对文件 $R2" | tee -a logs/error.log
    continue
  fi

  # 运行trim_galore
  trim_galore \
    --quality 25 \
    --stringency 1 \
    --length 50 \
    --paired \
    --output_dir trimmed/"$prefix" \
    "$R1" "$R2" > logs/"${prefix}_trim.log" 2>&1
    
  # 检查输出
  if [[ ! -e "trimmed/${prefix}/${prefix}_1_val_1.fq.gz" ]]; then
    echo "质控失败: $prefix (检查日志: logs/${prefix}_trim.log)" | tee -a logs/error.log
    continue
  fi

  # Step 2: 使用HISAT2进行比对
  echo "[$(date +'%F %T')] 步骤2: 比对 - $prefix" | tee -a logs/process.log
  
  hisat2 --new-summary \
    -p $THREADS \
    -x "${INDEX_DIR}/${INDEX_NAME}" \
    -1 "trimmed/${prefix}/${prefix}_1_val_1.fq.gz" \
    -2 "trimmed/${prefix}/${prefix}_2_val_2.fq.gz" \
    -S alignment/hisat_sam/"${prefix}.sam" \
    --rna-strandness RF > logs/"${prefix}_align.log" 2>&1
    
  if [[ $? -ne 0 ]]; then
    echo "比对失败: $prefix (检查日志: logs/${prefix}_align.log)" | tee -a logs/error.log
    continue
  fi

  # Step 3: 转换SAM到sorted BAM
  echo "[$(date +'%F %T')] 步骤3: 格式转换 - $prefix" | tee -a logs/process.log
  
  samtools sort \
    -@ $THREADS \
    -o alignment/sorted_bam/"${prefix}_sorted.bam" \
    alignment/hisat_sam/"${prefix}.sam" > logs/"${prefix}_sort.log" 2>&1
  
  if [[ $? -ne 0 ]]; then
    echo "BAM转换失败: $prefix" | tee -a logs/error.log
    continue
  fi
  
  # 清理临时SAM文件
  rm alignment/hisat_sam/"${prefix}.sam"
  
  ((processed_samples++))
  echo "${prefix} 处理成功！"
done

#######################################
# Step 4: 使用featureCounts批量定量
#######################################
if [[ $processed_samples -gt 0 ]]; then
  echo -e "\n[$(date +'%F %T')] 步骤4: 基因表达定量" | tee -a logs/process.log
  
  # 准备BAM文件列表
  BAM_FILES=(alignment/sorted_bam/*_sorted.bam)
  
  featureCounts \
    -a "$REF_GTF" \
    -T $THREADS \
    -p --countReadPairs \
    -g gene_id \
    -t exon \
    -M -O \
    -o counts/gene_counts.txt \
    "${BAM_FILES[@]}" > logs/featureCounts.log 2>&1
  
  # 生成简洁版计数矩阵
  tail -n +3 counts/gene_counts.txt | cut -f1,7- \
    > counts/gene_counts_matrix.txt
  
  echo "定量结果保存至: counts/gene_counts_matrix.txt"
fi

#######################################
# 最终报告与目录结构
#######################################
echo -e "\n========================================"
echo "流程完成!"
echo "样本总数: $total_samples"
echo "成功处理: $processed_samples"
echo "失败样本: $((total_samples - processed_samples))"

# 生成目录树
echo -e "\n项目目录结构:"
tree -L 3 --filelimit 10

```
