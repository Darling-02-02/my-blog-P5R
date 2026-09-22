---
title: 数据管道
order: 1
readTime: 7 分钟
---

数据管道的第一原则：**划分只能做一次，而且必须在任何预处理之前。**

## 先划分，再统计

归一化的均值方差、分词器的词表、缺失值填充的中位数，全部只能从训练集上算。
在验证集/测试集上算 = 数据泄漏，指标会虚高，上线就崩。

```python
train, val, test = split(dataset, ratios=(0.7, 0.15, 0.15), seed=42)
stats = compute_stats(train)        # 只统计训练集
train = normalize(train, stats)
val = normalize(val, stats)
test = normalize(test, stats)
```

## DataLoader 的两个参数

- `num_workers`：多进程读数据。设成 CPU 核数的一半起步，太多会被进程调度拖慢。
- `pin_memory=True`：配合 GPU 训练，把数据放进锁页内存，拷贝更快。

## 一定要能"过拟合一个小批"

拿 8 到 32 个样本，关掉正则，训练几百步。如果损失降不到接近零，
说明管道或标签有问题，而不是模型不够大。这一步能省掉几个小时的瞎调参。
