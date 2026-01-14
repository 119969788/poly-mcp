# 服务器快速启动指南

## 问题诊断

如果你看到以下错误：
```
npm ERR! path /root/package.json
npm ERR! enoent ENOENT: no such file or directory
```

说明你**不在项目目录中**，需要先进入项目目录或克隆项目。

## 解决方案

### 情况 1: 项目还没有克隆

如果服务器上还没有项目，需要先克隆：

```bash
# 1. 进入 home 目录
cd ~

# 2. 克隆项目
git clone https://github.com/119969788/poly-mcp.git

# 3. 进入项目目录
cd poly-mcp

# 4. 现在可以运行 npm 命令了
npm install
```

### 情况 2: 项目已存在，但不在项目目录

```bash
# 1. 查找项目位置
find ~ -name "package.json" -type f 2>/dev/null

# 2. 或者直接进入项目目录（如果知道路径）
cd ~/poly-mcp
# 或
cd /var/www/poly-mcp

# 3. 确认在正确的目录
pwd
ls -la

# 应该能看到 package.json 文件
# 然后运行
npm install
```

## 完整安装流程

```bash
# ============================================
# 步骤 1: 克隆项目
# ============================================
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp

# ============================================
# 步骤 2: 安装依赖
# ============================================
npm install

# ============================================
# 步骤 3: 配置环境变量
# ============================================
cp .env.example .env
nano .env  # 编辑配置文件，至少设置 PRIVATE_KEY

# ============================================
# 步骤 4: 生成 API 凭证
# ============================================
npm run generate-api

# ============================================
# 步骤 5: 将生成的 API 凭证添加到 .env 文件
# ============================================
nano .env  # 添加生成的 API 凭证

# ============================================
# 步骤 6: 启动程序（可选）
# ============================================
npm start
```

## 检查当前状态

运行以下命令检查：

```bash
# 查看当前目录
pwd

# 查看当前目录的文件
ls -la

# 检查是否有 package.json
ls package.json

# 检查是否有 .env.example
ls .env.example
```

## 如果找不到项目

如果 `find` 命令找不到项目，说明项目还没有克隆：

```bash
cd ~
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
npm install
```

## 常见错误和解决

### 错误 1: npm ERR! path /root/package.json

**原因**: 不在项目目录中

**解决**: 
```bash
cd ~/poly-mcp  # 或你的项目路径
```

### 错误 2: cp: cannot stat '.env.example': No such file or directory

**原因**: 不在项目目录中，或项目没有正确克隆

**解决**:
```bash
# 确认在项目目录
cd ~/poly-mcp
ls -la  # 应该能看到 .env.example

# 如果看不到，重新克隆
cd ~
rm -rf poly-mcp
git clone https://github.com/119969788/poly-mcp.git
cd poly-mcp
```

### 错误 3: npm: command not found

**原因**: Node.js/npm 没有安装

**解决**:
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

## 验证安装

安装完成后，验证一切正常：

```bash
# 1. 确认在项目目录
cd ~/poly-mcp
pwd

# 2. 确认文件存在
ls package.json
ls .env.example
ls src/

# 3. 确认依赖已安装
ls node_modules/

# 4. 测试运行
npm run generate-api
```

## 下一步

安装完成后，按照 `API_SETUP.md` 或 `API_GENERATION_GUIDE.md` 配置 API 凭证。
