import { ClobClient } from '@polymarket/clob-client';
import { Wallet } from 'ethers';

/**
 * Polymarket 客户端封装
 * 用于与 Polymarket API 交互
 * 参考: https://docs.polymarket.com/quickstart/first-order
 */
export class PolyMarketClient {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.client = null;
    this.signer = null;
  }

  /**
   * 连接到 Polymarket
   */
  async connect() {
    try {
      // 直接从环境变量读取（确保使用最新值）
      const privateKey = process.env.PRIVATE_KEY || this.config.privateKey;
      
      if (!privateKey || privateKey.trim() === '') {
        throw new Error('未设置 PRIVATE_KEY，请在 .env 文件中配置');
      }

      console.log('🔌 连接到 Polymarket...');

      // Polymarket 配置
      const HOST = process.env.POLYMARKET_HOST || this.config.host || 'https://clob.polymarket.com';
      const CHAIN_ID = parseInt(process.env.CHAIN_ID || this.config.chainId || '137'); // Polygon 主网

      // 创建签名者
      this.signer = new Wallet(privateKey);
      console.log(`   钱包地址: ${this.signer.address}`);

      // 检查是否有 API 凭证（优先使用环境变量）
      const apiKey = process.env.POLYMARKET_API_KEY || this.config.apiKey;
      const apiSecret = process.env.POLYMARKET_API_SECRET || this.config.apiSecret;
      const apiPassphrase = process.env.POLYMARKET_API_PASSPHRASE || this.config.apiPassphrase;
      
      if (apiKey && apiSecret && apiPassphrase) {
        const userApiCreds = {
          apiKey: apiKey,
          secret: apiSecret,
          passphrase: apiPassphrase
        };

        const SIGNATURE_TYPE = parseInt(process.env.SIGNATURE_TYPE || '0');
        const FUNDER_ADDRESS = process.env.FUNDER_ADDRESS || this.signer.address;

        // 使用完整凭证初始化客户端
        this.client = new ClobClient(
          HOST,
          CHAIN_ID,
          this.signer,
          userApiCreds,
          SIGNATURE_TYPE,
          FUNDER_ADDRESS
        );
        console.log('✅ 使用 API 凭证连接');
      } else {
        // 仅使用签名者初始化（需要先调用 createOrDeriveApiKey）
        this.client = new ClobClient(HOST, CHAIN_ID, this.signer);
        console.log('⚠️  未设置 API 凭证，某些功能可能受限');
        console.log('   运行: node src/generateApiKey.js 生成 API 凭证');
      }

      this.connected = true;
      return true;
    } catch (error) {
      console.error('连接失败:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    this.connected = false;
    console.log('🔌 已断开连接');
  }

  /**
   * 获取活跃市场列表
   */
  async getActiveMarkets(limit = 100) {
    if (!this.connected) {
      throw new Error('客户端未连接');
    }

    try {
      // 使用 Polymarket API 获取市场
      let markets = await this.client.getMarkets({ limit });
      
      // 处理不同的返回格式
      if (!markets) {
        console.warn('⚠️  getMarkets 返回 null/undefined');
        return [];
      }
      
      // 如果返回的是对象，尝试提取数组
      if (typeof markets === 'object' && !Array.isArray(markets)) {
        // 可能是 { markets: [...] } 或 { data: [...] } 格式
        if (markets.markets && Array.isArray(markets.markets)) {
          markets = markets.markets;
        } else if (markets.data && Array.isArray(markets.data)) {
          markets = markets.data;
        } else if (markets.results && Array.isArray(markets.results)) {
          markets = markets.results;
        } else {
          console.warn('⚠️  getMarkets 返回的对象格式未知:', Object.keys(markets));
          return [];
        }
      }
      
      // 确保返回的是数组
      if (!Array.isArray(markets)) {
        console.warn('⚠️  getMarkets 返回的不是数组，类型:', typeof markets);
        return [];
      }
      
      return markets;
    } catch (error) {
      console.error('获取市场数据失败:', error);
      // 返回空数组而不是抛出错误，让程序继续运行
      console.warn('⚠️  返回空市场列表，程序将继续运行');
      return [];
    }
  }

  /**
   * 获取市场详情
   */
  async getMarketDetails(marketId) {
    try {
      // TODO: 实现市场详情获取
      // const market = await this.client.callTool('get_market', { marketId });
      return null;
    } catch (error) {
      console.error('获取市场详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取市场价格
   */
  async getMarketPrices(marketId) {
    try {
      // TODO: 实现价格获取
      // 应该返回 Yes 和 No 的价格
      return {
        yes: 0.5,
        no: 0.5,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('获取价格失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单簿
   */
  async getOrderBook(marketId, outcome) {
    try {
      // TODO: 实现订单簿获取
      return {
        bids: [],
        asks: [],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('获取订单簿失败:', error);
      throw error;
    }
  }

  /**
   * 执行交易
   */
  async executeTrade(trade) {
    if (!this.connected || !this.client) {
      throw new Error('客户端未连接');
    }

    try {
      console.log(`📝 执行交易: ${JSON.stringify(trade, null, 2)}`);

      // 使用 Polymarket API 下单
      const order = await this.client.placeOrder({
        marketId: trade.marketId,
        outcomeId: trade.outcomeId || trade.outcome,
        size: trade.size || trade.amount,
        price: trade.price,
        side: trade.side || 'buy',
        orderType: trade.orderType || 'limit'
      });

      console.log(`✅ 订单已提交: ${order.id || order.orderId}`);

      return {
        success: true,
        orderId: order.id || order.orderId,
        order: order,
        profit: trade.expectedProfit || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('执行交易失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取账户余额
   */
  async getBalance() {
    if (!this.connected || !this.client) {
      throw new Error('客户端未连接');
    }

    try {
      const balance = await this.client.getBalance();
      return {
        available: parseFloat(balance.available || 0),
        locked: parseFloat(balance.locked || 0),
        currency: 'USDC'
      };
    } catch (error) {
      console.error('获取余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史交易
   */
  async getTradeHistory(limit = 50) {
    if (!this.connected || !this.client) {
      throw new Error('客户端未连接');
    }

    try {
      const orders = await this.client.getOrders({ limit });
      return orders || [];
    } catch (error) {
      console.error('获取交易历史失败:', error);
      throw error;
    }
  }
}
