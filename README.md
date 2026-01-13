# Polymarket 跟单套利程序

基于 `@catalyst-team/poly-mcp` 的 Polymarket 预测市场跟单套利交易程序。

## 功能特性

- 🔍 **套利策略**: 自动识别跨市场、订单簿和价格不匹配的套利机会
- 👥 **跟单策略**: 跟随"聪明钱"和大额交易者的交易信号
- 🛡️ **风险管理**: 内置风险控制机制，防止过度交易和重大损失
- 📊 **实时监控**: 持续监控市场并自动执行交易
- 📈 **统计报告**: 实时显示交易统计和收益情况

## 安装

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：

复制 `.env.example` 为 `.env` 并填写必要的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 API 密钥和其他参数。

## 使用方法

### 启动程序

```bash
npm start
```

### 开发模式（自动重启）

```bash
npm run dev
```

## 配置说明

### 交易配置

- `MAX_POSITION_SIZE`: 单笔交易最大金额（USDC）
- `MIN_PROFIT_MARGIN`: 最小套利利润率（如 0.02 表示 2%）
- `CHECK_INTERVAL`: 市场扫描间隔（毫秒）

### 风险管理配置

- `MAX_DAILY_LOSS`: 每日最大损失限制（USDC）
- `MAX_POSITIONS`: 最大同时持仓数量

### 策略配置

- `ENABLE_COPY_TRADING`: 是否启用跟单策略
- `MIN_SIGNAL_STRENGTH`: 最小跟单信号强度（0-1）
- `SMART_MONEY_ADDRESSES`: 聪明钱地址列表（逗号分隔）

## 策略说明

### 套利策略

1. **跨市场套利**: 识别相同事件在不同市场的价格差异
2. **订单簿套利**: 在订单簿的买卖价差中寻找机会
3. **价格不匹配套利**: 利用 Yes + No 价格不等于 1 的机会

### 跟单策略

1. **大额交易跟随**: 跟随大额交易者的交易信号
2. **聪明钱跟随**: 跟踪已知高胜率交易者的地址
3. **高胜率交易者跟随**: 识别并跟随历史胜率高的交易者

## 风险提示

⚠️ **重要**: 这是一个示例程序，用于学习和研究目的。实际交易存在风险，请：

- 充分测试后再使用真实资金
- 仔细配置风险管理参数
- 监控程序运行状态
- 不要投入超过承受能力的资金
- 了解 Polymarket 的交易规则和风险

## 项目结构

```
.
├── src/
│   ├── index.js              # 程序入口
│   ├── arbitrageBot.js       # 主机器人逻辑
│   ├── polyMarketClient.js   # Polymarket 客户端封装
│   ├── riskManager.js        # 风险管理器
│   ├── config.js             # 配置管理
│   └── strategies/
│       ├── arbitrageStrategy.js    # 套利策略
│       └── copyTradingStrategy.js  # 跟单策略
├── .env.example              # 环境变量示例
├── package.json
└── README.md
```

## 开发说明

### 待实现功能

当前代码提供了一个完整的框架，但以下功能需要根据 `@catalyst-team/poly-mcp` 的实际 API 进行实现：

1. `PolyMarketClient` 中的实际 API 调用
2. MCP 客户端的连接和工具调用
3. 实际的交易执行逻辑
4. 市场数据的获取和解析

### 扩展建议

- 添加更多套利策略
- 实现机器学习模型预测
- 添加 Web UI 监控界面
- 集成更多的数据源
- 添加回测功能

## 许可证

MIT

## 参考

- [@catalyst-team/poly-mcp](https://www.npmjs.com/package/@catalyst-team/poly-mcp)
- [Polymarket](https://polymarket.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
