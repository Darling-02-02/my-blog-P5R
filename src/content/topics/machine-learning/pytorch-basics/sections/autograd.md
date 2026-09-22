---
title: 自动求导与梯度
order: 2
readTime: 6 分钟
---

PyTorch 的自动求导只做一件事：记录你在张量上做过的运算，反向遍历时链式求导。

## 计算图是动态的

每次前向都会重新建图，所以 Python 里的 `if`、`for` 都能影响图结构。这是它比静态图灵活的地方，
代价是每次迭代都有建图开销。

```python
x = torch.randn(3, requires_grad=True)
loss = (x ** 2).sum()
loss.backward()
print(x.grad)  # 2x
```

## 三个常见的坑

1. **梯度会累加**，不是覆盖。所以每个 step 开头必须 `optimizer.zero_grad()`。
2. **`torch.no_grad()`** 下的运算不建图，推理和评估时务必加上，省显存也省时间。
3. **`.item()` 会把张量变成 Python 数字**，这一步会断开梯度，别在损失里顺手调用。

```python
for x, y in loader:
    optimizer.zero_grad()      # 坑 1
    pred = model(x)
    loss = criterion(pred, y)
    loss.backward()
    optimizer.step()

with torch.no_grad():          # 坑 2
    eval_loss = criterion(model(val_x), val_y)
```
