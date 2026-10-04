---
title: Qwen3.8-27B 本地部署教程
summary: ---
order: 1
tags: []
---

# Qwen3.8-27B 本地部署教程

## Ubuntu 18.04 + NVIDIA RTX 3090 × 3 + Docker + CUDA 12.2 + llama.cpp

> 本文整理当前已经实际跑通的 **Qwen3.8-27B + llama.cpp** 部署链路。
>
> 目标：不升级学校服务器 Ubuntu、NVIDIA Driver 或宿主机 CUDA，通过 CUDA 12.2 Docker 容器运行 llama.cpp，并使用 3 张 RTX 3090 推理 Qwen3.8-27B Q4_K_M。
>
> 本文不混入尚未验证的 Qwen-Image-2.1 部署。

---

## 1. 环境

```text
OS: Ubuntu 18.04.6 LTS
CPU: AMD Ryzen Threadripper PRO 5975WX, 32 cores
RAM: 约 128 GB
GPU: 3 × NVIDIA RTX 3090, 每张 24 GB
NVIDIA Driver: 535.104.05
nvidia-smi CUDA: 12.2
Docker: 20.10.21
```

宿主机 `nvcc` 是 CUDA 9.1，但不影响本方案，因为 CUDA 运行环境放在 Docker 中：

```text
Ubuntu 18.04 主机
        ↓
Docker
        ↓
CUDA 12.2.2 / Ubuntu 22.04
        ↓
llama.cpp
        ↓
RTX 3090 × 3
```

---

## 2. 验证 Docker GPU

```bash
docker run --rm --gpus all   nvidia/cuda:12.2.2-devel-ubuntu22.04   nvidia-smi
```

应能看到 3 张 RTX 3090。

这一步验证的是 NVIDIA Driver、NVIDIA Container Toolkit、Docker 与 CUDA 容器之间的 GPU 链路。

---

## 3. 项目目录

```text
~/project/research-ai/
├── codegraph
├── code-rag
├── data
├── finetune
├── huggingface
├── llama.cpp
├── logs
├── models
├── rag
└── server
```

主要职责：

- `llama.cpp/`：llama.cpp 源码和编译结果
- `models/`：模型相关文件
- `server/`：JVS、启动脚本、API Key
- `rag/`：文献 RAG
- `code-rag/`：代码 RAG
- `codegraph/`：代码图
- `finetune/`：后续 QLoRA / 微调
- `data/`：论文、实验数据等

---

## 4. 编译 llama.cpp

llama.cpp：

```bash
~/project/research-ai/llama.cpp
```

由于宿主机 CUDA 太旧，CUDA 版本的 llama.cpp 在 **CUDA 12.2 Docker** 中编译。

编译后主要程序：

```text
llama.cpp/build/bin/llama-cli
llama.cpp/build/bin/llama-server
```

检查 GPU：

```bash
./build/bin/llama-cli --list-devices
```

成功时可以看到：

```text
CUDA0 RTX 3090
CUDA1 RTX 3090
CUDA2 RTX 3090
```

---

## 5. Qwen3.8-27B 模型

当前使用：

```text
模型：Qwen3.8-27B
格式：GGUF
量化：Q4_K_M
参数量：约 27.3B
模型文件：约 17 GB
上下文：262144
```

当前模型架构识别为：

```text
qwen35
```

---

## 6. 复用 Ollama 已下载的模型

此前模型通过 Ollama 下载，Ollama Docker Volume：

```text
/var/lib/docker/volumes/ollama/_data
```

模型 Blob：

```text
/var/lib/docker/volumes/ollama/_data/models/blobs/
```

当前 Qwen3.8-27B Q4_K_M：

```text
sha256-f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d
```

完整路径：

```text
/var/lib/docker/volumes/ollama/_data/models/blobs/sha256-f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d
```

文件是 GGUF。

不需要复制模型，直接把 Ollama 数据目录挂载到 llama.cpp 容器即可。

---

## 7. llama-cli 单次推理

在 CUDA 12.2 容器中：

```bash
./build/bin/llama-cli   -m /ollama-data/models/blobs/sha256-f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d   -ngl 99   --split-mode layer   --tensor-split 1,1,1   -p "请用中文介绍一下什么是Q4_K_M量化，控制在100字以内。"   -n 128
```

核心参数：

```text
-ngl 99
```

尽可能将模型层放到 GPU。

```text
--split-mode layer
```

使用多 GPU layer 分配。

```text
--tensor-split 1,1,1
```

让 3 张 RTX 3090 协同运行。

---

## 8. 实测推理性能

当前已经验证成功：

