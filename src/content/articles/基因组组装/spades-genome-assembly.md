---
id: 3
title: "二代基因组拼接（SPAdes）"
excerpt: "Trimmomatic 质控 → SPAdes 拼接 → QUAST/BUSCO 评估，附批量脚本与常见问题。"
category: "基因组组装"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "组装"
  - "质量评估"
---

> 从二代测序 reads 出发，做质控 → SPAdes 拼接 → QUAST/BUSCO 评估 →（可选）基因预测。

## 背景 / 适用场景

- **适用**：细菌、真菌等中小型基因组的 de novo 拼接；有双端测序 reads，无参考基因组。
- **下游**：拼接出的 `scaffolds.fasta` 可继续做基因预测、注释、变异检测、比较基因组等。

## 输入与输出

| 类型 | 内容 |
| --- | --- |
| 输入 | 双端 reads `sample_R1.fq.gz` / `sample_R2.fq.gz`（可多个样本） |
| 输出 | 组装结果 `scaffolds.fasta`（`contigs.fasta` 是未搭桥版本）、`report.html`（QUAST）、BUSCO 报告 |

## 环境依赖

```bash
# spades / quast / busco / funannotate（可选）
conda install -c bioconda spades quast busco
# funannotate 依赖较多，建议按官方文档单独建环境安装
```

---

## 步骤

### 1. 质控（Trimmomatic）

```bash
java -jar $SOFTWARE_DIR/Trimmomatic-0.39/trimmomatic-0.39.jar PE -threads 8 \
    sample_R1.fq.gz sample_R2.fq.gz \
    sample_R1.paired.fq.gz sample_R1.unpaired.fq.gz \
    sample_R2.paired.fq.gz sample_R2.unpaired.fq.gz \
    ILLUMINACLIP:$SOFTWARE_DIR/Trimmomatic-0.39/adapters/TruSeq3-PE-2.fa:2:30:10 \
    LEADING:5 TRAILING:5 SLIDINGWINDOW:4:15 MINLEN:50 TOPHRED33
```

### 2. SPAdes 拼接

```bash
# 推荐写法：-1/-2 指定双端；-k 指定 k-mer 组合
spades.py --isolate -t 16 -m 64 \
    -k 21,33,55,77,99 \
    --cov-cutoff auto \
    -1 sample_R1.paired.fq.gz -2 sample_R2.paired.fq.gz \
    -o spades_out
```

> 参数说明：
> - `--isolate`：单菌株/高覆盖度数据用，假设只有一个基因组（多菌株混合样本不要加）。
> - `-k`：k-mer 列表，必须是 **奇数且 ≤ 127**；范围越大越慢，但能拼出更长的重复区。
> - `-m`：内存上限（GB）；`--cov-cutoff auto` 自动切掉低覆盖度区域，减少错拼。
>
> 旧版写法（多文库时用 `--pe1-1/--pe1-2`）：
> ```bash
> spades.py -k 49,57,65,73 --careful -m 64 --only-assembler \
>     --pe1-1 sample_R1.fq.gz --pe1-2 sample_R2.fq.gz -o out
> ```
> 结果在 `out/scaffolds.fasta`（`contigs.fasta` 是不带搭桥的版本）。

### 3. 组装质量评估（QUAST）

```bash
# 只评估连续性指标（N50、最长 scaffold 等），不评估完整性
quast.py spades_out/scaffolds.fasta -o quast_out
# 完成后打开 quast_out/report.html 查看
```

### 4. 完整性评估（BUSCO）

```bash
# -l 是 BUSCO 数据库，按物种谱系选（如 ascomycota_odb10、basidiomycota_odb10）
busco -i spades_out/scaffolds.fasta \
      -o busco_out \
      -l /path/to/busco_db/ascomycota_odb10 \
      -m genome -c 16 --offline

# 运行较慢，建议挂 nohup 后台跑
nohup busco -i spades_out/scaffolds.fasta -o busco_out \
      -l /path/to/busco_db/ascomycota_odb10 -m genome -c 16 --offline &

# 把多个 BUSCO 结果放到一个目录，可画汇总图
python /path/to/busco/scripts/generate_plot.py -wd busco_results_dir
```

