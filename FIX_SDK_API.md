# 修复 SDK API 不支持的问题

## 问题

启动时出现错误：
```
❌ 启动聪明钱跟单失败: SDK 不支持 startAutoCopyTrading 方法
```

## 原因

`@catalyst-team/poly-sdk` 的实际 API 可能与预期不同，或者：
1. SDK 版本不匹配
2. API 方法名称不同
3. SDK 结构不同

## 解决方案

### 方案 1: 使用增强版（推荐）

如果 SDK 不支持，可以使用增强版聪明钱跟单：

```bash
cd ~/poly-mcp
nano .env
```

修改配置：

```env
# 禁用 SDK 版
USE_SDK_SMART_MONEY=false

# 启用增强版
USE_ENHANCED_SMART_MONEY=true

# 其他配置保持不变
ENABLE_SMART_MONEY=true
SMART_MONEY_ADDRESSES=0x你的地址1,0x你的地址2
```

然后重启：

```bash
pm2 restart poly-mcp-arbitrage
```

### 方案 2: 使用标准版

如果增强版也有问题，使用标准版：

```env
USE_SDK_SMART_MONEY=false
USE_ENHANCED_SMART_MONEY=false
ENABLE_SMART_MONEY=true
```

### 方案 3: 检查并更新 SDK

```bash
# 检查当前版本
npm list @catalyst-team/poly-sdk

# 更新到最新版本
npm install @catalyst-team/poly-sdk@latest

# 查看 SDK 的实际结构
node -e "
const sdk = require('@catalyst-team/poly-sdk');
console.log('SDK 结构:', Object.keys(sdk));
if (sdk.default) console.log('default:', Object.keys(sdk.default));
"
```

### 方案 4: 查看 SDK 文档

访问 SDK 的文档或 GitHub 仓库，查看实际的 API 使用方法。

## 调试信息

如果启用了调试模式，程序会显示 SDK 的实际结构：

```env
ENABLE_SMART_MONEY_DEBUG=true
ENABLE_DETAILED_LOGS=true
```

重启后会显示：
```
🔍 检查 SDK 可用方法...
📋 SDK 实例结构:
   顶层属性: smartMoney, markets, trades, ...
   smartMoney 方法: start, stop, ...
```

## 版本对比

| 版本 | 特点 | 推荐场景 |
|------|------|----------|
| SDK版 | 使用官方 API，功能完整 | SDK 支持时使用 |
| 增强版 | 事件驱动，独立监听 | SDK 不支持时使用（推荐） |
| 标准版 | 基础实现，简单稳定 | 最基础需求 |

## 快速切换

### 切换到增强版

```bash
cd ~/poly-mcp
sed -i 's/USE_SDK_SMART_MONEY=true/USE_SDK_SMART_MONEY=false/' .env
sed -i 's/USE_ENHANCED_SMART_MONEY=false/USE_ENHANCED_SMART_MONEY=true/' .env
pm2 restart poly-mcp-arbitrage
```

### 切换到标准版

```bash
cd ~/poly-mcp
sed -i 's/USE_SDK_SMART_MONEY=true/USE_SDK_SMART_MONEY=false/' .env
sed -i 's/USE_ENHANCED_SMART_MONEY=true/USE_ENHANCED_SMART_MONEY=false/' .env
pm2 restart poly-mcp-arbitrage
```

## 验证修复

重启后应该看到：

**增强版**：
```
📦 使用增强版聪明钱跟单策略（事件驱动）
✅ 聪明钱跟单策略（增强版）已初始化
🎯 开始监听聪明钱交易...
```

**标准版**：
```
📦 使用标准版聪明钱跟单策略
✅ 聪明钱跟单策略已初始化
```

## 如果仍然有问题

1. **检查日志**：查看详细的错误信息
2. **启用调试**：设置 `ENABLE_SMART_MONEY_DEBUG=true`
3. **检查配置**：确认 `.env` 文件配置正确
4. **查看文档**：参考 `ENHANCED_SMART_MONEY.md` 或 `SMART_MONEY_GUIDE.md`