```text
Prompt processing: 约 321.7 tokens/s
Generation:        约 42.9 tokens/s
```

因此：

> Qwen3.8-27B Q4_K_M 可以在 3×RTX 3090 + CUDA 12.2 + llama.cpp 环境下进行 GPU 推理。

---

## 9. llama-server 长期 API 服务

长期运行使用：

```text
llama-server
```

启动：

```bash
./build/bin/llama-server   -m /ollama-data/models/blobs/sha256-f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d   -ngl 99   --split-mode layer   --tensor-split 1,1,1   -c 262144   --host 0.0.0.0   --port 8080
```

`-c 262144`：

```text
262144 tokens = 256K context
```

---

## 10. API

本机：

```text
http://127.0.0.1:8080/v1
```

服务器公网 IPv4：

```text
http://59.79.241.232:8080/v1
```

模型列表：

```text
GET /v1/models
```

聊天：

```text
POST /v1/chat/completions
```

完整聊天地址：

```text
http://59.79.241.232:8080/v1/chat/completions
```

---

## 11. API Key

当前文件：

```text
~/project/research-ai/server/api-keys.txt
```

服务通过：

```text
--api-key-file
```

读取。

建议：

```bash
chmod 600 ~/project/research-ai/server/api-keys.txt
```

不要把真实 API Key 写入代码、Git 仓库或公开文档。

---

## 12. Docker 长期运行

容器名：

```text
llama-qwen27b
```

基础镜像：

```text
nvidia/cuda:12.2.2-devel-ubuntu22.04
```

核心：

```bash
docker run -d   --name llama-qwen27b   --restart unless-stopped   --gpus all   -p 8080:8080   ...
```

挂载：

```text
宿主机 ~/project/research-ai/llama.cpp
        ↓
容器 /app
```

以及：

```text
宿主机 /var/lib/docker/volumes/ollama/_data
        ↓
容器 /ollama-data:ro
```

模型使用只读挂载，避免 llama.cpp 修改 Ollama 模型文件。

---

## 13. 当前 start.sh

文件：

```text
~/project/research-ai/server/start.sh
```

内容：

```bash
#!/bin/bash

set -e

NAME="llama-qwen27b"

LLAMA_ROOT="/home/zhaoyihao/project/research-ai/llama.cpp"
OLLAMA_ROOT="/var/lib/docker/volumes/ollama/_data"
API_KEY_FILE="/home/zhaoyihao/project/research-ai/server/api-keys.txt"

MODEL_FILE="models/blobs/sha256-f5f1dd8920d417aac2718b0bda3403da274301efdd6760b4f0f4b864ff2ad57d"

echo "Starting ${NAME}..."

docker rm -f "${NAME}" 2>/dev/null || true

docker run -d   --name "${NAME}"   --restart unless-stopped   --gpus all   -p 8080:8080   -v "${LLAMA_ROOT}:/app"   -v "${OLLAMA_ROOT}:/ollama-data:ro"   -v "${API_KEY_FILE}:/run/secrets/llama-api-keys:ro"   -w /app   -e LD_LIBRARY_PATH=/app/build/bin   nvidia/cuda:12.2.2-devel-ubuntu22.04   /app/build/bin/llama-server   -m "/ollama-data/${MODEL_FILE}"   -ngl 99   --split-mode layer   --tensor-split 1,1,1   -c 262144   --alias qwen3.8-27b   --api-key-file /run/secrets/llama-api-keys   --cors-origins localhost,127.0.0.1   --host 0.0.0.0   --port 8080

echo "Container started."
echo "API: http://127.0.0.1:8080/v1"
```

执行：

```bash
chmod +x ~/project/research-ai/server/start.sh
```

启动：

```bash
cd ~/project/research-ai/server
sudo bash ./start.sh
```

---

## 14. 检查服务

查看容器：

```bash
docker ps
```

查看日志：

```bash
docker logs -f llama-qwen27b
```

查看 8080：

```bash
ss -lntp | grep 8080
```

正常：

```text
0.0.0.0:8080
[::]:8080
```

---

## 15. 测试 API

模型列表：

```bash
curl   -H "Authorization: Bearer YOUR_API_KEY"   http://127.0.0.1:8080/v1/models
```

正常情况下模型名称：

```text
qwen3.8-27b
```

---

## 16. Python 调用

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://59.79.241.232:8080/v1",
    api_key="YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="qwen3.8-27b",
    messages=[
        {
            "role": "user",
            "content": "请解释一下 QLoRA 是什么。"
        }
    ]
)

print(response.choices[0].message.content)
```

因此完整链路：

```text
Python / JVS / 其他客户端
          ↓
