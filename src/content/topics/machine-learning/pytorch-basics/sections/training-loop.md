---
title: 一个能复现的训练循环
order: 3
readTime: 10 分钟
---

训练循环看起来都一样，但能不能复现，差别全在细节里。

## 骨架

```python
def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total, count = 0.0, 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        out = model(x)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()

        total += loss.item() * y.size(0)
        count += y.size(0)
    return total / count
```

验证循环结构相同，但要用 `model.eval()` 加 `torch.no_grad()`。

## 让它可复现

- 固定随机种子：`torch.manual_seed(seed)`，如果用了 cuDNN 还要 `torch.backends.cudnn.deterministic = True`
- 保存 config 而不只是权重：学习率、批量大小、优化器、种子都写进去
- 记录每个 epoch 的训练/验证损失，而不是只记最后一个

## 评估指标别只看损失

损失下降不等于任务变好。分类任务至少同时看准确率和混淆矩阵，
不平衡数据下还要看 F1 或 AUC。损失只用来判断优化是否正常。
