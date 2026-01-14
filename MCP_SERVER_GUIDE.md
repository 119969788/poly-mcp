# Polymarket MCP 服务器使用指南

## 概述

Polymarket MCP 服务器实现了完整的 Model Context Protocol (MCP) 标准，提供了所有 Polymarket 交易功能的接口。

## 功能特性

### 工具（Tools）

MCP 服务器提供了以下工具：

1. **市场查询工具**
   - `get_markets`: 获取活跃市场列表
   - `get_market_details`: 获取市场详细信息
   - `get_market_prices`: 获取市场价格
   - `get_order_book`: 获取订单簿

2. **交易工具**
   - `execute_trade`: 执行交易
   - `get_balance`: 获取账户余额
   - `get_trade_history`: 获取交易历史

3. **策略工具**
   - `find_arbitrage_opportunities`: 查找套利机会
   - `get_smart_money_signals`: 获取聪明钱信号
   - `get_copy_trading_signals`: 获取跟单信号

4. **机器人控制工具**
   - `start_bot`: 启动自动交易机器人
   - `stop_bot`: 停止机器人
   - `get_bot_status`: 获取机器人状态
   - `get_statistics`: 获取统计信息

### 资源（Resources）

MCP 服务器提供了以下资源：

- `poly://markets`: 活跃市场列表
- `poly://market/{marketId}`: 市场详情
- `poly://balance`: 账户余额
- `poly://statistics`: 交易统计
- `poly://config`: 配置信息

### 提示（Prompts）

MCP 服务器提供了以下提示模板：

- `analyze_market`: 分析市场并给出交易建议
- `find_arbitrage`: 查找套利机会
- `smart_money_analysis`: 分析聪明钱交易
- `risk_assessment`: 风险评估

## 安装和启动

### 1. 安装依赖

```bash
cd ~/poly-mcp
npm install
```

### 2. 配置环境变量

确保 `.env` 文件已正确配置：

```bash
nano .env
```

至少需要设置：
- `PRIVATE_KEY`: 你的私钥
- `POLYMARKET_API_KEY`: API 密钥（可选）
- `POLYMARKET_API_SECRET`: API 密钥（可选）
- `POLYMARKET_API_PASSPHRASE`: API 密钥（可选）

### 3. 启动 MCP 服务器

#### 方式 1: 直接运行

```bash
npm run mcp
```

#### 方式 2: 开发模式（自动重启）

```bash
npm run mcp:dev
```

#### 方式 3: 使用 PM2

```bash
pm2 start src/mcpServer.js --name poly-mcp-server
pm2 logs poly-mcp-server
```

## 在 Claude Desktop 中使用

### 1. 配置 Claude Desktop

编辑 Claude Desktop 配置文件（位置取决于操作系统）：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. 添加 MCP 服务器配置

