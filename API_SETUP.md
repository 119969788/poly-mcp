# Polymarket API 配置指南

参考官方文档: https://docs.polymarket.com/quickstart/first-order

## 步骤 1: 安装依赖

```bash
npm install @polymarket/clob-client ethers@5
```

## 步骤 2: 配置私钥

在 `.env` 文件中设置你的私钥：

```env
PRIVATE_KEY=your_private_key_here
```

**重要**: 
- 私钥必须以 `0x` 开头
- 确保私钥安全，不要泄露
- 不要将 `.env` 文件提交到 Git

## 步骤 3: 生成 API 凭证

运行以下命令生成 API 密钥：

```bash
node src/generateApiKey.js
```

这会生成以下信息：
- `POLYMARKET_API_KEY`: API 密钥
- `POLYMARKET_API_SECRET`: API 密钥
- `POLYMARKET_API_PASSPHRASE`: API 密码短语

将这些信息添加到 `.env` 文件中。

## 步骤 4: 配置签名类型

根据你的使用方式选择签名类型：

### EOA (外部拥有账户) - 推荐用于独立钱包

```env
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址
```

- 你自己支付 gas 费用
- 资金在你的钱包中
- 完全控制

### POLY_PROXY (Polymarket 代理) - 用于 Polymarket.com 账户

```env
SIGNATURE_TYPE=1
FUNDER_ADDRESS=你的代理钱包地址
```

- 通过 Polymarket.com 账户交易
- 资金存储在代理钱包中
- 需要从 Polymarket.com 获取代理钱包地址

### GNOSIS_SAFE (Gnosis Safe 钱包)

```env
SIGNATURE_TYPE=2
FUNDER_ADDRESS=你的 Gnosis Safe 地址
```

## 步骤 5: 完整配置示例

`.env` 文件示例：

```env
# 私钥（必需）
PRIVATE_KEY=0x你的私钥

# API 凭证（运行 generateApiKey.js 后添加）
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的API密钥
POLYMARKET_API_PASSPHRASE=你的密码短语

# Polymarket 配置
POLYMARKET_HOST=https://clob.polymarket.com
CHAIN_ID=137

# 签名类型和资金地址
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址

# 交易配置
MAX_POSITION_SIZE=100
MIN_PROFIT_MARGIN=0.02
CHECK_INTERVAL=30000

# 风险管理配置
MAX_DAILY_LOSS=1000
MAX_POSITIONS=10

# 策略配置
ENABLE_COPY_TRADING=true
MIN_SIGNAL_STRENGTH=0.7
MIN_LARGE_TRADE_SIZE=1000

# 日志配置
LOG_LEVEL=info
ENABLE_DETAILED_LOGS=false
```

## 步骤 6: 测试连接

运行程序测试连接：

```bash
npm start
```

如果一切正常，你应该看到：
- ✅ 连接到 Polymarket
- ✅ 钱包地址显示
- ✅ 客户端初始化完成

## 常见问题

### Q: 如何获取代理钱包地址？

如果你使用 Polymarket.com 账户：
1. 登录 Polymarket.com
2. 进入账户设置
3. 查看钱包信息，找到代理钱包地址

### Q: 如何确保钱包有足够的资金？

1. 确保钱包中有足够的 USDC（Polygon 网络）
2. 确保有足够的 MATIC 用于 gas 费用
3. 检查余额：程序启动时会显示余额信息

### Q: 私钥格式错误？

私钥必须：
- 以 `0x` 开头
- 长度为 66 个字符（包括 0x）
- 格式：`0x1234567890abcdef...`

### Q: API 凭证已过期？

重新运行 `node src/generateApiKey.js` 生成新的凭证。

### Q: 网络连接问题？

检查：
1. 网络连接是否正常
2. `POLYMARKET_HOST` 是否正确
3. `CHAIN_ID` 是否匹配（主网: 137）

## 安全提示

⚠️ **重要安全建议**:

1. **保护私钥**:
   - 永远不要将私钥提交到 Git
   - 使用 `.env` 文件存储，并确保在 `.gitignore` 中
   - 不要分享私钥给任何人

2. **保护 API 凭证**:
   - API 凭证同样敏感，不要泄露
   - 定期轮换 API 密钥

3. **使用环境变量**:
   - 生产环境使用环境变量或密钥管理服务
   - 不要在代码中硬编码密钥

4. **测试环境**:
   - 先在测试环境测试
   - 使用小额资金测试

5. **监控**:
   - 定期检查账户余额
   - 监控交易活动
   - 设置异常警报

## 参考文档

- Polymarket 官方文档: https://docs.polymarket.com/
- CLOB Client 文档: https://docs.polymarket.com/clob-client
- 首次订单指南: https://docs.polymarket.com/quickstart/first-order
