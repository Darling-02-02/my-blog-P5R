---
id: 15
title: "GFF 文件 CDS 修复"
excerpt: "用 AGAT + fix_gff_cds.pl 修复 GFF 注释文件里的 CDS 坐标问题。"
category: "基因注释"
date: "2026-10-20"
readTime: "1 分钟"
tags:
  - "注释"
---

> 某些工具生成的 GFF 只有 `mRNA`/`tRNA` 特征、缺少 `CDS` 行，导致下游（gffread 提蛋白等）失败。这里用 AGAT 统一格式，再用一个 perl 脚本为每个 `mRNA`/`tRNA` 补一条 `CDS`。

## 步骤

```bash
# 1. 用 AGAT 统一 GFF 格式
agat_convert_sp_gxf2gxf.pl --gff input.gff -o step1.gff
```

如下是 `fix_gff_cds.pl` 的脚本内容（把它存成文件后运行）：

```perl
#!/usr/bin/perl
use strict;
use warnings;

my $input_file = $ARGV[0];
my $output_file = $ARGV[1] || $input_file =~ s/(\.gff)?$/_fixed.gff/r;

open(my $in, '<', $input_file) or die "无法打开输入文件: $!";
open(my $out, '>', $output_file) or die "无法打开输出文件: $!";

while (my $line = <$in>) {
    # 保留注释行
    if ($line =~ /^#/) {
        print $out $line;
        next;
    }
    
    # 处理原始行
    chomp $line;
    my @fields = split /\t/, $line;
    
    # 打印原始行
    print $out join("\t", @fields), "\n";
    
    # 为 mRNA 和 tRNA 添加 CDS 行
    if ($fields[2] eq 'mRNA' || $fields[2] eq 'tRNA') {
        # 提取 ID 和名称
        my ($id, $name) = ("", "");
        if ($fields[8] =~ /ID=([^;]+)/) {
            $id = $1;
            $id =~ s/^transcript_//; # 移除 transcript_ 前缀
        }
        if ($fields[8] =~ /Name=([^;]+)/) {
            $name = $1;
        } elsif ($fields[8] =~ /gene_id=([^;]+)/) {
            $name = $1;
        }
        
        # 创建 CDS 行
        my @cds_fields = @fields;
        $cds_fields[2] = 'CDS';  # 修改特征类型为 CDS
        $cds_fields[8] = "ID=cds_$id;Parent=$id;Name=$name";
        
        # 打印 CDS 行
        print $out join("\t", @cds_fields), "\n";
    }
}

close $in;
close $out;

print "修复完成! 输出文件: $output_file\n";

```

```bash
# 2. 运行脚本补 CDS 行
./fix_gff_cds.pl step1.gff step2.gff

# 3. 修复 ID 属性（AGAT 统一 ID 命名）
agat_sp_manage_IDs.pl --gff step2.gff -o step3.gff
```

## 常见问题

- **脚本只补了 `mRNA`/`tRNA` 的 CDS**：如果你的 GFF 还缺 `gene`、`exon` 等特征，脚本里 `if ($fields[2] eq 'mRNA' || $fields[2] eq 'tRNA')` 那行可按需扩展。
- **ID 带 `transcript_` 前缀**：脚本会自动去掉，生成 `ID=cds_xxx`，避免与转录本 ID 冲突。