```json
{
  "mcpServers": {
    "poly-mcp": {
      "command": "node",
      "args": ["/path/to/poly-mcp/src/mcpServer.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**注意**: 将 `/path/to/poly-mcp` 替换为实际的项目路径。

### 3. 重启 Claude Desktop

重启 Claude Desktop 后，MCP 服务器将自动连接。

## 在 Cursor 中使用

### 1. 配置 Cursor MCP

编辑 Cursor 的 MCP 配置文件（通常在设置中）。

### 2. 添加服务器配置

```json
{
  "mcpServers": {
    "poly-mcp": {
      "command": "node",
      "args": ["/path/to/poly-mcp/src/mcpServer.js"]
    }
  }
}
```

### 3. 重启 Cursor

重启 Cursor 后即可使用。

## 使用示例

### 示例 1: 获取市场列表

在 Claude Desktop 或 Cursor 中，你可以直接说：

```
请使用 get_markets 工具获取前 10 个活跃市场
```

### 示例 2: 分析市场

```
使用 analyze_market 提示分析市场 ID 为 xxx 的市场
```

### 示例 3: 查找套利机会

```
使用 find_arbitrage_opportunities 工具查找套利机会
```

### 示例 4: 执行交易

```
使用 execute_trade 工具买入市场 xxx，数量 10 USDC
```

### 示例 5: 启动机器人

```
使用 start_bot 工具启动自动交易机器人
```

## 工具详细说明

### get_markets

获取活跃市场列表。

**参数**:
- `limit` (可选): 返回数量限制，默认 100
- `filter` (可选): 过滤条件（active, closed, resolved, all），默认 active

**示例**:
```json
{
  "limit": 50,
  "filter": "active"
}
```

### get_market_details

获取市场详细信息。

**参数**:
- `marketId` (必需): 市场 ID

**示例**:
```json
{
  "marketId": "0x123..."
}
```

### execute_trade

执行交易。

**参数**:
- `marketId` (必需): 市场 ID
- `side` (必需): 交易方向（buy, sell, Yes, No）
- `size` (必需): 交易数量（USDC）
- `price` (可选): 限价
- `orderType` (可选): 订单类型（FOK, IOC, GTC），默认 FOK

**示例**:
```json
{
  "marketId": "0x123...",
  "side": "buy",
  "size": 10,
  "orderType": "FOK"
}
```

### find_arbitrage_opportunities

查找套利机会。

**参数**:
- `minProfitMargin` (可选): 最小利润率，默认 0.02
- `maxPositionSize` (可选): 最大单笔金额，默认 100

**示例**:
```json
{
  "minProfitMargin": 0.03,
  "maxPositionSize": 50
}
```

### get_smart_money_signals

获取聪明钱跟单信号。

**参数**:
- `addresses` (可选): 聪明钱地址列表
- `limit` (可选): 每个地址的交易数量限制，默认 50

**示例**:
```json
{
  "addresses": ["0x123...", "0x456..."],
  "limit": 100
}
```

## 资源 URI 说明

### poly://markets

获取所有活跃市场列表。

### poly://market/{marketId}

获取指定市场的详细信息。例如：
- `poly://market/0x123...`

### poly://balance

获取账户余额。

### poly://statistics

获取交易统计信息。

### poly://config

获取当前配置信息。

## 提示模板说明

### analyze_market

分析市场并给出交易建议。

**参数**:
- `marketId` (必需): 市场 ID

### find_arbitrage

查找套利机会的提示模板。

### smart_money_analysis

分析聪明钱交易。

**参数**:
- `address` (可选): 聪明钱地址

### risk_assessment

风险评估提示模板。

## 故障排除

### 问题 1: MCP 服务器无法启动

**检查**:
1. 确保 Node.js 版本 >= 16
2. 确保已安装所有依赖: `npm install`
3. 确保 `.env` 文件已正确配置

### 问题 2: 工具调用失败

**检查**:
1. 查看服务器日志
2. 确保已正确初始化客户端
3. 检查 API 凭证是否正确

### 问题 3: Claude Desktop 无法连接

**检查**:
1. 确保配置文件路径正确
2. 确保 Node.js 可执行文件路径正确
3. 查看 Claude Desktop 的日志

## 开发

### 添加新工具

在 `src/mcpServer.js` 的 `setupHandlers` 方法中：

1. 在 `ListToolsRequestSchema` 处理器中添加工具定义
2. 在 `CallToolRequestSchema` 处理器中添加处理逻辑

### 添加新资源

在 `src/mcpServer.js` 的 `setupHandlers` 方法中：

1. 在 `ListResourcesRequestSchema` 处理器中添加资源定义
2. 在 `ReadResourceRequestSchema` 处理器中添加读取逻辑

### 添加新提示

在 `src/mcpServer.js` 的 `setupHandlers` 方法中：

1. 在 `ListPromptsRequestSchema` 处理器中添加提示定义
2. 在 `GetPromptRequestSchema` 处理器中添加生成逻辑

## 参考

- [Model Context Protocol 文档](https://modelcontextprotocol.io/)
- [Polymarket API 文档](https://docs.polymarket.com/)
- [项目 GitHub](https://github.com/119969788/poly-mcp)
