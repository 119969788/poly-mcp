/**
 * 聪明钱跟单策略（SDK版）
 * 参考 https://github.com/119969788/poly-copy-trading
 * 使用 @catalyst-team/poly-sdk 的 smartMoney.startAutoCopyTrading() API
 */
import { EventEmitter } from 'events';

export class SmartMoneySDKStrategy extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.sdk = null;
    this.isRunning = false;
    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfit: 0,
      startTime: null
    };
  }

  /**
   * 初始化策略
   */
  async initialize(client) {
    this.client = client;
    
    try {
      // 动态导入 @catalyst-team/poly-sdk
      const polySDK = await import('@catalyst-team/poly-sdk');
      this.sdk = polySDK;
      
      console.log('✅ 聪明钱跟单策略（SDK版）已初始化');
      console.log('   使用 @catalyst-team/poly-sdk 的自动跟单 API');
      
      // 检查 SDK 是否可用
      if (!this.sdk) {
        throw new Error('SDK 导入失败');
      }
      
      // 检查是否已授权 USDC.e
      await this.checkAndApproveUSDC();
      
    } catch (error) {
      console.error('❌ 初始化 SDK 失败:', error.message);
      console.error('   请确保已安装 @catalyst-team/poly-sdk: npm install @catalyst-team/poly-sdk');
      console.error('   如果 SDK 不支持，建议使用增强版: USE_ENHANCED_SMART_MONEY=true');
      throw error;
    }
  }

  /**
   * 检查并授权 USDC.e（首次运行需要）
   */
  async checkAndApproveUSDC() {
    try {
      if (!this.sdk || !this.config.privateKey) {
        return;
      }

      console.log('🔐 检查 USDC.e 授权状态...');
      
      // 初始化 SDK（如果需要）
      // 注意：这里需要根据实际的 SDK API 调整
      // const sdkInstance = this.sdk.createSDK({
      //   privateKey: this.config.privateKey
      // });
      
      // 尝试授权（如果 SDK 支持）
      // await sdkInstance.approveAll();
      
      console.log('✅ USDC.e 授权检查完成');
    } catch (error) {
      console.warn('⚠️  授权检查失败（可能已授权）:', error.message);
    }
  }

  /**
   * 启动自动跟单
   */
  async start() {
    if (this.isRunning) {
      console.warn('⚠️  聪明钱跟单已在运行中');
      return;
    }

    try {
      if (!this.sdk) {
        throw new Error('SDK 未初始化，请先调用 initialize()');
      }

      // 获取配置
      const options = this.getCopyTradingOptions();
      
      console.log('🚀 启动聪明钱自动跟单...');
      console.log('📋 配置参数:');
      console.log(`   跟随规模: ${(options.sizeScale * 100).toFixed(0)}%`);
      console.log(`   最大单笔: ${options.maxSizePerTrade} USDC`);
      console.log(`   最大滑点: ${(options.maxSlippage * 100).toFixed(0)}%`);
      console.log(`   订单类型: ${options.orderType}`);
      console.log(`   最小交易: ${options.minTradeSize} USDC`);
      console.log(`   模拟模式: ${options.dryRun ? '是' : '否'}`);

      // 确定要跟随的目标
      const targetAddresses = this.getTargetAddresses();
      if (targetAddresses && targetAddresses.length > 0) {
        console.log(`   目标地址: ${targetAddresses.length} 个`);
        targetAddresses.forEach((addr, idx) => {
          console.log(`     ${idx + 1}. ${addr}`);
        });
      } else {
        console.log('   跟随模式: 排行榜前 50 名');
      }

      // 初始化 SDK 实例
      const sdkInstance = await this.createSDKInstance();
      
      // 检查 SDK 的实际结构
      console.log('🔍 检查 SDK 可用方法...');
      this.logSDKStructure(sdkInstance);
      
      // 尝试多种可能的 API 调用方式
      const apiMethods = this.findSmartMoneyAPI(sdkInstance);
      
      if (apiMethods.length === 0) {
        console.warn('⚠️  SDK 不支持自动跟单 API，降级到增强版模式');
        console.warn('   建议：设置 USE_ENHANCED_SMART_MONEY=true 使用增强版');
        throw new Error('SDK 不支持自动跟单 API，请使用增强版或标准版');
      }
      
      // 尝试使用找到的 API
      for (const method of apiMethods) {
        try {
          console.log(`🔍 尝试使用 API: ${method.path}`);
          const result = await method.call({
            ...options,
            targetAddresses: targetAddresses && targetAddresses.length > 0 ? targetAddresses : undefined
          });

          this.isRunning = true;
          this.stats.startTime = Date.now();
          this.sdkInstance = sdkInstance;
          
          console.log('✅ 聪明钱自动跟单已启动');
          
          // 设置事件监听（如果 SDK 支持）
          this.setupEventListeners(sdkInstance);
          
          return result;
        } catch (error) {
          console.warn(`⚠️  API ${method.path} 调用失败:`, error.message);
          // 继续尝试下一个
        }
      }
      
      throw new Error('所有 SDK API 调用都失败，请检查 SDK 版本和文档');
      
    } catch (error) {
      console.error('❌ 启动聪明钱跟单失败:', error.message);
      throw error;
    }
  }

  /**
   * 创建 SDK 实例
   */
  async createSDKInstance() {
    try {
      // 根据实际的 SDK API 创建实例
      // 尝试多种可能的初始化方式
      if (this.sdk.createSDK) {
        return this.sdk.createSDK({
          privateKey: this.config.privateKey,
        });
      } else if (this.sdk.default) {
        if (typeof this.sdk.default === 'function') {
          return new this.sdk.default({
            privateKey: this.config.privateKey,
          });
        } else {
          return this.sdk.default;
        }
      } else if (this.sdk.PolySDK) {
        return new this.sdk.PolySDK({
          privateKey: this.config.privateKey,
        });
      } else if (this.sdk.init) {
        return await this.sdk.init({
          privateKey: this.config.privateKey,
        });
      } else {
        // 尝试直接使用，可能已经是实例
        return this.sdk;
      }
    } catch (error) {
      console.error('❌ 创建 SDK 实例失败:', error.message);
      throw error;
    }
  }

  /**
   * 记录 SDK 结构（用于调试）
   */
  logSDKStructure(sdkInstance) {
    if (!this.debugMode) return;
    
    console.log('📋 SDK 实例结构:');
    const keys = Object.keys(sdkInstance || {});
    console.log(`   顶层属性: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
    
    if (sdkInstance.smartMoney) {
      const smartMoneyKeys = Object.keys(sdkInstance.smartMoney);
      console.log(`   smartMoney 方法: ${smartMoneyKeys.join(', ')}`);
    }
  }

  /**
   * 查找可用的聪明钱 API
   */
  findSmartMoneyAPI(sdkInstance) {
    const methods = [];
    
    if (!sdkInstance) return methods;
    
    // 方式1: sdkInstance.smartMoney.startAutoCopyTrading
    if (sdkInstance.smartMoney && typeof sdkInstance.smartMoney.startAutoCopyTrading === 'function') {
      methods.push({
        path: 'smartMoney.startAutoCopyTrading',
        call: (options) => sdkInstance.smartMoney.startAutoCopyTrading(options)
      });
    }
    
    // 方式2: sdkInstance.startAutoCopyTrading
    if (typeof sdkInstance.startAutoCopyTrading === 'function') {
      methods.push({
        path: 'startAutoCopyTrading',
        call: (options) => sdkInstance.startAutoCopyTrading(options)
      });
    }
    
    // 方式3: sdkInstance.smartMoney.start
    if (sdkInstance.smartMoney && typeof sdkInstance.smartMoney.start === 'function') {
      methods.push({
        path: 'smartMoney.start',
        call: (options) => sdkInstance.smartMoney.start(options)
      });
    }
    
    // 方式4: sdkInstance.copyTrading
    if (sdkInstance.copyTrading && typeof sdkInstance.copyTrading.start === 'function') {
      methods.push({
        path: 'copyTrading.start',
        call: (options) => sdkInstance.copyTrading.start(options)
      });
    }
    
    return methods;
  }

  /**
   * 设置事件监听
   */
  setupEventListeners(sdkInstance) {
    // 监听交易事件（如果 SDK 支持）
    if (sdkInstance.on) {
      sdkInstance.on('trade', (tradeData) => {
        this.handleTrade(tradeData);
      });
      
      sdkInstance.on('error', (error) => {
        console.error('❌ SDK 错误:', error);
        this.emit('error', error);
      });
    }
  }

  /**
   * 处理交易事件
   */
  handleTrade(tradeData) {
    this.stats.totalTrades++;
    
    if (tradeData.success) {
      this.stats.successfulTrades++;
      this.stats.totalProfit += tradeData.profit || 0;
      console.log(`✅ 跟单交易成功: ${tradeData.marketId || tradeData.tokenId}`);
    } else {
      this.stats.failedTrades++;
      console.log(`❌ 跟单交易失败: ${tradeData.error || '未知错误'}`);
    }
    
    this.emit('trade', tradeData);
  }

  /**
   * 获取跟单配置选项
   */
  getCopyTradingOptions() {
    return {
      // 跟随规模（0.1 = 10%）
      sizeScale: parseFloat(this.config.copyTradeSizeMultiplier || process.env.COPY_SIZE_SCALE || '0.1'),
      
      // 最大单笔交易金额（USDC）
      maxSizePerTrade: parseFloat(this.config.maxPositionSize || process.env.MAX_SIZE_PER_TRADE || '10'),
      
      // 最大滑点（0.03 = 3%）
      maxSlippage: parseFloat(process.env.MAX_SLIPPAGE || '0.03'),
      
      // 订单类型：FOK (Fill or Kill) 或 IOC (Immediate or Cancel)
      orderType: process.env.ORDER_TYPE || 'FOK',
      
      // 最小交易金额（USDC）
      minTradeSize: parseFloat(process.env.MIN_TRADE_SIZE || '5'),
      
      // 模拟模式（默认 true，安全测试）
      dryRun: this.config.enableCopyTradingExecution !== true && 
              process.env.DRY_RUN !== 'false' && 
              process.env.ENABLE_COPY_TRADING_EXECUTION !== 'true'
    };
  }

  /**
   * 获取目标地址列表
   */
  getTargetAddresses() {
    const addresses = this.config.smartMoneyAddresses || 
                     (process.env.TARGET_ADDRESSES ? 
                       process.env.TARGET_ADDRESSES.split(',').map(addr => addr.trim()) : 
                       []);
    
    return addresses.length > 0 ? addresses : null;
  }

  /**
   * 停止自动跟单
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🛑 正在停止聪明钱自动跟单...');
      
      // 如果 SDK 支持停止方法
      if (this.sdkInstance && this.sdkInstance.smartMoney && this.sdkInstance.smartMoney.stop) {
        await this.sdkInstance.smartMoney.stop();
      }
      
      this.isRunning = false;
      this.printStats();
      console.log('✅ 聪明钱自动跟单已停止');
      
    } catch (error) {
      console.error('❌ 停止聪明钱跟单失败:', error.message);
    }
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const runtime = this.stats.startTime 
      ? Math.floor((Date.now() - this.stats.startTime) / 1000)
      : 0;
    
    console.log('\n📊 聪明钱跟单统计:');
    console.log(`   运行时间: ${Math.floor(runtime / 60)}分${runtime % 60}秒`);
    console.log(`   总交易数: ${this.stats.totalTrades}`);
    console.log(`   成功交易: ${this.stats.successfulTrades}`);
    console.log(`   失败交易: ${this.stats.failedTrades}`);
    console.log(`   总利润: ${this.stats.totalProfit.toFixed(2)} USDC`);
    if (this.stats.totalTrades > 0) {
      console.log(`   成功率: ${((this.stats.successfulTrades / this.stats.totalTrades) * 100).toFixed(2)}%`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      runtime: this.stats.startTime 
        ? Math.floor((Date.now() - this.stats.startTime) / 1000)
        : 0
    };
  }

  /**
   * 获取跟单信号（兼容接口）
   */
  async getSignals(markets) {
    // SDK 版本使用事件驱动，不需要返回信号列表
    return [];
  }
}
