# 修复依赖问题

## 问题

运行 `npm run generate-api` 时出现错误：
```
Error: Cannot find module 'tslib'
```

## 原因

`@polymarket/clob-client` 需要 `tslib` 作为依赖，但可能没有正确安装。

## 解决方案

### 方法 1: 重新安装依赖（推荐）

在服务器上执行：

```bash
# 进入项目目录
cd ~/poly-mcp

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

### 方法 2: 手动安装缺失的依赖

```bash
cd ~/poly-mcp
npm install tslib
```

### 方法 3: 使用 npm ci（如果存在 package-lock.json）

```bash
cd ~/poly-mcp
npm ci
```

## 验证安装

安装完成后，验证依赖：

```bash
# 检查 tslib 是否安装
npm list tslib

# 或者检查所有依赖
npm list
```

## 如果仍然有问题

### 检查 Node.js 和 npm 版本

```bash
node --version  # 应该是 18+
npm --version   # 应该是 9+
```

### 清理 npm 缓存

```bash
npm cache clean --force
npm install
```

### 检查网络连接

确保服务器可以访问 npm registry：

```bash
npm ping
```

## 完整安装步骤

```bash
# 1. 进入项目目录
cd ~/poly-mcp

# 2. 清理旧的安装
rm -rf node_modules package-lock.json

# 3. 安装依赖
npm install

# 4. 验证安装
npm list @polymarket/clob-client
npm list tslib

# 5. 测试生成 API 密钥
npm run generate-api
```
