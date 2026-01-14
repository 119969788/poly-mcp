import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log('='.repeat(60));
console.log('配置检查工具');
console.log('='.repeat(60));
console.log('');

// 检查 .env 文件是否存在
console.log('📋 步骤 1: 检查 .env 文件');
if (!existsSync(envPath)) {
  console.error('❌ .env 文件不存在！');
  console.error(`   路径: ${envPath}`);
  console.error('\n请执行:');
  console.error('   cp .env.example .env');
  console.error('   nano .env');
  process.exit(1);
} else {
  console.log(`✅ .env 文件存在: ${envPath}`);
}

// 加载环境变量
console.log('\n📋 步骤 2: 加载环境变量');
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ 加载 .env 文件失败:', result.error.message);
  process.exit(1);
} else {
  console.log('✅ 环境变量加载成功');
}

// 检查必要的配置
console.log('\n📋 步骤 3: 检查配置项');
const required = [
  'PRIVATE_KEY',
];

const optional = [
  'POLYMARKET_API_KEY',
  'POLYMARKET_API_SECRET',
  'POLYMARKET_API_PASSPHRASE',
  'POLYMARKET_HOST',
  'CHAIN_ID',
  'SIGNATURE_TYPE',
  'FUNDER_ADDRESS',
  'MAX_POSITION_SIZE',
  'MIN_PROFIT_MARGIN',
  'CHECK_INTERVAL',
];

let hasErrors = false;

// 检查必需项
console.log('\n必需配置:');
for (const key of required) {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.error(`   ❌ ${key}: 未设置`);
    hasErrors = true;
  } else {
    // 隐藏敏感信息
    if (key === 'PRIVATE_KEY') {
      const masked = value.length > 10 
        ? `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
        : '***';
      console.log(`   ✅ ${key}: ${masked}`);
      
      // 验证格式
      if (!value.startsWith('0x')) {
        console.error(`      ⚠️  警告: 私钥应该以 0x 开头`);
        hasErrors = true;
      }
      if (value.length !== 66) {
        console.error(`      ⚠️  警告: 私钥长度应该是 66 个字符（包括 0x）`);
        hasErrors = true;
      }
    } else {
      console.log(`   ✅ ${key}: 已设置`);
    }
  }
}

// 检查可选项
console.log('\n可选配置:');
for (const key of optional) {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.log(`   ⚠️  ${key}: 未设置（使用默认值）`);
  } else {
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSPHRASE')) {
      console.log(`   ✅ ${key}: 已设置（已隐藏）`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  }
}

// 显示配置摘要
console.log('\n📋 配置摘要:');
console.log(`   工作目录: ${process.cwd()}`);
console.log(`   .env 路径: ${envPath}`);
console.log(`   Node.js 版本: ${process.version}`);

// 检查 API 凭证
const hasApiKey = process.env.POLYMARKET_API_KEY && process.env.POLYMARKET_API_KEY.trim() !== '';
const hasApiSecret = process.env.POLYMARKET_API_SECRET && process.env.POLYMARKET_API_SECRET.trim() !== '';
const hasApiPassphrase = process.env.POLYMARKET_API_PASSPHRASE && process.env.POLYMARKET_API_PASSPHRASE.trim() !== '';

if (hasApiKey && hasApiSecret && hasApiPassphrase) {
  console.log('   API 凭证: ✅ 已配置');
} else {
  console.log('   API 凭证: ⚠️  未完整配置');
  console.log('      运行 npm run generate-api 生成 API 凭证');
}

// 最终结果
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ 配置检查失败！请修复上述错误后重试。');
  process.exit(1);
} else {
  console.log('✅ 配置检查通过！可以启动程序了。');
  console.log('   运行: npm start');
  console.log('   或: pm2 start src/index.js --name poly-mcp-arbitrage');
}
console.log('='.repeat(60));
