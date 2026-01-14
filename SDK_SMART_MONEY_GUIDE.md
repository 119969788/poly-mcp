# SDK 版聪明钱跟单功能

## 概述

参考 [poly-copy-trading](https://github.com/119969788/poly-copy-trading) 的实现，使用 `@catalyst-team/poly-sdk` 的 `smartMoney.startAutoCopyTrading()` API 实现自动跟单。

## 主要特性

### 🚀 官方 SDK 支持
- 使用 `@catalyst-team/poly-sdk` 官方 SDK
- 调用 `smartMoney.startAutoCopyTrading()` API
- 完整的类型支持和错误处理

### 📊 完整的风险控制
- **sizeScale**: 跟随规模比例（默认 10%）
- **maxSizePerTrade**: 最大单笔交易金额（默认 10 USDC）
- **maxSlippage**: 最大滑点（默认 3%）
- **orderType**: 订单类型（FOK/IOC）
- **minTradeSize**: 最小交易金额（默认 5 USDC）

### 🛡️ 安全模式
- **dryRun**: 模拟模式（默认启用）
- 首次运行自动授权 USDC.e
- 详细的交易日志

### 🎯 灵活配置
- 支持指定目标地址列表
- 支持跟随排行榜前 50 名
- 实时统计和监控

## 安装依赖

首先需要安装 `@catalyst-team/poly-sdk`：

```bash
npm install @catalyst-team/poly-sdk
```

## 启用 SDK 版

### 步骤 1: 编辑 .env 文件

```bash
cd ~/poly-mcp
nano .env
```

### 步骤 2: 添加配置

```env
# 启用聪明钱跟单
ENABLE_SMART_MONEY=true

# 使用 SDK 版（使用 @catalyst-team/poly-sdk）
USE_SDK_SMART_MONEY=true

# 可选：指定要跟随的钱包地址（用逗号分隔）
# 如果不设置，则跟随排行榜前 50 名
TARGET_ADDRESSES=0x你的地址1,0x你的地址2

# 风险控制参数
COPY_SIZE_SCALE=0.1          # 跟随规模 10%
MAX_SIZE_PER_TRADE=10        # 最大单笔 10 USDC
MAX_SLIPPAGE=0.03            # 最大滑点 3%
ORDER_TYPE=FOK               # 订单类型：FOK 或 IOC
MIN_TRADE_SIZE=5             # 最小交易 5 USDC

# 模拟模式（推荐首次使用）
DRY_RUN=true                 # true=模拟模式，false=实盘模式

# 或者使用统一的下单开关
ENABLE_COPY_TRADING_EXECUTION=false
```

### 步骤 3: 重启应用

```bash
pm2 restart poly-mcp-arbitrage
pm2 logs poly-mcp-arbitrage
```

## 配置说明

### 核心配置

- **USE_SDK_SMART_MONEY**: 是否使用 SDK 版
  - `true`: 使用 `@catalyst-team/poly-sdk` 的自动跟单 API
  - `false`: 使用其他版本

- **TARGET_ADDRESSES**: 目标地址列表
  - 格式：逗号分隔，不要有空格
  - 如果不设置：跟随排行榜前 50 名
  - 示例：`0xabc...,0xdef...`

### 风险控制参数

- **COPY_SIZE_SCALE**: 跟随规模比例
  - 默认：0.1 (10%)
  - 范围：0.01 - 1.0
  - 建议：0.1 - 0.2

- **MAX_SIZE_PER_TRADE**: 最大单笔交易金额
  - 默认：10 USDC
  - 建议：根据资金量调整

- **MAX_SLIPPAGE**: 最大滑点
  - 默认：0.03 (3%)
  - 范围：0.01 - 0.1
  - 建议：0.02 - 0.05

- **ORDER_TYPE**: 订单类型
  - `FOK`: Fill or Kill（完全成交或取消）
  - `IOC`: Immediate or Cancel（立即成交或取消）

- **MIN_TRADE_SIZE**: 最小交易金额
  - 默认：5 USDC
  - 低于此金额的交易会被忽略

### 安全模式

- **DRY_RUN**: 模拟模式
  - `true`: 只模拟，不真实下单（推荐首次使用）
  - `false`: 真实下单

- **ENABLE_COPY_TRADING_EXECUTION**: 统一下单开关
  - `true`: 允许真实下单
  - `false`: 只显示信号

## 使用模式

### 模式 1: 跟随排行榜（推荐）

不设置 `TARGET_ADDRESSES`，自动跟随排行榜前 50 名：

```env
ENABLE_SMART_MONEY=true
USE_SDK_SMART_MONEY=true
DRY_RUN=true
```

### 模式 2: 跟随指定地址

设置 `TARGET_ADDRESSES`：

```env
ENABLE_SMART_MONEY=true
USE_SDK_SMART_MONEY=true
TARGET_ADDRESSES=0x123...,0x456...
DRY_RUN=true
```

### 模式 3: 实盘模式

关闭模拟模式：

```env
ENABLE_SMART_MONEY=true
USE_SDK_SMART_MONEY=true
DRY_RUN=false
# 或
ENABLE_COPY_TRADING_EXECUTION=true
```

## 验证功能

启动后应该看到：

```
📦 使用 SDK 版聪明钱跟单策略（@catalyst-team/poly-sdk）
✅ 聪明钱跟单策略（SDK版）已初始化
   使用 @catalyst-team/poly-sdk 的自动跟单 API
🔐 检查 USDC.e 授权状态...
✅ USDC.e 授权检查完成
🚀 启动聪明钱自动跟单...
📋 配置参数:
   跟随规模: 10%
   最大单笔: 10 USDC
   最大滑点: 3%
   订单类型: FOK
   最小交易: 5 USDC
   模拟模式: 是
   跟随模式: 排行榜前 50 名
✅ 聪明钱自动跟单已启动
```

## 统计信息

程序会显示详细的统计信息：

```
📊 聪明钱跟单统计:
   运行时间: 30分15秒
   总交易数: 25
   成功交易: 23
   失败交易: 2
   总利润: 45.67 USDC
   成功率: 92.00%
```

## 版本对比

| 特性 | 标准版 | 增强版 | SDK版 |
|------|--------|--------|-------|
| API | 自定义实现 | 事件驱动 | 官方 SDK |
| 自动跟单 | ❌ | ❌ | ✅ |
| 排行榜支持 | ❌ | ❌ | ✅ |
| 风险控制 | 基础 | 基础 | 完整 |
| 授权管理 | 手动 | 手动 | 自动 |
| 稳定性 | 中等 | 高 | 最高 |

## 故障排查

### 问题：SDK 未安装

错误信息：
```
❌ 初始化 SDK 失败: Cannot find module '@catalyst-team/poly-sdk'
```

解决方案：
```bash
npm install @catalyst-team/poly-sdk
```

### 问题：授权失败

错误信息：
```
⚠️  授权检查失败（可能已授权）
```

解决方案：
- 如果已授权，可以忽略此警告
- 如果首次运行，请检查：
  - 网络连接
  - 私钥是否正确
  - 钱包是否有足够的 USDC.e

### 问题：没有检测到交易

可能原因：
1. 目标地址没有交易活动
2. 交易金额小于 `MIN_TRADE_SIZE`
3. 模拟模式下只显示日志

解决方案：
1. 检查目标地址是否有交易
2. 降低 `MIN_TRADE_SIZE`
3. 查看详细日志

## 安全建议

⚠️ **重要提示**：

1. **首次使用**：强烈建议在 `DRY_RUN=true` 模式下测试
2. **风险控制**：根据资金量调整参数
3. **监控交易**：定期检查统计信息
4. **私钥安全**：不要泄露私钥
5. **资金管理**：不要投入超过承受能力的资金

## 完整配置示例

```env
# 基础配置
PRIVATE_KEY=0x你的私钥
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的密钥
POLYMARKET_API_PASSPHRASE=你的密码短语

# SDK 聪明钱跟单配置
ENABLE_SMART_MONEY=true
USE_SDK_SMART_MONEY=true

# 目标地址（可选，不设置则跟随排行榜）
# TARGET_ADDRESSES=0x123...,0x456...

# 风险控制参数
COPY_SIZE_SCALE=0.1
MAX_SIZE_PER_TRADE=10
MAX_SLIPPAGE=0.03
ORDER_TYPE=FOK
MIN_TRADE_SIZE=5

# 安全模式
DRY_RUN=true
# ENABLE_COPY_TRADING_EXECUTION=false
```

## 参考

- [poly-copy-trading 仓库](https://github.com/119969788/poly-copy-trading)
- [@catalyst-team/poly-sdk 文档](https://www.npmjs.com/package/@catalyst-team/poly-sdk)
