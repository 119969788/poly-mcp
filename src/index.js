import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { ArbitrageBot } from './arbitrageBot.js';
import { config } from './config.js';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量（从项目根目录加载 .env 文件）
const envPath = join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

// 检查 .env 文件是否存在
if (result.error && !existsSync(envPath)) {
  console.error('❌ 错误: .env 文件不存在！');
  console.error(`   期望路径: ${envPath}`);
  console.error('\n请执行以下步骤:');
  console.error('   1. 复制模板: cp .env.example .env');
  console.error('   2. 编辑配置: nano .env');
  console.error('   3. 至少设置: PRIVATE_KEY=0x你的私钥');
  process.exit(1);
}

// 验证必要的环境变量
if (!process.env.PRIVATE_KEY) {
  console.error('❌ 错误: 未设置 PRIVATE_KEY！');
  console.error('\n请检查:');
  console.error(`   1. .env 文件是否存在: ${envPath}`);
  console.error('   2. .env 文件中是否设置了 PRIVATE_KEY');
  console.error('   3. PRIVATE_KEY 格式是否正确（0x 开头）');
  console.error('\n修复步骤:');
  console.error('   1. 编辑 .env 文件: nano .env');
  console.error('   2. 添加: PRIVATE_KEY=0x你的私钥');
  console.error('   3. 保存并重新启动程序');
  process.exit(1);
}

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
