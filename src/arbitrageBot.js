import { PolyMarketClient } from './polyMarketClient.js';
import { ArbitrageStrategy } from './strategies/arbitrageStrategy.js';
import { CopyTradingStrategy } from './strategies/copyTradingStrategy.js';
import { RiskManager } from './riskManager.js';

/**
 * 跟单套利机器人主类
 */
export class ArbitrageBot {
  constructor(config) {
    this.config = config;
    this.client = new PolyMarketClient(config);
    this.arbitrageStrategy = new ArbitrageStrategy(config);
    this.copyTradingStrategy = new CopyTradingStrategy(config);
    this.riskManager = new RiskManager(config);
    this.isRunning = false;
    this.timer = null;
    this.stats = {
      totalOpportunities: 0,
      executedTrades: 0,
      totalProfit: 0,
      startTime: null
    };
  }

  /**
   * 初始化机器人
   */
  async initialize() {
    console.log('🔧 初始化机器人...');
    
    try {
      await this.client.connect();
      console.log('✅ 已连接到 Polymarket');
      
      // 初始化策略
      await this.arbitrageStrategy.initialize(this.client);
      await this.copyTradingStrategy.initialize(this.client);
      
      console.log('✅ 策略初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 启动监控和交易循环
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️  机器人已在运行中');
      return;
    }

    this.isRunning = true;
    this.stats.startTime = Date.now();
    console.log('🎯 开始监控市场...');

    // 立即执行一次检查
    await this.runCycle();

    // 设置定时检查
    this.timer = setInterval(async () => {
      await this.runCycle();
    }, this.config.checkInterval);
  }

  /**
   * 执行一个监控周期
   */
  async runCycle() {
    try {
      console.log(`\n📈 [${new Date().toLocaleTimeString()}] 开始市场扫描...`);
      
      // 1. 获取市场数据
      const markets = await this.client.getActiveMarkets();
      
      // 确保 markets 是数组
      if (!Array.isArray(markets)) {
        console.warn('⚠️  获取的市场数据不是数组，跳过本次循环');
        return;
      }
      
      console.log(`📊 发现 ${markets.length} 个活跃市场`);
      
      if (markets.length === 0) {
        console.log('📊 当前没有活跃市场，等待下次扫描...');
        return;
      }

      // 2. 执行套利策略
      const arbitrageOpportunities = await this.arbitrageStrategy.findOpportunities(markets);
      this.stats.totalOpportunities += arbitrageOpportunities.length;
      
      if (arbitrageOpportunities.length > 0) {
        console.log(`💎 发现 ${arbitrageOpportunities.length} 个套利机会`);
        
        for (const opportunity of arbitrageOpportunities) {
          if (await this.riskManager.shouldExecute(opportunity)) {
            await this.executeTrade(opportunity);
          } else {
            console.log('⚠️  交易被风险管理器拒绝');
          }
        }
      }

      // 3. 执行跟单策略
      if (this.config.enableCopyTrading) {
        const copySignals = await this.copyTradingStrategy.getSignals(markets);
        
        if (copySignals.length > 0) {
          console.log(`👥 发现 ${copySignals.length} 个跟单信号`);
          
          for (const signal of copySignals) {
            if (await this.riskManager.shouldExecute(signal)) {
              await this.executeTrade(signal);
            }
          }
        }
      }

      // 打印统计信息
      this.printStats();
      
    } catch (error) {
      console.error('❌ 执行周期时出错:', error.message);
    }
  }

  /**
   * 执行交易
   */
  async executeTrade(opportunity) {
    try {
      console.log(`\n💰 执行交易: ${opportunity.marketId}`);
      console.log(`   类型: ${opportunity.type}`);
      console.log(`   预期利润: ${(opportunity.expectedProfit * 100).toFixed(2)}%`);
      
      const result = await this.client.executeTrade(opportunity);
      
      if (result.success) {
        this.stats.executedTrades++;
        this.stats.totalProfit += result.profit || 0;
        console.log(`✅ 交易成功执行`);
        
        // 记录交易
        await this.riskManager.recordTrade(result);
      } else {
        console.log(`❌ 交易失败: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ 执行交易时出错:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const runtime = this.stats.startTime 
      ? Math.floor((Date.now() - this.stats.startTime) / 1000)
      : 0;
    
    console.log('\n📊 统计信息:');
    console.log(`   运行时间: ${Math.floor(runtime / 60)}分${runtime % 60}秒`);
    console.log(`   发现机会: ${this.stats.totalOpportunities}`);
    console.log(`   执行交易: ${this.stats.executedTrades}`);
    console.log(`   总利润: ${this.stats.totalProfit.toFixed(2)} USDC`);
    console.log(`   成功率: ${this.stats.totalOpportunities > 0 
      ? ((this.stats.executedTrades / this.stats.totalOpportunities) * 100).toFixed(2) 
      : 0}%`);
  }

  /**
   * 停止机器人
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 正在停止机器人...');
    this.isRunning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.client.disconnect();
    this.printStats();
    console.log('✅ 机器人已停止');
  }
}
