/**
 * Polymarket MCP 服务器
 * 实现 Model Context Protocol (MCP) 服务器，提供完整的 Polymarket 交易功能
 * 
 * 功能包括：
 * - 工具（Tools）: 市场查询、交易执行、跟单、套利等
 * - 资源（Resources）: 市场数据、交易历史、统计信息等
 * - 提示（Prompts）: 交易策略模板、分析模板等
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// 导入项目模块
import { PolyMarketClient } from './polyMarketClient.js';
import { ArbitrageBot } from './arbitrageBot.js';
import { ArbitrageStrategy } from './strategies/arbitrageStrategy.js';
import { CopyTradingStrategy } from './strategies/copyTradingStrategy.js';
import { SmartMoneyStrategy } from './strategies/smartMoneyStrategy.js';
import { SmartMoneyStrategyEnhanced } from './strategies/smartMoneyStrategyEnhanced.js';
import { RiskManager } from './riskManager.js';
import { config } from './config.js';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

/**
 * Polymarket MCP 服务器类
 */
class PolyMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'poly-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // 初始化客户端和策略
    this.client = null;
    this.bot = null;
    this.arbitrageStrategy = null;
    this.copyTradingStrategy = null;
    this.smartMoneyStrategy = null;
    this.riskManager = null;

    // 状态管理
    this.isInitialized = false;
    this.stats = {
      totalToolCalls: 0,
      totalResourceReads: 0,
      totalPrompts: 0,
      startTime: Date.now(),
    };

    this.setupHandlers();
  }

  /**
   * 设置 MCP 处理器
   */
  setupHandlers() {
    // 工具列表
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_markets',
          description: '获取活跃市场列表，支持过滤和排序',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: '返回的市场数量限制（默认 100）',
                default: 100,
              },
              filter: {
                type: 'string',
                description: '过滤条件（active, closed, resolved）',
                enum: ['active', 'closed', 'resolved', 'all'],
                default: 'active',
              },
            },
          },
        },
        {
          name: 'get_market_details',
          description: '获取指定市场的详细信息，包括价格、订单簿、交易历史等',
          inputSchema: {
            type: 'object',
            properties: {
              marketId: {
                type: 'string',
                description: '市场 ID 或条件 ID',
                required: true,
              },
            },
            required: ['marketId'],
          },
        },
        {
          name: 'get_market_prices',
          description: '获取市场的 Yes/No 价格',
          inputSchema: {
            type: 'object',
            properties: {
              marketId: {
                type: 'string',
                description: '市场 ID',
                required: true,
              },
            },
            required: ['marketId'],
          },
        },
        {
          name: 'get_order_book',
          description: '获取市场的订单簿数据',
          inputSchema: {
            type: 'object',
            properties: {
              marketId: {
                type: 'string',
                description: '市场 ID',
                required: true,
              },
              outcome: {
                type: 'string',
                description: '结果类型（Yes 或 No）',
                enum: ['Yes', 'No'],
              },
            },
            required: ['marketId'],
          },
        },
        {
          name: 'execute_trade',
          description: '执行交易（买入或卖出）',
          inputSchema: {
            type: 'object',
            properties: {
              marketId: {
                type: 'string',
                description: '市场 ID',
                required: true,
              },
              side: {
                type: 'string',
                description: '交易方向（buy 或 sell）',
                enum: ['buy', 'sell', 'Yes', 'No'],
                required: true,
              },
              size: {
                type: 'number',
                description: '交易数量（USDC）',
                required: true,
              },
              price: {
                type: 'number',
                description: '限价（可选，不提供则使用市价）',
              },
              orderType: {
                type: 'string',
                description: '订单类型（FOK, IOC, GTC）',
                enum: ['FOK', 'IOC', 'GTC'],
                default: 'FOK',
              },
            },
            required: ['marketId', 'side', 'size'],
          },
        },
        {
          name: 'get_balance',
          description: '获取账户余额',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'find_arbitrage_opportunities',
          description: '查找套利机会',
          inputSchema: {
            type: 'object',
            properties: {
              minProfitMargin: {
                type: 'number',
                description: '最小利润率（默认 0.02，即 2%）',
                default: 0.02,
              },
              maxPositionSize: {
                type: 'number',
                description: '最大单笔金额（USDC）',
                default: 100,
              },
            },
          },
        },
        {
          name: 'get_smart_money_signals',
          description: '获取聪明钱跟单信号',
          inputSchema: {
            type: 'object',
            properties: {
              addresses: {
                type: 'array',
                items: { type: 'string' },
                description: '聪明钱地址列表（可选，不提供则使用配置中的地址）',
              },
              limit: {
                type: 'number',
                description: '每个地址获取的交易数量限制',
                default: 50,
              },
            },
          },
        },
        {
          name: 'get_copy_trading_signals',
          description: '获取跟单交易信号（大额交易跟随）',
          inputSchema: {
            type: 'object',
            properties: {
              minTradeSize: {
                type: 'number',
                description: '最小交易规模（USDC）',
                default: 1000,
              },
              minSignalStrength: {
                type: 'number',
                description: '最小信号强度（0-1）',
                default: 0.7,
              },
            },
          },
        },
        {
          name: 'get_trade_history',
          description: '获取交易历史记录',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: '返回的记录数量限制',
                default: 50,
              },
              address: {
                type: 'string',
                description: '特定地址的交易历史（可选）',
              },
            },
          },
        },
        {
          name: 'get_statistics',
          description: '获取交易统计信息',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'start_bot',
          description: '启动自动交易机器人',
          inputSchema: {
            type: 'object',
            properties: {
              checkInterval: {
                type: 'number',
                description: '检查间隔（毫秒，默认 30000）',
                default: 30000,
              },
            },
          },
        },
        {
          name: 'stop_bot',
          description: '停止自动交易机器人',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_bot_status',
          description: '获取机器人运行状态',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // 工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.stats.totalToolCalls++;
      const { name, arguments: args } = request.params;

      try {
        await this.ensureInitialized();

        switch (name) {
          case 'get_markets':
            return await this.handleGetMarkets(args);
          case 'get_market_details':
            return await this.handleGetMarketDetails(args);
          case 'get_market_prices':
            return await this.handleGetMarketPrices(args);
          case 'get_order_book':
            return await this.handleGetOrderBook(args);
          case 'execute_trade':
            return await this.handleExecuteTrade(args);
          case 'get_balance':
            return await this.handleGetBalance();
          case 'find_arbitrage_opportunities':
            return await this.handleFindArbitrageOpportunities(args);
          case 'get_smart_money_signals':
            return await this.handleGetSmartMoneySignals(args);
          case 'get_copy_trading_signals':
            return await this.handleGetCopyTradingSignals(args);
          case 'get_trade_history':
            return await this.handleGetTradeHistory(args);
          case 'get_statistics':
            return await this.handleGetStatistics();
          case 'start_bot':
            return await this.handleStartBot(args);
          case 'stop_bot':
            return await this.handleStopBot();
          case 'get_bot_status':
            return await this.handleGetBotStatus();
          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 资源列表
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'poly://markets',
          name: '活跃市场列表',
          description: '获取所有活跃市场的列表',
          mimeType: 'application/json',
        },
        {
          uri: 'poly://market/{marketId}',
          name: '市场详情',
          description: '获取指定市场的详细信息',
          mimeType: 'application/json',
        },
        {
          uri: 'poly://balance',
          name: '账户余额',
          description: '获取当前账户的 USDC 余额',
          mimeType: 'application/json',
        },
        {
          uri: 'poly://statistics',
          name: '交易统计',
          description: '获取交易统计信息',
          mimeType: 'application/json',
        },
        {
          uri: 'poly://config',
          name: '配置信息',
          description: '获取当前配置信息',
          mimeType: 'application/json',
        },
      ],
    }));

    // 读取资源
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      this.stats.totalResourceReads++;
      const { uri } = request.params;

      try {
        await this.ensureInitialized();

        if (uri === 'poly://markets') {
          const markets = await this.client.getActiveMarkets(100);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(markets, null, 2),
              },
            ],
          };
        } else if (uri.startsWith('poly://market/')) {
          const marketId = uri.replace('poly://market/', '');
          const details = await this.getMarketDetails(marketId);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(details, null, 2),
              },
            ],
          };
        } else if (uri === 'poly://balance') {
          const balance = await this.client.getBalance();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(balance, null, 2),
              },
            ],
          };
        } else if (uri === 'poly://statistics') {
          const stats = await this.getStatistics();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        } else if (uri === 'poly://config') {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(config, null, 2),
              },
            ],
          };
        } else {
          throw new Error(`未知资源: ${uri}`);
        }
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: `错误: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // 提示列表
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'analyze_market',
          description: '分析市场并给出交易建议',
          arguments: [
            {
              name: 'marketId',
              description: '市场 ID',
              required: true,
            },
          ],
        },
        {
          name: 'find_arbitrage',
          description: '查找套利机会的提示模板',
          arguments: [],
        },
        {
          name: 'smart_money_analysis',
          description: '分析聪明钱交易的提示模板',
          arguments: [
            {
              name: 'address',
              description: '聪明钱地址（可选）',
              required: false,
            },
          ],
        },
        {
          name: 'risk_assessment',
          description: '风险评估提示模板',
          arguments: [],
        },
      ],
    }));

    // 获取提示
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      this.stats.totalPrompts++;
      const { name, arguments: args } = request.params;

      try {
        await this.ensureInitialized();

        switch (name) {
          case 'analyze_market':
            return await this.getAnalyzeMarketPrompt(args);
          case 'find_arbitrage':
            return await this.getFindArbitragePrompt();
          case 'smart_money_analysis':
            return await this.getSmartMoneyAnalysisPrompt(args);
          case 'risk_assessment':
            return await this.getRiskAssessmentPrompt();
          default:
            throw new Error(`未知提示: ${name}`);
        }
      } catch (error) {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `错误: ${error.message}`,
              },
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 确保已初始化
   */
  async ensureInitialized() {
    if (this.isInitialized) {
      return;
    }

    console.error('🔧 初始化 MCP 服务器...');
    this.client = new PolyMarketClient(config);
    await this.client.connect();

    this.arbitrageStrategy = new ArbitrageStrategy(config);
    this.copyTradingStrategy = new CopyTradingStrategy(config);
    
    if (config.useSDKSmartMoney) {
      const { SmartMoneySDKStrategy } = await import('./strategies/smartMoneySDKStrategy.js');
      this.smartMoneyStrategy = new SmartMoneySDKStrategy(config);
    } else if (config.useEnhancedSmartMoney) {
      this.smartMoneyStrategy = new SmartMoneyStrategyEnhanced(config);
    } else if (config.enableSmartMoney) {
      this.smartMoneyStrategy = new SmartMoneyStrategy(config);
    }

    this.riskManager = new RiskManager(config);
    this.bot = new ArbitrageBot(config);

    await this.arbitrageStrategy.initialize(this.client);
    await this.copyTradingStrategy.initialize(this.client);
    if (this.smartMoneyStrategy) {
      await this.smartMoneyStrategy.initialize(this.client);
    }

    this.isInitialized = true;
    console.error('✅ MCP 服务器初始化完成');
  }

  // ==================== 工具处理器 ====================

  async handleGetMarkets(args) {
    const limit = args?.limit || 100;
    const markets = await this.client.getActiveMarkets(limit);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(markets, null, 2),
        },
      ],
    };
  }

  async handleGetMarketDetails(args) {
    const { marketId } = args;
    const details = await this.getMarketDetails(marketId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(details, null, 2),
        },
      ],
    };
  }

  async handleGetMarketPrices(args) {
    const { marketId } = args;
    const prices = await this.client.getMarketPrices(marketId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(prices, null, 2),
        },
      ],
    };
  }

  async handleGetOrderBook(args) {
    const { marketId, outcome } = args;
    const orderBook = await this.client.getOrderBook(marketId, outcome);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(orderBook, null, 2),
        },
      ],
    };
  }

  async handleExecuteTrade(args) {
    const { marketId, side, size, price, orderType } = args;
    const result = await this.client.executeTrade({
      marketId,
      side,
      size,
      price,
      orderType: orderType || 'FOK',
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleGetBalance() {
    const balance = await this.client.getBalance();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(balance, null, 2),
        },
      ],
    };
  }

  async handleFindArbitrageOpportunities(args) {
    const markets = await this.client.getActiveMarkets(100);
    const opportunities = await this.arbitrageStrategy.findOpportunities(markets);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(opportunities, null, 2),
        },
      ],
    };
  }

  async handleGetSmartMoneySignals(args) {
    const { addresses, limit } = args;
    const markets = await this.client.getActiveMarkets(100);
    
    if (this.smartMoneyStrategy) {
      // 如果提供了地址，临时设置
      if (addresses && addresses.length > 0) {
        const originalAddresses = this.smartMoneyStrategy.smartMoneyAddresses;
        this.smartMoneyStrategy.smartMoneyAddresses = addresses;
        const signals = await this.smartMoneyStrategy.getSignals(markets);
        this.smartMoneyStrategy.smartMoneyAddresses = originalAddresses;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(signals, null, 2),
            },
          ],
        };
      } else {
        const signals = await this.smartMoneyStrategy.getSignals(markets);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(signals, null, 2),
            },
          ],
        };
      }
    } else {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: '聪明钱策略未启用' }, null, 2),
          },
        ],
      };
    }
  }

  async handleGetCopyTradingSignals(args) {
    const markets = await this.client.getActiveMarkets(100);
    const signals = await this.copyTradingStrategy.getSignals(markets);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(signals, null, 2),
        },
      ],
    };
  }

  async handleGetTradeHistory(args) {
    const { limit, address } = args;
    if (address) {
      const trades = await this.client.getTradesByAddress(address, limit || 50);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(trades, null, 2),
          },
        ],
      };
    } else {
      const history = await this.client.getTradeHistory(limit || 50);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(history, null, 2),
          },
        ],
      };
    }
  }

  async handleGetStatistics() {
    const stats = await this.getStatistics();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  async handleStartBot(args) {
    if (this.bot.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'already_running' }, null, 2),
          },
        ],
      };
    }

    await this.bot.start();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ status: 'started' }, null, 2),
        },
      ],
    };
  }

  async handleStopBot() {
    if (!this.bot.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'not_running' }, null, 2),
          },
        ],
      };
    }

    await this.bot.stop();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ status: 'stopped' }, null, 2),
        },
      ],
    };
  }

  async handleGetBotStatus() {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            isRunning: this.bot?.isRunning || false,
            stats: this.bot?.stats || {},
          }, null, 2),
        },
      ],
    };
  }

  // ==================== 辅助方法 ====================

  async getMarketDetails(marketId) {
    const market = await this.client.getMarketDetails(marketId);
    const prices = await this.client.getMarketPrices(marketId);
    const orderBook = await this.client.getOrderBook(marketId);
    
    return {
      market,
      prices,
      orderBook,
      timestamp: Date.now(),
    };
  }

  async getStatistics() {
    return {
      bot: this.bot?.stats || {},
      mcp: this.stats,
      config: {
        maxPositionSize: config.maxPositionSize,
        minProfitMargin: config.minProfitMargin,
        maxDailyLoss: config.maxDailyLoss,
        enableCopyTrading: config.enableCopyTrading,
        enableSmartMoney: config.enableSmartMoney,
      },
      timestamp: Date.now(),
    };
  }

  // ==================== 提示生成器 ====================

  async getAnalyzeMarketPrompt(args) {
    const { marketId } = args;
    const details = await this.getMarketDetails(marketId);
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请分析以下 Polymarket 市场并给出交易建议：

市场 ID: ${marketId}
市场信息: ${JSON.stringify(details.market, null, 2)}
当前价格: Yes=${details.prices.yes}, No=${details.prices.no}
订单簿: ${JSON.stringify(details.orderBook, null, 2)}

请分析：
1. 市场趋势和价格走势
2. 订单簿深度和流动性
3. 潜在的交易机会
4. 风险因素
5. 具体的交易建议（买入/卖出/观望）`,
          },
        },
      ],
    };
  }

  async getFindArbitragePrompt() {
    const opportunities = await this.arbitrageStrategy.findOpportunities(
      await this.client.getActiveMarkets(100)
    );
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请分析以下套利机会：

发现的套利机会: ${JSON.stringify(opportunities, null, 2)}

请评估：
1. 每个机会的可行性
2. 预期收益率
3. 执行风险
4. 最佳执行策略
5. 优先级排序`,
          },
        },
      ],
    };
  }

  async getSmartMoneyAnalysisPrompt(args) {
    const { address } = args;
    const addresses = address ? [address] : config.smartMoneyAddresses;
    const markets = await this.client.getActiveMarkets(100);
    
    let signals = [];
    if (this.smartMoneyStrategy) {
      const originalAddresses = this.smartMoneyStrategy.smartMoneyAddresses;
      this.smartMoneyStrategy.smartMoneyAddresses = addresses;
      signals = await this.smartMoneyStrategy.getSignals(markets);
      this.smartMoneyStrategy.smartMoneyAddresses = originalAddresses;
    }
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请分析以下聪明钱交易信号：

监控地址: ${addresses.join(', ')}
发现的信号: ${JSON.stringify(signals, null, 2)}

请分析：
1. 每个信号的可信度
2. 交易者的历史表现
3. 市场时机
4. 跟单建议
5. 风险控制措施`,
          },
        },
      ],
    };
  }

  async getRiskAssessmentPrompt() {
    const stats = await this.getStatistics();
    const balance = await this.client.getBalance();
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `请评估当前交易风险：

账户余额: ${JSON.stringify(balance, null, 2)}
交易统计: ${JSON.stringify(stats.bot, null, 2)}
配置参数: ${JSON.stringify(stats.config, null, 2)}

请评估：
1. 当前风险水平
2. 资金使用率
3. 潜在损失风险
4. 风险控制建议
5. 是否需要调整策略`,
          },
        },
      ],
    };
  }

  /**
   * 启动服务器
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Polymarket MCP 服务器已启动');
  }
}

// 启动服务器
const server = new PolyMCPServer();
server.start().catch(console.error);