OpenAI-compatible API
          ↓
llama-server :8080
          ↓
Qwen3.8-27B Q4_K_M
          ↓
RTX 3090 × 3
```

---

## 17. JVS 与 27B

当前 JVS：

```text
JVS
 ↓
http://127.0.0.1:8080/v1/chat/completions
 ↓
llama-server
 ↓
Qwen3.8-27B
```

JVS 不直接操作 GGUF。

JVS 负责：

```text
用户交互
Prompt
Workspace
Paper Mode
Nature Skills
RAG
```

llama-server 负责：

```text
模型加载
GPU 推理
OpenAI-compatible API
```

---

## 18. JVS

JVS 主程序：

```text
~/project/research-ai/server/research-ai.py
```

系统命令：

```text
JVS
```

软链接：

```text
/usr/local/bin/JVS
```

检查：

```bash
which JVS
```

运行：

```bash
JVS
```

当前支持：

```text
/exit
/clear
/model
/paper
/workspace
```

---

## 19. 多 GPU 原理

当前：

```text
RTX 3090 #0 ─┐
RTX 3090 #1 ─┼── Qwen3.8-27B
RTX 3090 #2 ─┘
```

主要配置：

```text
--split-mode layer
--tensor-split 1,1,1
```

三张卡共同完成一次模型推理，不是每张卡各自运行一个完整模型。

---

## 20. 为什么不用主机直接运行

宿主机：

```text
Ubuntu 18.04
Driver 535
CUDA 9.1
```

直接运行现代 CUDA 版本的 llama.cpp 会遇到宿主机 CUDA runtime 太旧的问题。

当前正确方案：

```text
Ubuntu 18.04
    ↓
NVIDIA Driver 535
    ↓
Docker
    ↓
CUDA 12.2.2
    ↓
Ubuntu 22.04
    ↓
llama.cpp
```

核心思想：

> 宿主机提供 NVIDIA Driver，Docker 提供现代 CUDA 用户态环境。

---

## 21. Ollama 为什么不继续负责推理

当前 Ollama 检测到：

```text
NVIDIA Driver: 535
```

并提示：

```text
required_driver="550 or newer"
```

因此当时没有使用 GPU，而是：

```text
compute=cpu
```

于是改成：

```text
llama.cpp
+
CUDA 12.2 Docker
```

最终实现 GPU 推理。

---

## 22. GGUF 与训练模型的区别

当前：

```text
Qwen3.8-27B Q4_K_M GGUF
```

主要用于：

```text
llama.cpp 推理
```

如果后续进行 QLoRA 微调，不应直接拿这个 GGUF 作为标准 Transformers 训练底座。

训练应准备 Hugging Face / safetensors 格式：

```text
Qwen3.8-27B
        │
        ├── GGUF Q4_K_M
        │       ↓
        │   llama.cpp
        │       ↓
        │     推理
        │
        └── HF safetensors
                ↓
             PyTorch
                ↓
              QLoRA
```

当前 17GB GGUF 不需要删除。

---

## 23. 最终架构

```text
                         学校服务器
                   Ubuntu 18.04.6
                   Driver 535.104.05
                           │
                           ↓
                  Docker GPU Passthrough
                           │
                           ↓
               CUDA 12.2.2 / Ubuntu 22.04
                           │
                           ↓
                      llama.cpp
                           │
                 ┌─────────┴─────────┐
                 ↓                   ↓
             llama-cli         llama-server
                 │                   │
                 ↓                   ↓
          单次命令行推理       OpenAI API :8080
                                     │
                         ┌───────────┴───────────┐
                         ↓                       ↓
                        JVS                 其他客户端
                         │
              ┌──────────┼──────────┐
              ↓          ↓          ↓
           Paper      Workspace     RAG
              │
              ↓
         Nature Skills
```

GPU：

```text
RTX 3090 #0 ─┐
RTX 3090 #1 ─┼── Qwen3.8-27B Q4_K_M
RTX 3090 #2 ─┘
```

API：

```text
http://59.79.241.232:8080/v1
```

---

## 24. 一句话总结

本方案的核心：

```text
Ubuntu 18.04 + Driver 535
          ↓
Docker CUDA 12.2
          ↓
llama.cpp
          ↓
复用 Ollama 已下载的 Qwen3.8-27B Q4_K_M GGUF
          ↓
3 × RTX 3090
          ↓
llama-server :8080
          ↓
OpenAI-compatible API
          ↓
JVS
```

这是当前已经实际验证跑通的 Qwen3.8-27B 本地 GPU 推理方案。