> BUSCO 输出里的 `C:xx%[S:xx%,D:xx%]`：`C` 完整、`S` 单拷贝、`D` 重复；越高越好。

### 5. 重复序列屏蔽 + 基因预测（可选）

```bash
# 屏蔽重复序列，降低基因预测假阳性
funannotate mask -i genome.fa --cpus 12 -o genome_masked.fasta

# 基因预测；--species 与 --busco_seed_species 按自己的物种改
funannotate predict -i genome_masked.fasta \
    --species "Auricularia auricula" \
    -o Auricularia \
    --busco_seed_species agaricus_bisporus \
    --busco_db basidiomycota \
    --cpus 12
```

> 也可以用 AUGUSTUS 做基因预测（详见「直系同源基因」流程里 `Direct homologous genes` 的 AUGUSTUS 章节）。

---

## 批量处理脚本

> 多个样本一次性"质控 + 拼接"，按样本分目录存放。

```python
import os
import glob
import subprocess

BASE_DIR = os.getcwd()
TRIMMOMATIC = "$SOFTWARE_DIR/Trimmomatic-0.39/trimmomatic-0.39.jar"   # 改成实际路径
ADAPTERS    = "$SOFTWARE_DIR/Trimmomatic-0.39/adapters/TruSeq3-PE-2.fa"
THREADS = 10
SPADES_MEMORY = 64

def run_trimmomatic(r1, r2, o1p, o1u, o2p, o2u):
    cmd = (f"java -jar {TRIMMOMATIC} PE -threads {THREADS} {r1} {r2} "
           f"{o1p} {o1u} {o2p} {o2u} "
           f"ILLUMINACLIP:{ADAPTERS}:2:30:10 "
           "LEADING:5 TRAILING:5 SLIDINGWINDOW:4:15 MINLEN:50 TOPHRED33")
    print(cmd)
    subprocess.run(cmd, shell=True, check=True)

def run_spades(r1, r2, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    cmd = (f"spades.py --isolate -t {THREADS} -m {SPADES_MEMORY} "
           f"-k 21,33,55,77,99 --cov-cutoff auto -1 {r1} -2 {r2} -o {out_dir}")
    print(cmd)
    with open(os.path.join(out_dir, "spades.log"), "w") as log:
        subprocess.run(cmd, shell=True, check=True, stdout=log, stderr=subprocess.STDOUT)

for sample_dir in [d for d in os.listdir(BASE_DIR)
                   if os.path.isdir(d) and not d.endswith("_report")]:
    r1s = sorted(glob.glob(os.path.join(sample_dir, "*_1.clean.fq.gz")))
    r2s = sorted(glob.glob(os.path.join(sample_dir, "*_2.clean.fq.gz")))
    if not r1s or not r2s:
        print(f"跳过 {sample_dir}: 未找到测序文件")
        continue
    for i, (r1, r2) in enumerate(zip(r1s, r2s), 1):
        base = os.path.basename(r1).replace("_1.clean.fq.gz", "")
        o1p = f"{sample_dir}/trim/{base}_1.fq.gz"; o1u = f"{sample_dir}/trim/{base}_1.u.fq"
        o2p = f"{sample_dir}/trim/{base}_2.fq.gz"; o2u = f"{sample_dir}/trim/{base}_2.u.fq"
        os.makedirs(f"{sample_dir}/trim", exist_ok=True)
        run_trimmomatic(r1, r2, o1p, o1u, o2p, o2u)
        run_spades(o1p, o2p, f"{sample_dir}/spades/assembly_{i}")
    print(f"√ {sample_dir} 完成")
```

---

## 常见问题

- **`-k` 报错或拼接异常**：k-mer 必须是奇数且 ≤ 127；同一命令里多个 k 之间用逗号分隔、不要有空格。
- **拼接结果碎片化严重**：提高测序覆盖度或换更密的 k-mer 组合；检查是否混入了其他物种（去掉 `--isolate`）。
- **BUSCO 完整度低但 QUAST 数字漂亮**：QUAST 只反映连续性，BUSCO 才反映"基因是否拼全"，两者要一起看。
- **`--careful` 是什么**：会让 SPAdes 做更保守的纠错，速度慢但错拼少；`--isolate` 模式下通常已有足够纠错，可省略。
