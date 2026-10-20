---
id: 17
title: "BAM 转 FASTA 流程"
excerpt: "把比对好的 BAM 提取成 FASTA 序列，用于下游组装或比对。"
category: "基因注释"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "BAM"
  - "FASTA"
  - "samtools"
---

> 把目录下所有 `.bam` 用 `samtools fastq` 转成压缩的 `.fastq.gz`，适合 PacBio/ONT 下机的多个 BAM 批量转 fastq。

```
#!/bin/bash
set -euo pipefail

# 配置参数（按需改路径）
BAM_DIR="/path/to/pacbio/rawdata"      # BAM 所在目录
OUTPUT_DIR="/path/to/pacbio/fastq"     # 输出目录
THREADS=8

# 初始化环境
mkdir -p "${OUTPUT_DIR}"
chmod 755 "${OUTPUT_DIR}"
export TOTAL_FILES=$(ls "${BAM_DIR}"/*.bam | wc -l)
COUNT=0

# 主循环
for BAM_FILE in "${BAM_DIR}"/*.bam; do
    SAMPLE_NAME=$(basename "${BAM_FILE}" .bam)
    OUTPUT="${OUTPUT_DIR}/${SAMPLE_NAME}.fastq.gz"
    ((COUNT++))
    
    echo "===== 处理样本 ${COUNT}/${TOTAL_FILES}: ${SAMPLE_NAME} ====="
    echo "输入：${BAM_FILE}"
    echo "输出：${OUTPUT}"
    
    # 核心转换命令
    samtools fastq \
        --threads ${THREADS} \
        "${BAM_FILE}" | 
    pigz -p 4 > "${OUTPUT}"  # 使用pigz加速压缩
    
    # 验证输出
    if [ -s "${OUTPUT}" ]; then
        echo "成功生成：${OUTPUT}"
    else
        echo "[ERROR] 文件为空，转换失败"
        exit 1
    fi
done

echo "所有样本转换完成！结果目录：${OUTPUT_DIR}"

```
