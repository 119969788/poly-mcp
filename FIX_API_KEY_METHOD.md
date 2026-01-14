# 修复 createOrDeriveApiKey 方法不存在的问题

## 问题

运行 `npm run generate-api` 时出现：
```
❌ API 凭证派生失败: client.createOrDeriveApiKey is not a function
```

## 原因

`@polymarket/clob-client` 的某些版本可能没有 `createOrDeriveApiKey` 方法，或者方法名不同。

## 解决方案

### 方案 1: 更新到最新版本（推荐）

```bash
cd ~/poly-mcp

# 更新到最新版本
npm install @polymarket/clob-client@latest

# 重新运行
npm run generate-api
```

### 方案 2: 检查并安装特定版本

```bash
cd ~/poly-mcp

# 查看当前版本
npm list @polymarket/clob-client

# 尝试安装特定版本（根据官方文档推荐）
npm install @polymarket/clob-client@^5.2.1

# 重新运行
npm run generate-api
```

### 方案 3: 手动生成 API 凭证（如果自动方法不可用）

如果自动生成方法不可用，可以手动从 Polymarket.com 获取：

1. **登录 Polymarket.com**
2. **进入账户设置**
3. **找到 API 密钥部分**
4. **生成或查看 API 凭证**

然后手动添加到 `.env` 文件：

```env
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的密钥
POLYMARKET_API_PASSPHRASE=你的密码短语
```

### 方案 4: 使用替代方法（如果存在）

检查是否有其他方法：

```bash
cd ~/poly-mcp
node -e "
const { ClobClient } = require('@polymarket/clob-client');
const { Wallet } = require('ethers');
const client = new ClobClient('https://clob.polymarket.com', 137, new Wallet('0x0000000000000000000000000000000000000000000000000000000000000001'));
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
  .filter(name => typeof client[name] === 'function' && name.toLowerCase().includes('api'));
console.log('API 相关方法:', methods);
"
```

## 临时解决方案：手动配置

如果无法自动生成，可以暂时跳过 API 凭证，直接使用私钥进行交易（某些功能可能受限）：

```env
# .env 文件
PRIVATE_KEY=0x你的私钥
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址

# API 凭证留空（程序会尝试仅使用私钥）
POLYMARKET_API_KEY=
POLYMARKET_API_SECRET=
POLYMARKET_API_PASSPHRASE=
```

然后直接运行程序测试连接。

## 检查包版本和依赖

```bash
# 查看所有相关包的版本
npm list @polymarket/clob-client
npm list ethers
npm list @polymarket/order-utils

# 查看包的详细信息
npm view @polymarket/clob-client version
npm view @polymarket/clob-client dependencies
```

## 完全重新安装

如果以上方法都不行，尝试完全重新安装：

```bash
cd ~/poly-mcp

# 删除 node_modules 和锁定文件
rm -rf node_modules package-lock.json

# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm install

# 更新到最新版本
npm install @polymarket/clob-client@latest ethers@latest

# 重新运行
npm run generate-api
```

## 联系支持

如果问题持续存在：

1. 检查 Polymarket 官方文档是否有更新
2. 查看 GitHub issues: https://github.com/polymarket/clob-client/issues
3. 确认你的 Node.js 版本 >= 16.0.0

## 验证修复

修复后，验证：

```bash
# 检查方法是否存在
node -e "
const { ClobClient } = require('@polymarket/clob-client');
const { Wallet } = require('ethers');
const client = new ClobClient('https://clob.polymarket.com', 137, new Wallet('0x0000000000000000000000000000000000000000000000000000000000000001'));
console.log('createOrDeriveApiKey 存在:', typeof client.createOrDeriveApiKey === 'function');
"
```

如果显示 `true`，说明方法已可用。
