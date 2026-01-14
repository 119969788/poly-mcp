# 增强版聪明钱跟单功能

## 概述

参考 `@catalyst-team/poly-mcp` 的设计思路，新增了**事件驱动**的增强版聪明钱跟单策略。

## 主要特性

### 🚀 事件驱动架构
- 使用 Node.js EventEmitter 实现事件驱动
- 实时监听聪明钱交易，无需轮询
- 新交易自动触发跟单信号

### 📊 智能统计
- 跟踪每个地址的交易统计
- 根据交易者胜率动态调整信号强度
- 记录平均利润和历史表现

### ⚡ 实时响应
- 独立的检查间隔（默认 10 秒）
- 更快的交易检测速度
- 自动去重和清理机制

### 🔧 灵活配置
- 可选择使用标准版或增强版
- 支持动态添加/移除监控地址
- 详细的调试日志

## 启用增强版

### 步骤 1: 编辑 .env 文件

```bash
cd ~/poly-mcp
nano .env
```

### 步骤 2: 添加配置

```env
# 启用聪明钱跟单
ENABLE_SMART_MONEY=true

# 使用增强版（事件驱动）
USE_ENHANCED_SMART_MONEY=true

# 聪明钱检查间隔（毫秒，默认 10000 = 10秒）
SMART_MONEY_CHECK_INTERVAL=10000

# 设置要跟随的聪明钱地址
SMART_MONEY_ADDRESSES=0x你的地址1,0x你的地址2

# 跟单参数
COPY_TRADE_SIZE_MULTIPLIER=0.1
COPY_TRADE_FETCH_LIMIT=100

# 是否允许真实下单
ENABLE_COPY_TRADING_EXECUTION=false
```

### 步骤 3: 重启应用

```bash
pm2 restart poly-mcp-arbitrage
pm2 logs poly-mcp-arbitrage
```

## 配置说明

### 核心配置

- **USE_ENHANCED_SMART_MONEY**: 是否使用增强版
  - `true`: 使用事件驱动的增强版
  - `false` 或不设置: 使用标准版

- **SMART_MONEY_CHECK_INTERVAL**: 检查间隔（毫秒）
  - 默认: 10000 (10秒)
  - 建议范围: 5000-30000
  - 太短可能增加 API 调用频率

### 其他配置

与标准版相同：
- `SMART_MONEY_ADDRESSES`: 监控地址列表
- `COPY_TRADE_SIZE_MULTIPLIER`: 跟单比例
- `COPY_TRADE_FETCH_LIMIT`: 每次拉取的交易数量
- `ENABLE_COPY_TRADING_EXECUTION`: 是否真实下单

## 增强版 vs 标准版

| 特性 | 标准版 | 增强版 |
|------|--------|--------|
| 架构 | 轮询模式 | 事件驱动 |
| 响应速度 | 依赖主循环 | 独立定时器 |
| 统计功能 | 基础 | 详细（胜率、利润） |
| 事件监听 | 无 | 支持 |
| 动态管理 | 基础 | 完整（添加/移除地址） |
| 资源占用 | 较低 | 中等 |

## 事件系统

增强版支持以下事件：

### newTrade
当检测到新的聪明钱交易时触发：

```javascript
smartMoneyStrategy.on('newTrade', (data) => {
  const { address, trade, signal } = data;
  console.log('新交易:', address, trade);
});
```

### addressAdded
当添加新监控地址时触发：

```javascript
smartMoneyStrategy.on('addressAdded', (address) => {
  console.log('已添加地址:', address);
});
```

### addressRemoved
当移除监控地址时触发：

```javascript
smartMoneyStrategy.on('addressRemoved', (address) => {
  console.log('已移除地址:', address);
});
```

### error
当发生错误时触发：

```javascript
smartMoneyStrategy.on('error', (error) => {
  console.error('错误:', error);
});
```

## 使用示例

### 基本使用

```env
ENABLE_SMART_MONEY=true
USE_ENHANCED_SMART_MONEY=true
SMART_MONEY_ADDRESSES=0xabc...,0xdef...
```

### 快速响应模式

```env
ENABLE_SMART_MONEY=true
USE_ENHANCED_SMART_MONEY=true
SMART_MONEY_CHECK_INTERVAL=5000  # 5秒检查一次
```

### 调试模式

```env
ENABLE_SMART_MONEY=true
USE_ENHANCED_SMART_MONEY=true
ENABLE_SMART_MONEY_DEBUG=true
ENABLE_DETAILED_LOGS=true
```

## 验证功能

启动后应该看到：

```
📦 使用增强版聪明钱跟单策略（事件驱动）
✅ 聪明钱跟单策略（增强版）已初始化
   监控地址数量: 2
   地址列表:
     1. 0x1234567890abcdef...
     2. 0xabcdef1234567890...
🎯 开始监听聪明钱交易...

🔍 [10:30:15] 检查 2 个聪明钱地址...
   📊 0x12345678...: 总10 | 新3 | 跳过7 | 无效0
```

## 统计信息

增强版提供更详细的统计：

```
🧠 聪明钱策略统计:
   监控地址: 2
   发现信号: 15
   执行交易: 8
   已处理交易: 150
   地址统计:
     0x123...: { totalTrades: 10, winRate: 0.65, avgProfit: 0.12 }
     0x456...: { totalTrades: 5, winRate: 0.55, avgProfit: 0.08 }
```

## 性能优化

### 检查间隔建议

- **高频交易者**: 5000-10000ms (5-10秒)
- **一般交易者**: 10000-20000ms (10-20秒)
- **低频交易者**: 20000-30000ms (20-30秒)

### 内存管理

- 自动清理已处理的交易记录
- 默认保留最多 10000 条记录
- 超过限制时自动清理一半

## 故障排查

### 问题：没有检测到交易

1. 检查地址是否正确
2. 启用调试模式查看详细日志
3. 检查 API 是否支持按地址获取交易

### 问题：事件没有触发

1. 确认 `USE_ENHANCED_SMART_MONEY=true`
2. 检查是否调用了 `start()` 方法
3. 查看日志确认监听已启动

### 问题：内存占用过高

1. 减少 `SMART_MONEY_CHECK_INTERVAL`
2. 减少 `COPY_TRADE_FETCH_LIMIT`
3. 定期清理已处理的交易记录

## 迁移指南

### 从标准版迁移到增强版

1. 在 `.env` 中添加 `USE_ENHANCED_SMART_MONEY=true`
2. 重启应用
3. 观察日志确认增强版已启用

### 从增强版回退到标准版

1. 移除或设置 `USE_ENHANCED_SMART_MONEY=false`
2. 重启应用

## 注意事项

⚠️ **重要提示**：

1. 增强版使用独立定时器，会额外占用资源
2. 检查间隔太短可能触发 API 速率限制
3. 建议先测试信号模式，确认无误后再开启真实下单
4. 定期审查监控地址的表现，及时调整

## 完整配置示例

```env
# 基础配置
PRIVATE_KEY=0x你的私钥
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的密钥
POLYMARKET_API_PASSPHRASE=你的密码短语

# 聪明钱跟单配置（增强版）
ENABLE_SMART_MONEY=true
USE_ENHANCED_SMART_MONEY=true
SMART_MONEY_CHECK_INTERVAL=10000
SMART_MONEY_ADDRESSES=0x123...,0x456...
COPY_TRADE_SIZE_MULTIPLIER=0.1
COPY_TRADE_FETCH_LIMIT=100
ENABLE_COPY_TRADING_EXECUTION=false

# 调试模式（可选）
ENABLE_SMART_MONEY_DEBUG=true
ENABLE_DETAILED_LOGS=true
```
