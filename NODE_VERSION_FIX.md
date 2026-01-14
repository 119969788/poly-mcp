# Node.js 版本问题修复指南

## 错误信息

```
Error: Cannot find module 'node:crypto'
```

## 原因

这个错误表示 **Node.js 版本太旧**。`@polymarket/clob-client` 需要 Node.js 16+（推荐 18+）。

`node:crypto` 是 Node.js 的内置模块，但使用 `node:` 前缀的导入方式需要：
- Node.js 14.18.0+ 或
- Node.js 16.0.0+（推荐）
- Node.js 18.0.0+（最佳）

## 解决方案

### 步骤 1: 检查当前 Node.js 版本

```bash
node --version
```

如果显示 `v14.x.x` 或更低，需要升级。

### 步骤 2: 升级 Node.js（Ubuntu/Debian）

#### 方法 A: 使用 NodeSource（推荐）

```bash
# 卸载旧版本（可选）
sudo apt remove nodejs npm

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x 或更高
npm --version
```

#### 方法 B: 使用 nvm（Node Version Manager）

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证
node --version
```

#### 方法 C: 使用 snap（如果可用）

```bash
sudo snap install node --classic
```

### 步骤 3: 重新安装依赖

升级 Node.js 后，需要重新安装项目依赖：

```bash
cd ~/poly-mcp

# 删除旧的 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 步骤 4: 验证修复

```bash
# 检查 Node.js 版本
node --version  # 应该 >= v16.0.0

# 测试运行
npm run generate-api
```

## 完整升级流程（Ubuntu/Debian）

```bash
# 1. 检查当前版本
node --version

# 2. 升级到 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 验证新版本
node --version
npm --version

# 4. 进入项目目录
cd ~/poly-mcp

# 5. 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 6. 测试
npm run generate-api
```

## 版本要求

- **最低要求**: Node.js 16.0.0
- **推荐版本**: Node.js 18.x.x 或 20.x.x
- **npm 版本**: 随 Node.js 自动安装，通常 >= 8.0.0

## 验证安装

运行以下命令确认一切正常：

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查项目依赖
cd ~/poly-mcp
npm list --depth=0
```

## 如果升级后仍有问题

### 清理 npm 缓存

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 检查 Node.js 安装

```bash
# 检查 Node.js 路径
which node

# 检查 Node.js 可执行文件
node -e "console.log(process.versions)"

# 应该显示类似：
# {
#   node: '18.17.0',
#   v8: '10.2.154.26-node.26',
#   ...
# }
```

### 使用 nvm 管理多个版本

如果系统需要多个 Node.js 版本：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 使用 nvm 安装 Node.js 18
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

## 常见问题

### Q: 升级后 npm 命令找不到？

**A**: 可能需要重新加载 shell 或重启终端：
```bash
source ~/.bashrc
# 或
exec bash
```

### Q: 权限错误？

**A**: 如果遇到权限问题，不要使用 sudo 安装全局包。使用 nvm 或配置 npm 使用用户目录：
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Q: 如何检查 Node.js 是否支持 node:crypto？

**A**: 运行：
```bash
node -e "console.log(require('node:crypto'))"
```

如果不报错，说明支持。

## 参考

- Node.js 官方下载: https://nodejs.org/
- NodeSource 安装指南: https://github.com/nodesource/distributions
- nvm 文档: https://github.com/nvm-sh/nvm
