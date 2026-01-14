# Polymarket API 凭证生成详细流程

参考官方文档: https://docs.polymarket.com/quickstart/first-order

## 完整流程

### 步骤 1: 安装依赖

```bash
npm install @polymarket/clob-client ethers@5
```

### 步骤 2: 配置私钥

在 `.env` 文件中设置你的私钥：

```env
PRIVATE_KEY=0x你的私钥
```

**重要**: 
- 私钥必须以 `0x` 开头
- 确保私钥安全，不要泄露
- 不要将 `.env` 文件提交到 Git

### 步骤 3: 初始化客户端（使用私钥）

```javascript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers";

const HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon 主网
const signer = new Wallet(process.env.PRIVATE_KEY);

const client = new ClobClient(HOST, CHAIN_ID, signer);
```

这一步只是用私钥初始化客户端，还没有 API 凭证。

### 步骤 4: 派生用户 API 凭证

```javascript
// 获取现有的 API 密钥，如果不存在则创建一个
const userApiCreds = await client.createOrDeriveApiKey();

console.log("API Key:", userApiCreds.apiKey);
console.log("Secret:", userApiCreds.secret);
console.log("Passphrase:", userApiCreds.passphrase);
```

**说明**:
- 这个方法会使用你的私钥派生 API 凭证
- 如果该私钥已经生成过 API 凭证，会返回现有的凭证
- 如果还没有生成过，会创建新的凭证
- 这些凭证用于后续所有 API 请求的身份验证

### 步骤 5: 配置签名类型和资金地址

根据你的使用方式选择签名类型：

| 交易方式 | 类型 | 值 | 资金地址 |
|---------|------|-----|---------|
| 使用 EOA 钱包，自己支付 gas | EOA | 0 | 你的 EOA 钱包地址 |
| 通过 Polymarket.com 账户交易（Magic Link/Google 登录） | POLY_PROXY | 1 | 你的代理钱包地址 |
| 通过 Polymarket.com 账户交易（浏览器钱包连接） | GNOSIS_SAFE | 2 | 你的代理钱包地址 |

**重要**:
- 如果你有 Polymarket.com 账户，资金在代理钱包中，使用类型 1 或 2
- 类型 0 仅用于独立的 EOA 钱包
- 资金地址必须正确，否则无法交易

### 步骤 6: 使用完整认证重新初始化客户端

```javascript
const SIGNATURE_TYPE = 0; // EOA 示例
const FUNDER_ADDRESS = signer.address; // 对于 EOA，资金地址是钱包地址

const client = new ClobClient(
  HOST,
  CHAIN_ID,
  signer,
  userApiCreds,
  SIGNATURE_TYPE,
  FUNDER_ADDRESS
);
```

现在客户端已经配置了完整的认证信息，可以用于交易。

### 步骤 7: 下单（可选，用于测试）

```javascript
import { Side, OrderType } from "@polymarket/clob-client";

// 先获取市场信息
const market = await client.getMarket("TOKEN_ID");

const response = await client.createAndPostOrder(
  {
    tokenID: "TOKEN_ID",
    price: 0.50,        // 每份额价格 ($0.50)
    size: 10,           // 份额数量
    side: Side.BUY,     // BUY 或 SELL
  },
  {
    tickSize: market.tickSize,
    negRisk: market.negRisk,    // 多结果事件为 true
  },
  OrderType.GTC  // Good-Til-Cancelled
);
```

## 使用我们的脚本

我们已经创建了自动化脚本，按照上述流程生成 API 凭证：

```bash
# 1. 确保已配置私钥
# 编辑 .env 文件，设置 PRIVATE_KEY

# 2. 运行生成脚本
npm run generate-api

# 3. 将输出的 API 凭证添加到 .env 文件
```

## 配置示例

完整的 `.env` 配置：

```env
# 私钥（必需）
PRIVATE_KEY=0x你的私钥

# API 凭证（运行 npm run generate-api 后添加）
POLYMARKET_API_KEY=你的API密钥
POLYMARKET_API_SECRET=你的密钥
POLYMARKET_API_PASSPHRASE=你的密码短语

# Polymarket 配置
POLYMARKET_HOST=https://clob.polymarket.com
CHAIN_ID=137

# 签名类型和资金地址
SIGNATURE_TYPE=0
FUNDER_ADDRESS=你的钱包地址
```

## 常见问题

### Q: createOrDeriveApiKey 方法不存在？

**A**: 确保安装了正确版本的包：
```bash
npm install @polymarket/clob-client@latest
```

### Q: 如何获取代理钱包地址？

**A**: 如果你使用 Polymarket.com 账户：
1. 登录 Polymarket.com
2. 点击右上角头像
3. 在下拉菜单中查看钱包信息
4. 找到代理钱包地址

### Q: 签名类型应该选哪个？

**A**: 
- 如果你使用独立的钱包（MetaMask 等），选择 **0 (EOA)**
- 如果你通过 Polymarket.com 网站登录交易，选择 **1 (POLY_PROXY)** 或 **2 (GNOSIS_SAFE)**

### Q: 资金地址是什么？

**A**: 
- EOA (类型 0): 你的钱包地址（与 signer.address 相同）
- POLY_PROXY/GNOSIS_SAFE (类型 1/2): 你的代理钱包地址（从 Polymarket.com 获取）

### Q: 如何验证 API 凭证是否有效？

**A**: 尝试使用完整认证初始化客户端，如果成功则说明凭证有效。

## 重要提示

⚠️ **安全提示**:

1. **不要混淆用户凭证和 Builder 凭证**
   - 用户 API 凭证用于身份验证
   - Builder API 凭证用于订单归属（可选）

2. **保护私钥和 API 凭证**
   - 永远不要提交到 Git
   - 使用环境变量存储
   - 定期轮换密钥

3. **确保资金充足**
   - 资金地址中需要有足够的 USDCe
   - 确保有足够的 MATIC 用于 gas（EOA 类型）
   - 确保已设置代币授权

## 参考文档

- 官方快速开始: https://docs.polymarket.com/quickstart/first-order
- CLOB 客户端文档: https://docs.polymarket.com/clob-client
- 认证文档: https://docs.polymarket.com/clob-client/authentication
