import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量（从项目根目录加载 .env 文件）
const envPath = join(__dirname, '..', '.env');

console.log('🔍 加载环境变量...');
console.log(`   .env 文件路径: ${envPath}`);

// 检查 .env 文件是否存在
if (!existsSync(envPath)) {
  console.error('❌ 错误: .env 文件不存在！');
  console.error(`   期望路径: ${envPath}`);
  console.error('\n请执行以下步骤:');
  console.error('   1. 复制模板: cp .env.example .env');
  console.error('   2. 编辑配置: nano .env');
  console.error('   3. 至少设置: PRIVATE_KEY=0x你的私钥');
  process.exit(1);
}

// 加载环境变量
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ 加载 .env 文件失败:', result.error.message);
  process.exit(1);
}

// 验证必要的环境变量
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
  console.error('❌ 错误: 未设置 PRIVATE_KEY！');
  console.error('\n请检查:');
  console.error(`   1. .env 文件是否存在: ${envPath}`);
  console.error('   2. .env 文件中是否设置了 PRIVATE_KEY');
  console.error('   3. PRIVATE_KEY 格式是否正确（0x 开头）');
  
  // 尝试读取文件内容（隐藏敏感信息）
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const hasPrivateKey = envContent.includes('PRIVATE_KEY=');
    console.error(`\n调试信息:`);
    console.error(`   .env 文件存在: ✅`);
    console.error(`   包含 PRIVATE_KEY: ${hasPrivateKey ? '✅' : '❌'}`);
    if (hasPrivateKey) {
      const lines = envContent.split('\n');
      const privateKeyLine = lines.find(line => line.trim().startsWith('PRIVATE_KEY='));
      if (privateKeyLine) {
        const value = privateKeyLine.split('=')[1]?.trim();
        if (!value || value === '') {
          console.error(`   PRIVATE_KEY 值为空`);
        } else if (!value.startsWith('0x')) {
          console.error(`   PRIVATE_KEY 格式错误（应该以 0x 开头）`);
        } else {
          console.error(`   PRIVATE_KEY 格式看起来正确，但程序无法读取`);
          console.error(`   可能是文件编码或格式问题`);
        }
      }
    }
  } catch (err) {
    console.error(`   无法读取 .env 文件: ${err.message}`);
  }
  
  console.error('\n修复步骤:');
  console.error('   1. 编辑 .env 文件: nano .env');
  console.error('   2. 确保有这一行: PRIVATE_KEY=0x你的私钥（没有空格，没有引号）');
  console.error('   3. 保存并重新启动程序');
  process.exit(1);
}

console.log(`✅ 环境变量加载成功`);
console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY.substring(0, 10)}...`);

// 现在导入配置和模块（环境变量已加载）
import { ArbitrageBot } from './arbitrageBot.js';
import { config } from './config.js';

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
