# 开启跟单功能指南

## 快速启用

### 步骤 1: 编辑 .env 文件

```bash
cd ~/poly-mcp
nano .env
```

### 步骤 2: 添加以下配置

```env
# 启用跟单功能（默认已启用，无需设置）
ENABLE_COPY_TRADING=true

# 开启跟单自动下单（重要：设置为 true 才会真实下单）
ENABLE_COPY_TRADING_EXECUTION=true

# 设置要跟随的聪明钱地址（逗号分隔，不要有空格）
SMART_MONEY_ADDRESSES=0x1234567890abcdef1234567890abcdef12345678,0xabcdef1234567890abcdef1234567890abcdef12

# 跟单参数（可选）
# 复制比例：0.1 表示跟随原单 10% 的规模
COPY_TRADE_SIZE_MULTIPLIER=0.1

# 每个地址每次拉取多少条成交记录
COPY_TRADE_FETCH_LIMIT=50

# 最小信号强度（0-1，0.7 表示 70%）
MIN_SIGNAL_STRENGTH=0.7

# 最小大额交易金额（USDC）
MIN_LARGE_TRADE_SIZE=1000
```

### 步骤 3: 保存并重启

```bash
# 保存文件（Ctrl+X, Y, Enter）

# 重启 PM2
pm2 restart poly-mcp-arbitrage

# 查看日志
pm2 logs poly-mcp-arbitrage --lines 50
```

## 配置说明

### 必需配置

1. **SMART_MONEY_ADDRESSES**: 要跟随的钱包地址列表
   - 格式：逗号分隔，不要有空格
   - 示例：`0xabc...,0xdef...`
   - 如何找到聪明钱地址：
     - 在 Polymarket 上查看高胜率交易者
     - 使用链上分析工具（如 Dune Analytics）
     - 关注知名交易者的公开地址

2. **ENABLE_COPY_TRADING_EXECUTION**: 是否允许真实下单
   - `true`: 自动跟单下单（**请谨慎使用**）
   - `false`: 只显示跟单信号，不下单（默认，安全模式）

### 可选配置

- **COPY_TRADE_SIZE_MULTIPLIER**: 跟单比例（0.1 = 10%）
- **COPY_TRADE_FETCH_LIMIT**: 每次拉取的成交记录数
- **MIN_SIGNAL_STRENGTH**: 最小信号强度阈值
- **MIN_LARGE_TRADE_SIZE**: 大额交易的最小金额

## 安全建议

⚠️ **重要提示**：

1. **先测试信号模式**：
   - 先设置 `ENABLE_COPY_TRADING_EXECUTION=false`
   - 观察跟单信号是否合理
   - 确认无误后再开启真实下单

2. **设置合理的跟单比例**：
   - 建议从 0.1（10%）开始
   - 不要设置太大，避免风险

3. **选择可靠的聪明钱地址**：
   - 选择历史胜率高的交易者
   - 避免跟随新地址或可疑地址

4. **设置风险限制**：
   - 确保设置了 `MAX_DAILY_LOSS`
   - 设置合理的 `MAX_POSITION_SIZE`

## 验证跟单功能

重启后，查看日志应该看到：

```
👥 发现 X 个跟单信号
📝 跟单信号: 市场 XXX, 方向: buy, 强度: 0.85
```

如果开启了真实下单：
```
✅ 跟单交易执行成功: 市场 XXX, 金额: X USDC
```

## 常见问题

### Q: 如何找到聪明钱地址？

A: 可以通过以下方式：
1. Polymarket 网站上的交易排行榜
2. 链上分析工具（Dune Analytics, Etherscan）
3. 社交媒体上的公开地址
4. 交易社区推荐

### Q: 跟单信号一直为 0？

A: 检查：
1. `SMART_MONEY_ADDRESSES` 是否设置正确
2. 地址格式是否正确（0x 开头，42 个字符）
3. 这些地址是否有最近的交易活动

### Q: 如何停止跟单？

A: 设置 `ENABLE_COPY_TRADING=false` 或 `ENABLE_COPY_TRADING_EXECUTION=false`

## 完整配置示例

```env
# 基础配置
PRIVATE_KEY=0x你的私钥
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的密钥
POLYMARKET_API_PASSPHRASE=你的密码短语

# 跟单配置
ENABLE_COPY_TRADING=true
ENABLE_COPY_TRADING_EXECUTION=true
SMART_MONEY_ADDRESSES=0x123...,0x456...
COPY_TRADE_SIZE_MULTIPLIER=0.1
COPY_TRADE_FETCH_LIMIT=50
MIN_SIGNAL_STRENGTH=0.7
MIN_LARGE_TRADE_SIZE=1000

# 风险管理
MAX_POSITION_SIZE=100
MAX_DAILY_LOSS=1000
MAX_POSITIONS=10
```

## 一键启用命令

```bash
cd ~/poly-mcp && \
echo "" >> .env && \
echo "# 跟单配置" >> .env && \
echo "ENABLE_COPY_TRADING=true" >> .env && \
echo "ENABLE_COPY_TRADING_EXECUTION=true" >> .env && \
echo "# SMART_MONEY_ADDRESSES=0x你的地址1,0x你的地址2" >> .env && \
echo "✅ 配置已添加，请编辑 .env 文件设置 SMART_MONEY_ADDRESSES" && \
echo "然后运行: pm2 restart poly-mcp-arbitrage"
```
