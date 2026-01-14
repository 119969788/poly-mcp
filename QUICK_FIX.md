# 快速修复指南

## 错误原因

错误信息显示 npm 在 `/root/` 目录下查找 `package.json`，但项目文件不在那里。

## 解决方案

### 情况 1: 项目还没有克隆

如果服务器上还没有项目，需要先克隆：

```bash
# 进入合适的目录
cd ~

# 克隆项目
git clone https://github.com/119969788/poly-mcp.git

# 进入项目目录
cd poly-mcp

# 现在可以运行 npm 命令了
npm install
```

### 情况 2: 项目已存在，但在错误目录

如果项目已经存在，需要先进入项目目录：

```bash
# 查找项目位置
find ~ -name "package.json" -type f 2>/dev/null

# 或者直接进入项目目录（如果知道路径）
cd ~/poly-mcp
# 或
cd /var/www/poly-mcp
# 或你的项目实际路径

# 确认在正确的目录
pwd
ls -la

# 应该能看到 package.json 文件
# 然后运行
npm install
```

### 情况 3: 检查当前目录

```bash
# 查看当前目录
pwd

# 查看当前目录的文件
ls -la

# 如果看不到 package.json，说明不在项目目录
# 需要进入项目目录
```

## 正确的操作流程

```bash
# 1. 确认当前目录
pwd

# 2. 如果不在项目目录，进入项目目录
cd ~/poly-mcp

# 3. 确认 package.json 存在
ls package.json

# 4. 现在可以运行 npm 命令
npm install
```

## 如果找不到项目

如果项目不存在，需要先克隆：

```bash
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
npm install
```
