---
title: 张量与设备管理
order: 1
readTime: 8 分钟
---

张量是 PyTorch 里唯一的数据载体。刚开始学的时候，最容易忽略的不是形状，而是**设备**。

## 形状、dtype 与设备

三个属性里任何一个对不上，报错信息都不会直接告诉你原因。习惯是每写一行都问自己：
它的 shape 是什么、dtype 是什么、在 CPU 还是 GPU 上。

```python
import torch

x = torch.randn(4, 3)
w = torch.randn(3, 8)

print(x.shape, x.dtype, x.device)
y = x @ w
print(y.shape)  # torch.Size([4, 8])
```

## 转移设备要显式写

模型和数据必须在同一个设备上。把这件事写成习惯，而不是等报错再补：

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
x = x.to(device)
model = model.to(device)
```

> 经验：训练脚本里只写一次 `device`，所有 `.to(device)` 都引用它。散落的字符串 `'cuda'`
> 是后期换机器时最容易炸的地方。

## 视图与副本

`view` 和 `reshape` 的差别只有一句话：`view` 要求内存连续，`reshape` 不要求。
不确定的时候用 `reshape`，性能敏感的地方再考虑 `view`。

- `view` / `reshape`：改变形状，不复制数据（尽量）
- `permute` / `transpose`：换轴顺序，返回的是视图
- `contiguous()`：把视图变成连续内存的副本
