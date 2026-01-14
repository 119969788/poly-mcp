/**
 * 配置文件
 * 注意: 此文件在环境变量加载后导入
 * 配置会优先使用环境变量，如果环境变量未设置则使用默认值
 */

// 创建一个函数来获取配置，确保每次读取时都使用最新的环境变量
function getConfig() {
  return {
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
}

// 导出配置对象（使用 getter 确保每次访问时读取最新环境变量）
export const config = new Proxy({}, {
  get(target, prop) {
    const configObj = getConfig();
    return configObj[prop];
  },
  ownKeys(target) {
    return Object.keys(getConfig());
  },
  has(target, prop) {
    return prop in getConfig();
  }
});
