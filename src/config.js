/**
 * 配置文件
 * 注意: 此文件在环境变量加载后导入
 */

// 确保环境变量已加载
if (!process.env.PRIVATE_KEY) {
  console.warn('⚠️  警告: PRIVATE_KEY 在 config.js 加载时未找到');
  console.warn('   这可能是正常的，如果 index.js 中已加载环境变量');
}

export const config = {
  // MCP 服务器配置
  mcpEndpoint: process.env.MCP_ENDPOINT || 'http://localhost:3000',
  
  // API 配置
  apiKey: process.env.POLYMARKET_API_KEY || '',
  apiSecret: process.env.POLYMARKET_API_SECRET || '',
  apiPassphrase: process.env.POLYMARKET_API_PASSPHRASE || '',
  privateKey: process.env.PRIVATE_KEY || '',
  host: process.env.POLYMARKET_HOST || 'https://clob.polymarket.com',
  chainId: parseInt(process.env.CHAIN_ID || '137'), // Polygon 主网
  
  // 交易配置
  maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '100'), // USDC
  minProfitMargin: parseFloat(process.env.MIN_PROFIT_MARGIN || '0.02'), // 2%
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '30000'), // 30秒
  
  // 风险管理配置
  maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '1000'), // USDC
  maxPositions: parseInt(process.env.MAX_POSITIONS || '10'),
  
  // 策略配置
  enableCopyTrading: process.env.ENABLE_COPY_TRADING !== 'false',
  minSignalStrength: parseFloat(process.env.MIN_SIGNAL_STRENGTH || '0.7'),
  minLargeTradeSize: parseFloat(process.env.MIN_LARGE_TRADE_SIZE || '1000'),
  
  // 聪明钱地址列表（用于跟单策略）
  smartMoneyAddresses: process.env.SMART_MONEY_ADDRESSES 
    ? process.env.SMART_MONEY_ADDRESSES.split(',')
    : [],
  
  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true'
};
