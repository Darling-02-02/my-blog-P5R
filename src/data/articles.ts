export interface Article {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

export const articles: Article[] = [
  {
    id: 1,
    title: '生物信息分析基础入门',
    excerpt: '生物信息学相关知识与技术分析，涵盖RNA-seq、单细胞测序、SNP calling等核心流程',
    category: '生物信息',
    date: '2026-02-15',
    readTime: '30 分钟',
    tags: ['生物信息', 'RNA-seq', '单细胞'],
    content: '# 生物信息分析基础入门\n\n## 1. RNA-seq 分析流程\n\n### 1.1 软件安装和数据准备\n\n首先需要安装以下软件：\n- HISAT2: 序列比对工具\n- samtools: BAM文件处理\n- featureCounts: 基因定量\n- trim_galore: 数据质控\n\n### 1.2 质控和数据过滤\n\n使用 trim_galore 对原始数据进行质控：\n\n```bash\n#!/bin/bash\nfor R1 in *_1.clean.fq.gz; do\n  prefix="${R1%%_1.clean.fq.gz}"\n  R2="${prefix}_2.clean.fq.gz"\n  \n  trim_galore \\\n    --quality 25 \\\n    --stringency 1 \\\n    --length 50 \\\n    --paired \\\n    --output_dir "./${prefix}" \\\n    "$R1" "$R2"\ndone\n```\n\n### 1.3 序列比对\n\n使用 HISAT2 进行序列比对：\n\n```bash\n#!/bin/bash\nfor R1 in *_1.clean.fq.gz; do\n    prefix="${R1%%_1.clean.fq.gz}"\n    R2="${prefix}_2.clean.fq.gz"\n    \n    hisat2 --new-summary -p 10 -x ../01.ref/genome \\\n           -1 "./$R1" -2 "./$R2" \\\n           -S "./${prefix}_hisat/${prefix}.sam" \\\n           --rna-strandness RF\n    \n    samtools sort -o "./${prefix}_bam/${prefix}_sorted.bam" \\\n                    "./${prefix}_hisat/${prefix}.sam"\ndone\n```\n\n### 1.4 表达定量\n\n```bash\nfeatureCounts -a ../../01.ref/ref_genomic.gtf \\\n              -T 10 -p --countReadPairs \\\n              -g gene_id -t exon -M -O \\\n              -o counts.txt \\\n              *_sorted.bam\n```\n\n## 2. SNP Calling 流程\n\nSNP突变分析是基因组研究的核心内容。\n\n### 2.1 环境要求\n\n- Linux系统\n- 软件：GATK、Trimmomatic、bwa、samtools\n\n### 2.2 自动化分析脚本\n\n```python\nimport os\n\nfile_list = [\n    {\n        "input_file": ["./sample_1.fq.gz", "./sample_2.fq.gz"],\n        "reference": "./ref.fasta"\n    },\n]\n\nfile_threads = 10\n\ndef operator_func(args, out_prefix, reference_prefix):\n    # 创建索引\n    os.system(f"samtools faidx {args[\\'reference\\']}")\n    os.system(f"bwa index {args[\\'reference\\']}")\n    \n    # BWA比对\n    os.system(f"bwa mem -t {file_threads} \\"
              f"-R \\"@RG\\\\tID:{out_prefix}\\\\tPL:illumina\\\\tSM:{out_prefix}\\" \\"
              f"{args[\\'reference\\']} {args[\\'input_file\\'][0]} {args[\\'input_file\\'][1]} \\"
              f"| samtools view -bS - >{out_prefix}.bam")\n    \n    # 排序和标记重复\n    os.system(f"samtools sort -@ {file_threads} \\"
              f"-o {out_prefix}.sorted.bam {out_prefix}.bam")\n    \n    os.system(f"gatk MarkDuplicates \\"
              f"-I {out_prefix}.sorted.bam \\"
              f"-O {out_prefix}.sorted.markdup.bam \\"
              f"-M {out_prefix}.markdup_metrics.txt")\n    \n    os.system(f"samtools index {out_prefix}.sorted.markdup.bam")\n    \n    # SNP calling\n    os.system(f"gatk --java-options -Xmx4G HaplotypeCaller \\"
              f"-I {out_prefix}.sorted.markdup.bam \\"
              f"-O {out_prefix}.gvcf \\"
              f"-R {args[\\'reference\\']} \\"
              f"--emit-ref-confidence GVCF")\n\nfor args in file_list:\n    out_prefix = os.path.basename(args[\\'input_file\\'][0]).split(\\'.\\')[0]\n    operator_func(args, out_prefix, \\"\\")\n```\n\n## 3. 单细胞测序分析\n\n单细胞RNA测序（scRNA-seq）允许我们在单个细胞水平上研究基因表达。\n\n### 3.1 Seurat分析流程\n\nSeurat是R语言中最流行的单细胞数据分析包：\n\n1. **数据导入和质控**\n2. **标准化和归一化**\n3. **特征选择和降维**\n4. **聚类和细胞类型鉴定**\n5. **差异表达分析**\n\n## 4. 学习建议\n\n1. **掌握Linux基础**：生物信息学主要在Linux环境下进行\n2. **学习一门编程语言**：推荐Python或R\n3. **理解生物学背景**：了解基因组、转录组等基本概念\n4. **动手实践**：通过实际项目学习最有效\n5. **阅读文献**：关注最新的生物信息学方法和工具\n\n---\n\n*持续更新中，欢迎交流学习！*',
  },
  {
    id: 2,
    title: '三维重建技术探索',
    excerpt: '3D重建技术与计算机视觉相关内容，包括NeRF、点云处理、摄影测量等技术',
    category: '三维重建',
    date: '2026-02-10',
    readTime: '25 分钟',
    tags: ['三维重建', 'NeRF', '点云'],
    content: '# 三维重建技术探索\n\n## 1. NeRF (Neural Radiance Fields)\n\nNeRF是一种基于神经网络的三维重建方法，可以从2D图像生成高质量的3D场景。\n\n### 1.1 基本原理\n\nNeRF使用神经网络表示场景的体积密度和颜色，通过体积渲染技术生成新视角的图像。\n\n### 1.2 工作流程\n\n1. **数据准备**：收集多视角图像\n2. **相机标定**：确定相机参数\n3. **训练NeRF模型**：优化神经网络参数\n4. **渲染新视角**：从任意角度生成图像\n\n### 1.3 实践指南\n\n```bash\n# 安装依赖\npip install nerfstudio\n\n# 处理数据\nns-process-data images --data ./images --output-dir ./processed\n\n# 训练模型\nns-train nerfacto --data ./processed\n```\n\n## 2. 点云处理\n\n点云是三维重建的基础数据格式。\n\n### 2.1 常用工具\n\n- **PCL (Point Cloud Library)**：C++点云处理库\n- **Open3D**：Python点云处理库\n- **CloudCompare**：点云可视化软件\n\n### 2.2 点云配准\n\n点云配准是将多个点云数据对齐到同一坐标系的过程。\n\n## 3. 摄影测量\n\n摄影测量是通过摄影手段获取物体三维信息的技术。\n\n### 3.1 Agisoft Metashape 工作流程\n\n1. **添加照片**：导入拍摄的多视角照片\n2. **对齐照片**：自动匹配特征点\n3. **生成密集点云**：多视角立体匹配\n4. **生成网格**：点云转三角网格\n5. **生成纹理**：添加颜色纹理\n\n### 3.2 拍摄建议\n\n- 重叠度：相邻照片重叠度应在60-80%\n- 角度：环绕物体拍摄，覆盖各个角度\n- 光线：均匀光照\n- 稳定：使用三脚架\n\n## 4. 应用场景\n\n- **文物保护**：数字化保存文物\n- **建筑设计**：建筑测量和建模\n- **虚拟现实**：创建VR场景\n- **游戏开发**：快速生成3D资产\n- **医疗影像**：医学三维重建\n\n---\n\n*三维重建是一个快速发展的领域，新技术不断涌现！*',
  },
  {
    id: 3,
    title: '机器学习Pipeline构建',
    excerpt: '完整的ML工程实践，包括数据预处理、特征工程、模型训练、评估和部署的全流程',
    category: '机器学习',
    date: '2026-02-05',
    readTime: '30 分钟',
    tags: ['机器学习', 'MLOps', 'Pipeline'],
    content: '# 机器学习Pipeline构建：从数据到模型部署\n\n## 1. 机器学习项目生命周期\n\n1. **问题定义**：明确业务目标和评估指标\n2. **数据收集**：获取和整合训练数据\n3. **数据预处理**：清洗、转换和特征工程\n4. **模型训练**：选择算法并训练模型\n5. **模型评估**：验证模型性能\n6. **模型部署**：将模型投入生产环境\n7. **监控维护**：持续监控模型表现\n\n## 2. 数据预处理\n\n### 2.1 数据清洗\n\n```python\nimport pandas as pd\nimport numpy as np\n\n# 处理缺失值\ndf.fillna(df.mean(), inplace=True)\n\n# 处理异常值\nQ1 = df.quantile(0.25)\nQ3 = df.quantile(0.75)\nIQR = Q3 - Q1\ndf = df[~((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).any(axis=1)]\n```\n\n### 2.2 特征工程\n\n```python\nfrom sklearn.preprocessing import StandardScaler, LabelEncoder\n\n# 特征缩放\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\n\n# 标签编码\nencoder = LabelEncoder()\ny_encoded = encoder.fit_transform(y)\n```\n\n## 3. 模型训练\n\n```python\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score\n\n# 划分数据集\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\n\n# 训练模型\nmodel = RandomForestClassifier(n_estimators=100, random_state=42)\nmodel.fit(X_train, y_train)\n\n# 预测和评估\ny_pred = model.predict(X_test)\nprint(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")\n```\n\n## 4. 模型部署\n\n### 4.1 使用FastAPI部署\n\n```python\nfrom fastapi import FastAPI\nfrom pydantic import BaseModel\nimport joblib\n\napp = FastAPI()\nmodel = joblib.load("model.pkl")\n\nclass PredictionRequest(BaseModel):\n    features: list\n\n@app.post("/predict")\ndef predict(request: PredictionRequest):\n    prediction = model.predict([request.features])\n    return {"prediction": prediction.tolist()}\n```\n\n### 4.2 Docker容器化\n\n```dockerfile\nFROM python:3.9-slim\n\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\n\nCOPY . .\nEXPOSE 8000\n\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]\n```\n\n## 5. MLOps最佳实践\n\n- **版本控制**：Git管理代码，DVC管理数据\n- **自动化流程**：GitHub Actions自动化CI/CD\n- **模型追踪**：使用MLflow记录实验\n\n---\n\n*机器学习是一个需要不断学习和实践的领域！*',
  },
  {
    id: 4,
    title: 'Python学习路线：6个月精通计划',
    excerpt: '详细规划Python编程学习路径，从基础语法到高级特性，再到实战项目开发',
    category: '学习ing',
    date: '2026-01-28',
    readTime: '15 分钟',
    tags: ['Python', '学习路线', '编程入门'],
    content: '# 从零开始的Python学习路线：6个月精通计划\n\n## 第1个月：Python基础\n\n### 学习内容\n\n1. **基础语法**\n   - 变量和数据类型\n   - 运算符和表达式\n   - 输入输出操作\n\n2. **控制流程**\n   - 条件语句（if/elif/else）\n   - 循环语句（for/while）\n   - 列表推导式\n\n3. **数据结构**\n   - 列表（List）、元组（Tuple）\n   - 字典（Dictionary）、集合（Set）\n\n```python\n# 基础语法示例\nfruits = ["apple", "banana", "cherry"]\nfruits.append("orange")\nprint(fruits[0])  # apple\n\nperson = {"name": "Alice", "age": 25}\nprint(person["name"])  # Alice\n```\n\n## 第2个月：函数和模块\n\n1. **函数定义**\n   - 参数和返回值\n   - 默认参数\n   - 可变参数\n\n2. **模块和包**\n   - 导入模块\n   - 创建自己的模块\n   - 使用pip管理包\n\n3. **文件操作**\n   - 读写文本文件\n   - 读写CSV文件\n   - 处理JSON数据\n\n## 第3个月：面向对象编程\n\n1. **类和对象**\n2. **继承、封装、多态**\n3. **特殊方法**\n\n```python\nclass Dog:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    \n    def bark(self):\n        return f"{self.name} says: Woof!"\n\nmy_dog = Dog("Buddy", 3)\nprint(my_dog.bark())\n```\n\n## 第4个月：数据处理和分析\n\n1. **NumPy**：数组操作、数学运算\n2. **Pandas**：DataFrame操作、数据清洗\n3. **数据可视化**：Matplotlib、Seaborn\n\n## 第5个月：Web开发\n\n1. **Flask框架**\n2. **数据库操作**\n3. **API开发**\n\n## 第6个月：实战项目\n\n1. **个人博客系统**\n2. **数据分析项目**\n3. **机器学习项目**\n\n## 学习建议\n\n1. **每天编程**：至少写1小时代码\n2. **项目驱动**：通过实际项目学习\n3. **阅读源码**：学习优秀的开源项目\n4. **参与社区**：Stack Overflow、GitHub\n5. **记录笔记**：写博客总结学习心得\n\n---\n\n*学习编程是一个持续的过程，保持好奇心和耐心！*',
  },
  {
    id: 5,
    title: '日常思考与技术随笔',
    excerpt: '日常思考、技术随笔、生活感悟',
    category: '碎碎念',
    date: '2026-01-10',
    readTime: '5 分钟',
    tags: ['随笔', '思考'],
    content: '# 日常思考与技术随笔\n\n## 关于学习的思考\n\n学习是一个不断迭代的过程。我们不可能一次性掌握所有知识，而是需要在实践中不断积累和完善。\n\n### 学习的三个层次\n\n1. **知道（Knowing）**：了解概念和理论\n2. **理解（Understanding）**：明白原理和逻辑\n3. **应用（Applying）**：能够在实践中使用\n\n> 真正的掌握来自于应用。\n\n## 技术的价值\n\n技术本身不是目的，解决问题才是。好的技术应该：\n\n- **简单**：易于理解和维护\n- **可靠**：稳定运行，少出bug\n- **高效**：节省时间和资源\n- **可扩展**：适应未来的需求\n\n## 生物信息学的魅力\n\n生物信息学是生物学和计算机科学的交叉领域，让我着迷的地方在于：\n\n1. **数据量大**：基因组数据动辄几十GB\n2. **问题复杂**：生命系统的复杂性\n3. **意义重大**：有助于理解生命本质\n4. **发展迅速**：新技术层出不穷\n\n## 编程与科研\n\n编程是现代科研的必备技能。它让我能够：\n\n- **自动化**：批量处理数据\n- **可视化**：直观展示结果\n- **可重复**：实验过程可追溯\n- **可分享**：与他人协作\n\n## 时间管理与效率\n\n### 我的方法\n\n1. **番茄工作法**：25分钟专注，5分钟休息\n2. **任务清单**：每天列出3个最重要的任务\n3. **定期复盘**：每周回顾完成情况\n4. **避免多任务**：一次只做一件事\n\n### 工具推荐\n\n- **Notion**：笔记和知识管理\n- **Toggl**：时间追踪\n- **Zotero**：文献管理\n- **VS Code**：代码编辑\n\n## 关于分享\n\n写博客不仅是分享知识，更是整理思路的过程。通过写作，我能够：\n\n- **加深理解**：教是最好的学\n- **建立连接**：认识志同道合的朋友\n- **获得反馈**：改进自己的方法\n- **记录成长**：看到自己的进步\n\n## 未来的计划\n\n1. **深入学习**：单细胞测序和三维基因组\n2. **技能提升**：机器学习和深度学习\n3. **项目实践**：完成几个完整的项目\n4. **持续输出**：定期更新博客\n\n## 结语\n\n技术之路漫长但充满乐趣。保持好奇心，保持学习，保持分享。\n\n> "Stay hungry, stay foolish." —— Steve Jobs\n\n---\n\n*记录于 2026年*',
  },
  {
    id: 6,
    title: 'GitHub Actions自动化Pipeline',
    excerpt: '手把手教你构建CI/CD流水线，包括代码检查、自动化测试、构建部署等完整流程配置',
    category: '学习ing',
    date: '2026-01-20',
    readTime: '20 分钟',
    tags: ['GitHub Actions', 'CI/CD', '自动化'],
    content: '# GitHub Actions自动化Pipeline实战\n\n## 什么是GitHub Actions？\n\nGitHub Actions 是 GitHub 提供的持续集成和持续部署（CI/CD）平台，可以自动化构建、测试和部署流程。\n\n## 核心概念\n\n- **Workflow（工作流）**：定义自动化流程的YAML文件\n- **Job（任务）**：工作流中的单个任务\n- **Step（步骤）**：任务中的单个步骤\n- **Action（动作）**：可复用的自动化单元\n\n## 基础配置示例\n\n```yaml\n# .github/workflows/basic.yml\nname: Basic CI\n\non: [push, pull_request]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    \n    steps:\n    - uses: actions/checkout@v3\n    \n    - name: Set up Python\n      uses: actions/setup-python@v4\n      with:\n        python-version: "3.9"\n    \n    - name: Install dependencies\n      run: |\n        python -m pip install --upgrade pip\n        pip install -r requirements.txt\n    \n    - name: Run tests\n      run: pytest\n```\n\n## 完整CI/CD Pipeline\n\n```yaml\nname: CI/CD Pipeline\n\non:\n  push:\n    branches: [ main, develop ]\n  pull_request:\n    branches: [ main ]\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n        with:\n          python-version: "3.9"\n      - run: |\n          pip install flake8 black\n          flake8 . --count --select=E9,F63,F7,F82\n          black --check .\n\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        python-version: ["3.8", "3.9", "3.10"]\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n        with:\n          python-version: ${{ matrix.python-version }}\n      - run: |\n          pip install -r requirements.txt\n          pytest --cov=./\n\n  deploy:\n    needs: [lint, test]\n    runs-on: ubuntu-latest\n    if: github.ref == "refs/heads/main"\n    steps:\n      - uses: actions/checkout@v3\n      - name: Deploy\n        run: echo "部署命令在这里"\n```\n\n## 最佳实践\n\n1. **保持简单**：从简单的工作流开始\n2. **快速反馈**：优先运行快速检查\n3. **并行执行**：充分利用GitHub的并行能力\n4. **使用缓存**：加速依赖安装\n5. **保护Secrets**：使用GitHub Secrets管理敏感信息\n\n---\n\n*自动化是提高效率的关键！*',
  },
  {
    id: 7,
    title: 'Docker容器化部署指南',
    excerpt: '从Docker基础概念到实际部署，掌握容器化技术，让你的应用一次构建到处运行',
    category: '学习ing',
    date: '2026-01-15',
    readTime: '18 分钟',
    tags: ['Docker', '容器化', '部署'],
    content: '# Docker容器化部署完整指南\n\n## 什么是Docker？\n\nDocker 是一个开源的容器化平台，可以让开发者将应用及其依赖打包到一个轻量级、可移植的容器中。\n\n## 核心概念\n\n- **镜像（Image）**：容器的模板\n- **容器（Container）**：镜像的运行实例\n- **Dockerfile**：定义如何构建镜像的文件\n- **仓库（Registry）**：存储和分发镜像的服务\n\n## Docker基础命令\n\n```bash\n# 拉取镜像\ndocker pull python:3.9-slim\n\n# 运行容器\ndocker run -it python:3.9-slim bash\n\n# 查看容器\ndocker ps -a\n\n# 停止和删除容器\ndocker stop container_id\ndocker rm container_id\n\n# 构建镜像\ndocker build -t myapp:latest .\n\n# 推送镜像\ndocker push username/myapp:latest\n```\n\n## 编写Dockerfile\n\n```dockerfile\nFROM python:3.9-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\nEXPOSE 8000\n\nHEALTHCHECK --interval=30s --timeout=30s \\\n  CMD curl -f http://localhost:8000/health || exit 1\n\nCMD ["python", "app.py"]\n```\n\n## Docker Compose\n\n```yaml\nversion: "3.8"\n\nservices:\n  web:\n    build: .\n    ports:\n      - "8000:8000"\n    environment:\n      - DATABASE_URL=postgresql://user:pass@db:5432/mydb\n    depends_on:\n      - db\n    volumes:\n      - ./logs:/app/logs\n  \n  db:\n    image: postgres:13\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n      POSTGRES_DB: mydb\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n\nvolumes:\n  postgres_data:\n```\n\n## 最佳实践\n\n1. **使用官方镜像**\n2. **最小化镜像**：使用alpine或slim版本\n3. **多阶段构建**：减少最终镜像大小\n4. **不存储数据在容器中**：使用volumes\n5. **使用.dockerignore**：排除不需要的文件\n\n---\n\n*容器化是现代应用部署的标准！*',
  },
];
