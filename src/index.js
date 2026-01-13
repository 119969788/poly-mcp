import dotenv from 'dotenv';
import { ArbitrageBot } from './arbitrageBot.js';
import { config } from './config.js';

// 加载环境变量
dotenv.config();

/**
 * Polymarket 跟单套利程序主入口
 */
class ArbitrageApp {
  constructor() {
    this.bot = new ArbitrageBot(config);
  }

  /**
   * 启动程序
   */
  async start() {
    try {
      console.log('🚀 启动 Polymarket 跟单套利程序...');
      console.log(`📊 监控间隔: ${config.checkInterval / 1000}秒`);
      console.log(`💰 最大单笔金额: ${config.maxPositionSize} USDC`);
      console.log(`🎯 最小套利利润率: ${config.minProfitMargin * 100}%`);
      
      await this.bot.initialize();
      await this.bot.start();
      
      // 优雅关闭
      process.on('SIGINT', async () => {
        console.log('\n⏹️  正在停止程序...');
        await this.bot.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n⏹️  正在停止程序...');
        await this.bot.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ 启动失败:', error);
      process.exit(1);
    }
  }
}

// 启动应用
const app = new ArbitrageApp();
app.start().catch(console.error);
