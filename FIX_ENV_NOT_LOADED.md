# 修复 .env 文件未加载的问题

## 错误信息

```
❌ 未设置 PRIVATE_KEY，请在 .env 文件中配置
```

## 可能的原因

1. `.env` 文件不存在
2. `.env` 文件存在但 `PRIVATE_KEY` 未设置
3. `.env` 文件路径不正确
4. PM2 运行时工作目录不对

## 快速诊断

运行配置检查工具：

```bash
cd ~/poly-mcp
npm run check-config
```

这会显示：
- `.env` 文件是否存在
- 哪些配置项已设置
- 哪些配置项缺失
- 配置格式是否正确

## 解决方案

### 步骤 1: 检查 .env 文件

```bash
cd ~/poly-mcp

# 检查文件是否存在
ls -la .env

# 如果不存在，创建它
cp .env.example .env
```

### 步骤 2: 编辑 .env 文件

```bash
nano .env
```

**至少设置以下内容**：

```env
PRIVATE_KEY=0x你的私钥
```

**完整配置示例**：

```env
# 私钥（必需）
PRIVATE_KEY=0x你的私钥

# API 凭证（运行 npm run generate-api 后添加）
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_API_SECRET=your_api_secret_here
POLYMARKET_API_PASSPHRASE=your_api_passphrase_here

# Polymarket 配置
POLYMARKET_HOST=https://clob.polymarket.com
CHAIN_ID=137

# 签名类型和资金地址
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址
```

### 步骤 3: 验证配置

```bash
# 运行配置检查
npm run check-config
```

### 步骤 4: 如果使用 PM2，确保工作目录正确

```bash
# 停止 PM2 应用
pm2 stop poly-mcp-arbitrage
pm2 delete poly-mcp-arbitrage

# 从项目目录启动（重要！）
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage --cwd ~/poly-mcp

# 或者使用 npm start
pm2 start npm --name poly-mcp-arbitrage -- start --cwd ~/poly-mcp
```

### 步骤 5: 检查 PM2 工作目录

```bash
# 查看 PM2 应用信息
pm2 info poly-mcp-arbitrage

# 检查工作目录是否正确
# 应该显示: /root/poly-mcp 或你的项目路径
```

如果工作目录不对，删除并重新启动：

```bash
pm2 delete poly-mcp-arbitrage
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage
```

## 常见问题

### Q: .env 文件存在但程序读不到？

**A**: 检查文件权限和位置：

```bash
# 检查文件权限
ls -la .env

# 应该显示类似: -rw------- (600 权限)

# 如果权限不对，修复它
chmod 600 .env

# 检查文件内容（不显示私钥）
cat .env | grep -v "PRIVATE_KEY" | grep -v "SECRET" | grep -v "PASSPHRASE"
```

### Q: PM2 运行时找不到 .env？

**A**: 确保从项目目录启动 PM2：

```bash
# 错误的方式（从其他目录启动）
cd ~
pm2 start ~/poly-mcp/src/index.js

# 正确的方式（从项目目录启动）
cd ~/poly-mcp
pm2 start src/index.js --name poly-mcp-arbitrage
```

### Q: 私钥格式错误？

**A**: 私钥必须：
- 以 `0x` 开头
- 长度为 66 个字符（包括 0x）
- 格式：`0x` + 64 个十六进制字符

示例：
```
✅ 正确: PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
❌ 错误: PRIVATE_KEY=1234567890abcdef... (缺少 0x)
❌ 错误: PRIVATE_KEY=0x123 (太短)
```

### Q: .env 文件中有注释导致问题？

**A**: 确保配置项格式正确：

```env
# 正确
PRIVATE_KEY=0x你的私钥

# 错误（有空格）
PRIVATE_KEY = 0x你的私钥

# 错误（有引号，除非值中有空格）
PRIVATE_KEY="0x你的私钥"
```

## 验证步骤

1. **检查文件存在**:
   ```bash
   cd ~/poly-mcp
   ls -la .env
   ```

2. **检查文件内容**（隐藏敏感信息）:
   ```bash
   cat .env | sed 's/PRIVATE_KEY=.*/PRIVATE_KEY=***/' | sed 's/SECRET=.*/SECRET=***/' | sed 's/PASSPHRASE=.*/PASSPHRASE=***/'
   ```

3. **运行配置检查**:
   ```bash
   npm run check-config
   ```

4. **测试加载**:
   ```bash
   node -e "require('dotenv').config(); console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? '已设置' : '未设置');"
   ```

## 如果仍然有问题

1. **查看详细错误**:
   ```bash
   pm2 logs poly-mcp-arbitrage --lines 50
   ```

2. **检查 Node.js 版本**:
   ```bash
   node --version  # 应该 >= v16.0.0
   ```

3. **重新安装依赖**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **完全重新启动**:
   ```bash
   pm2 delete all
   cd ~/poly-mcp
   npm run check-config
   pm2 start src/index.js --name poly-mcp-arbitrage
   ```
