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
  // 跟单是否允许真实下单（默认关闭，先只产出信号/日志）
  enableCopyTradingExecution: process.env.ENABLE_COPY_TRADING_EXECUTION === 'true',
  
  // 跟单策略分别开关
  // 策略1: 大额交易跟随
  enableCopyLargeTrades: process.env.ENABLE_COPY_LARGE_TRADES !== 'false',
  // 策略2: 聪明钱跟随（独立模块）
  enableSmartMoney: process.env.ENABLE_SMART_MONEY !== 'false',
  // 策略2增强版: 使用事件驱动的聪明钱跟单（参考 poly-mcp）
  useEnhancedSmartMoney: process.env.USE_ENHANCED_SMART_MONEY === 'true',
  // 策略2 SDK版: 使用 @catalyst-team/poly-sdk 的自动跟单 API（参考 poly-copy-trading）
  useSDKSmartMoney: process.env.USE_SDK_SMART_MONEY === 'true',
  // 聪明钱检查间隔（毫秒）
  smartMoneyCheckInterval: parseInt(process.env.SMART_MONEY_CHECK_INTERVAL || '10000'),
  // SDK 跟单参数
  copySizeScale: parseFloat(process.env.COPY_SIZE_SCALE || '0.1'),
  maxSlippage: parseFloat(process.env.MAX_SLIPPAGE || '0.03'),
  orderType: process.env.ORDER_TYPE || 'FOK',
  minTradeSize: parseFloat(process.env.MIN_TRADE_SIZE || '5'),
  dryRun: process.env.DRY_RUN !== 'false' && process.env.ENABLE_COPY_TRADING_EXECUTION !== 'true',
  // 策略3: 高胜率交易者跟随
  enableCopyHighWinRate: process.env.ENABLE_COPY_HIGH_WIN_RATE !== 'false',
  
  minSignalStrength: parseFloat(process.env.MIN_SIGNAL_STRENGTH || '0.7'),
  minLargeTradeSize: parseFloat(process.env.MIN_LARGE_TRADE_SIZE || '1000'),
  // 跟单：复制比例（0.1 表示跟随原单 10% 规模）
  copyTradeSizeMultiplier: parseFloat(process.env.COPY_TRADE_SIZE_MULTIPLIER || '0.1'),
  // 跟单：每个地址每次拉取多少条成交
  copyTradeFetchLimit: parseInt(process.env.COPY_TRADE_FETCH_LIMIT || '50'),
  
  // 聪明钱地址列表（用于跟单策略）
  smartMoneyAddresses: process.env.SMART_MONEY_ADDRESSES 
    ? process.env.SMART_MONEY_ADDRESSES.split(',')
    : [],
  
    // 日志配置
    logLevel: process.env.LOG_LEVEL || 'info',
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === 'true',
    // 聪明钱跟单详细日志（用于调试）
    enableSmartMoneyDebug: process.env.ENABLE_SMART_MONEY_DEBUG === 'true'
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
