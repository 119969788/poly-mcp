# 诊断聪明钱跟单问题

## 问题：没有跟随聪明钱

如果程序运行但没有跟单，按以下步骤诊断：

## 快速诊断

### 步骤 1: 检查配置

```bash
cd ~/poly-mcp
cat .env | grep -E "SMART_MONEY|ENABLE_SMART|USE_ENHANCED|USE_SDK"
```

应该看到：

```env
ENABLE_SMART_MONEY=true
SMART_MONEY_ADDRESSES=0x你的地址1,0x你的地址2
```

### 步骤 2: 启用调试模式

```bash
nano .env
```

添加：

```env
ENABLE_SMART_MONEY_DEBUG=true
ENABLE_DETAILED_LOGS=true
```

### 步骤 3: 重启并查看日志

```bash
pm2 restart poly-mcp-arbitrage
pm2 logs poly-mcp-arbitrage --lines 100
```

## 常见问题诊断

### 问题 1: 未设置地址

**症状**：
```
⚠️  未设置聪明钱地址，无法跟单
   请在 .env 文件中设置: SMART_MONEY_ADDRESSES=0x地址1,0x地址2
```

**解决**：
```bash
nano .env
# 添加
SMART_MONEY_ADDRESSES=0x你的地址1,0x你的地址2
```

### 问题 2: API 不支持按地址获取交易

**症状**：
```
⚠️  getTrades 方法不存在，无法按地址获取成交
   可用方法: getMarkets, getMarket, ...
```

**解决**：
这说明 `@polymarket/clob-client` 不支持按地址获取交易。可以：
1. 使用增强版（可能也有同样问题）
2. 等待 API 支持
3. 使用其他数据源

### 问题 3: 获取到交易但格式不匹配

**症状**：
```
✅ 获取到 10 条交易记录
   📊 地址 ... 统计:
      总交易: 10
      新交易: 0
      已跳过: 0
      无效: 10
```

**解决**：
1. 启用调试模式查看原始数据：
```env
ENABLE_SMART_MONEY_DEBUG=true
```

2. 查看日志中的原始交易数据格式
3. 根据实际格式调整代码

### 问题 4: 所有交易都已处理过

**症状**：
```
✅ 获取到 10 条交易记录
   📊 地址 ... 统计:
      总交易: 10
      新交易: 0
      已跳过: 10
      无效: 0
```

**解决**：
这是正常的，说明这些交易已经跟单过了。等待新的交易即可。

### 问题 5: 生成了信号但没有执行

**症状**：
```
🧠 发现 3 个聪明钱跟单信号
📝 聪明钱信号（未执行，下单开关未开启）: ...
```

**解决**：
如果想真实跟单，需要开启下单开关：

```env
ENABLE_COPY_TRADING_EXECUTION=true
```

## 完整诊断流程

### 1. 检查配置

```bash
cd ~/poly-mcp

# 检查是否启用
grep "ENABLE_SMART_MONEY" .env
# 应该显示: ENABLE_SMART_MONEY=true

# 检查地址是否设置
grep "SMART_MONEY_ADDRESSES" .env
# 应该显示: SMART_MONEY_ADDRESSES=0x...

# 检查版本选择
grep "USE_ENHANCED\|USE_SDK" .env
```

### 2. 启用调试模式

```bash
echo "ENABLE_SMART_MONEY_DEBUG=true" >> .env
echo "ENABLE_DETAILED_LOGS=true" >> .env
pm2 restart poly-mcp-arbitrage
```

### 3. 查看详细日志

```bash
pm2 logs poly-mcp-arbitrage --lines 200 | grep -E "聪明钱|smart|地址|交易"
```

### 4. 检查 API 支持

查看日志中是否有：
```
⚠️  getTrades 方法不存在
```

如果有，说明 API 不支持按地址获取交易。

## 测试聪明钱地址

### 方法 1: 使用已知活跃地址

找一个已知有交易的地址进行测试：

```env
SMART_MONEY_ADDRESSES=0x已知活跃地址
```

### 方法 2: 检查地址是否有交易

可以在浏览器中查看地址的交易历史，确认地址确实有交易活动。

### 方法 3: 清空已处理记录

如果所有交易都被去重，可以重启程序（会清空内存中的记录）：

```bash
pm2 restart poly-mcp-arbitrage
```

## 验证步骤

### 步骤 1: 确认配置正确

```bash
cd ~/poly-mcp
npm run check-config
```

### 步骤 2: 查看启动日志

```bash
pm2 logs poly-mcp-arbitrage | grep -A 5 "聪明钱"
```

应该看到：
```
📦 使用标准版聪明钱跟单策略
✅ 聪明钱跟单策略已初始化
   监控地址数量: 2
```

### 步骤 3: 查看运行日志

```bash
pm2 logs poly-mcp-arbitrage | tail -50
```

应该看到：
```
🧠 开始检查 2 个聪明钱地址...
   📍 检查地址: 0x12345678...
   ✅ 获取到 X 条交易记录
```

## 如果仍然没有跟单

### 检查清单

- [ ] `ENABLE_SMART_MONEY=true` 已设置
- [ ] `SMART_MONEY_ADDRESSES` 已设置且格式正确
- [ ] 地址确实有交易活动
- [ ] API 支持按地址获取交易
- [ ] 调试模式已启用
- [ ] 查看详细日志

### 获取帮助信息

运行诊断脚本：

```bash
cd ~/poly-mcp
node -e "
const config = require('./src/config.js').config;
console.log('配置检查:');
console.log('  ENABLE_SMART_MONEY:', config.enableSmartMoney);
console.log('  SMART_MONEY_ADDRESSES:', config.smartMoneyAddresses);
console.log('  USE_ENHANCED_SMART_MONEY:', config.useEnhancedSmartMoney);
console.log('  USE_SDK_SMART_MONEY:', config.useSDKSmartMoney);
console.log('  ENABLE_COPY_TRADING_EXECUTION:', config.enableCopyTradingExecution);
"
```

## 常见解决方案

### 方案 1: 使用增强版

如果标准版有问题，尝试增强版：

```env
USE_ENHANCED_SMART_MONEY=true
USE_SDK_SMART_MONEY=false
```

### 方案 2: 检查地址格式

确保地址格式正确：
- 以 `0x` 开头
- 42 个字符（包括 0x）
- 逗号分隔，不要有空格

### 方案 3: 等待新交易

如果所有交易都已处理过，等待聪明钱地址的新交易。

### 方案 4: 检查 API 限制

某些 API 可能有速率限制或地理限制，检查网络连接和 API 状态。
