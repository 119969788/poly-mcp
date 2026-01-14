import { PolyMarketClient } from './polyMarketClient.js';
import { ArbitrageStrategy } from './strategies/arbitrageStrategy.js';
import { CopyTradingStrategy } from './strategies/copyTradingStrategy.js';
import { SmartMoneyStrategy } from './strategies/smartMoneyStrategy.js';
import { SmartMoneyStrategyEnhanced } from './strategies/smartMoneyStrategyEnhanced.js';
import { SmartMoneySDKStrategy } from './strategies/smartMoneySDKStrategy.js';
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
    
    // 根据配置选择使用哪个版本的聪明钱策略
    if (config.useSDKSmartMoney) {
      this.smartMoneyStrategy = new SmartMoneySDKStrategy(config);
      console.log('📦 使用 SDK 版聪明钱跟单策略（@catalyst-team/poly-sdk）');
    } else if (config.useEnhancedSmartMoney) {
      this.smartMoneyStrategy = new SmartMoneyStrategyEnhanced(config);
      console.log('📦 使用增强版聪明钱跟单策略（事件驱动）');
    } else {
      this.smartMoneyStrategy = new SmartMoneyStrategy(config);
      console.log('📦 使用标准版聪明钱跟单策略');
    }
    
    this.riskManager = new RiskManager(config);
    this.isRunning = false;
    this.timer = null;
    this.smartMoneyCheckCount = 0;
    this.stats = {
      totalOpportunities: 0,
      executedTrades: 0,
      totalProfit: 0,
      smartMoneySignals: 0,
      smartMoneyTrades: 0,
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
      
      // 初始化聪明钱策略（独立模块）
      if (this.config.enableSmartMoney) {
        await this.smartMoneyStrategy.initialize(this.client);
        
        // 如果是 SDK 版，启动自动跟单
        if (this.config.useSDKSmartMoney && typeof this.smartMoneyStrategy.start === 'function') {
          try {
            // 监听交易事件
            this.smartMoneyStrategy.on('trade', async (tradeData) => {
              this.handleSDKTrade(tradeData);
            });
            
            // 启动自动跟单
            await this.smartMoneyStrategy.start();
          } catch (error) {
            console.error('❌ SDK 版启动失败，建议切换到增强版');
            console.error('   在 .env 中设置: USE_ENHANCED_SMART_MONEY=true');
            console.error('   或设置: USE_SDK_SMART_MONEY=false');
            // 不抛出错误，让程序继续运行其他策略
          }
        }
        // 如果是增强版，设置事件监听并启动
        else if (this.config.useEnhancedSmartMoney && typeof this.smartMoneyStrategy.start === 'function') {
          // 监听新交易事件
          this.smartMoneyStrategy.on('newTrade', async (data) => {
            const { signal } = data;
            this.handleSmartMoneySignal(signal);
          });
          
          // 启动监听
          await this.smartMoneyStrategy.start();
        }
      }
      
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
            // 默认：跟单只产出信号，不自动下单（避免误操作）
            if (!this.config.enableCopyTradingExecution) {
              console.log(`📝 跟单信号（未执行，下单开关未开启）: ${signal.marketId || signal.tokenId || 'unknown'} ${signal.direction || signal.side || ''}`);
              continue;
            }

            if (await this.riskManager.shouldExecute(signal)) {
              await this.executeTrade(signal);
            }
          }
        }
      }

      // 4. 执行聪明钱跟单策略（独立模块）
      // 注意：增强版和SDK版使用事件驱动，不需要在这里轮询
      if (this.config.enableSmartMoney && 
          !this.config.useEnhancedSmartMoney && 
          !this.config.useSDKSmartMoney) {
        const smartMoneySignals = await this.smartMoneyStrategy.getSignals(markets);
        
        if (smartMoneySignals.length > 0) {
          console.log(`🧠 发现 ${smartMoneySignals.length} 个聪明钱跟单信号`);
          this.stats.smartMoneySignals += smartMoneySignals.length;
          
          for (const signal of smartMoneySignals) {
            await this.handleSmartMoneySignal(signal);
          }
        } else {
          // 即使没有信号，也显示状态（每10次循环显示一次）
          if (!this.smartMoneyCheckCount) this.smartMoneyCheckCount = 0;
          this.smartMoneyCheckCount++;
          if (this.smartMoneyCheckCount % 10 === 0) {
            console.log(`🧠 聪明钱跟单: 持续监控中... (已检查 ${this.smartMoneyCheckCount} 次)`);
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
    
    // 聪明钱策略统计
    if (this.config.enableSmartMoney) {
      const smartMoneyStats = this.smartMoneyStrategy.getStats();
      console.log(`\n🧠 聪明钱策略统计:`);
      console.log(`   监控地址: ${smartMoneyStats.monitoredAddresses}`);
      console.log(`   发现信号: ${this.stats.smartMoneySignals}`);
      console.log(`   执行交易: ${this.stats.smartMoneyTrades}`);
      console.log(`   已处理交易: ${smartMoneyStats.seenTrades}`);
    }
  }

  /**
   * 处理 SDK 交易事件
   */
  async handleSDKTrade(tradeData) {
    this.stats.smartMoneySignals++;
    
    if (tradeData.success) {
      this.stats.smartMoneyTrades++;
      this.stats.totalProfit += tradeData.profit || 0;
      console.log(`✅ SDK 跟单交易成功: ${tradeData.marketId || tradeData.tokenId}`);
    } else {
      console.log(`❌ SDK 跟单交易失败: ${tradeData.error || '未知错误'}`);
    }
  }

  /**
   * 处理聪明钱信号
   */
  async handleSmartMoneySignal(signal) {
    this.stats.smartMoneySignals++;
    
    // 聪明钱跟单是否允许真实下单
    if (!this.config.enableCopyTradingExecution) {
      console.log(`📝 聪明钱信号（未执行，下单开关未开启）: ${signal.marketId || signal.tokenId || 'unknown'} ${signal.direction || signal.side || ''} - ${signal.reason}`);
      return;
    }

    if (await this.riskManager.shouldExecute(signal)) {
      const result = await this.executeTrade(signal);
      if (result.success) {
        this.stats.smartMoneyTrades++;
        console.log(`✅ 聪明钱跟单交易执行成功: ${signal.marketId || signal.tokenId}`);
      } else {
        console.log(`❌ 聪明钱跟单交易失败: ${result.error}`);
      }
    } else {
      console.log(`⚠️  聪明钱交易被风险管理器拒绝: ${signal.reason}`);
    }
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

    // 停止聪明钱监听
    if (this.config.enableSmartMoney && typeof this.smartMoneyStrategy.stop === 'function') {
      await this.smartMoneyStrategy.stop();
    }

    await this.client.disconnect();
    this.printStats();
    console.log('✅ 机器人已停止');
  }
}
