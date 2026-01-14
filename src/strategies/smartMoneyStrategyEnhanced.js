/**
 * 聪明钱跟单策略（增强版）
 * 参考 @catalyst-team/poly-mcp 的设计思路
 * 支持实时监听、事件驱动、智能过滤
 */
import { EventEmitter } from 'events';

export class SmartMoneyStrategyEnhanced extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.smartMoneyAddresses = config.smartMoneyAddresses || [];
    this.seenTradeIds = new Set();
    this.maxSeen = 10000;
    this.sizeMultiplier = config.copyTradeSizeMultiplier || 0.1;
    this.fetchLimit = config.copyTradeFetchLimit || 100;
    this.debugMode = config.enableSmartMoneyDebug || config.enableDetailedLogs;
    
    // 交易统计
    this.tradeStats = new Map(); // address -> { totalTrades, winRate, avgProfit }
    
    // 监听间隔
    this.checkInterval = config.smartMoneyCheckInterval || 10000; // 10秒
    this.timer = null;
  }

  /**
   * 初始化策略
   */
  async initialize(client) {
    this.client = client;
    console.log(`✅ 聪明钱跟单策略（增强版）已初始化`);
    console.log(`   监控地址数量: ${this.smartMoneyAddresses.length}`);
    
    if (this.smartMoneyAddresses.length > 0) {
      console.log(`   地址列表:`);
      this.smartMoneyAddresses.forEach((addr, idx) => {
        console.log(`     ${idx + 1}. ${addr}`);
      });
    }
    
    // 初始化交易统计
    this.smartMoneyAddresses.forEach(addr => {
      this.tradeStats.set(addr, {
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        lastTradeTime: null
      });
    });
  }

  /**
   * 开始监听聪明钱交易
   */
  async start() {
    if (this.timer) {
      console.warn('⚠️  聪明钱监听已在运行');
      return;
    }

    console.log('🎯 开始监听聪明钱交易...');
    
    // 立即执行一次检查
    await this.checkSmartMoneyTrades();
    
    // 设置定时检查
    this.timer = setInterval(async () => {
      await this.checkSmartMoneyTrades();
    }, this.checkInterval);
  }

  /**
   * 停止监听
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('🛑 已停止监听聪明钱交易');
    }
  }

  /**
   * 检查聪明钱交易（核心方法）
   */
  async checkSmartMoneyTrades() {
    if (this.smartMoneyAddresses.length === 0) {
      return;
    }

    try {
      console.log(`\n🔍 [${new Date().toLocaleTimeString()}] 检查 ${this.smartMoneyAddresses.length} 个聪明钱地址...`);
      
      for (const address of this.smartMoneyAddresses) {
        try {
          await this.checkAddressTrades(address);
        } catch (error) {
          console.error(`   ❌ 检查地址 ${address.substring(0, 10)}... 失败:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ 检查聪明钱交易失败:', error);
      this.emit('error', error);
    }
  }

  /**
   * 检查单个地址的交易
   */
  async checkAddressTrades(address) {
    const trades = await this.client.getTradesByAddress(address, this.fetchLimit);
    
    if (!Array.isArray(trades) || trades.length === 0) {
      if (this.debugMode) {
        console.log(`   ℹ️  地址 ${address.substring(0, 10)}... 暂无新交易`);
      }
      return [];
    }

    const signals = [];
    let newTradesCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    for (const t of trades) {
      const tradeId = this.extractTradeId(t);
      
      // 去重检查
      if (tradeId && this.seenTradeIds.has(tradeId)) {
        skippedCount++;
        continue;
      }

      // 解析交易数据
      const parsed = this.parseTrade(t, address);
      if (!parsed) {
        invalidCount++;
        continue;
      }

      // 记录已处理的交易
      if (tradeId) {
        this.seenTradeIds.add(tradeId);
        if (this.seenTradeIds.size > this.maxSeen) {
          this.cleanupSeenTrades();
        }
      }

      // 生成跟单信号
      const signal = this.createCopySignal(parsed, address);
      signals.push(signal);
      newTradesCount++;

      // 更新统计
      this.updateStats(address, parsed);

      // 触发事件
      this.emit('newTrade', {
        address,
        trade: parsed,
        signal
      });

      if (this.debugMode) {
        console.log(`   ✅ 新交易: ${parsed.tokenId} ${parsed.side} ${parsed.size} @ ${parsed.price}`);
      }
    }

    // 输出统计
    if (newTradesCount > 0 || this.debugMode) {
      console.log(`   📊 ${address.substring(0, 10)}...: 总${trades.length} | 新${newTradesCount} | 跳过${skippedCount} | 无效${invalidCount}`);
    }

    return signals;
  }

  /**
   * 提取交易ID
   */
  extractTradeId(trade) {
    return trade.id || 
           trade.tradeID || 
           trade.tradeId || 
           trade.hash || 
           trade.transactionHash ||
           `${trade.tokenId || trade.tokenID || ''}_${trade.timestamp || Date.now()}_${trade.size || trade.amount || ''}`;
  }

  /**
   * 解析交易数据
   */
  parseTrade(t, address) {
    try {
      const tokenId = t.tokenID || t.tokenId || t.marketId || t.marketID || t.conditionId || t.outcome || t.assetId;
      const side = (t.side || t.takerSide || t.makerSide || t.direction || t.type || '').toString().toLowerCase();
      const price = Number(t.price ?? t.avgPrice ?? t.executionPrice ?? t.fillPrice ?? t.tradePrice ?? 0);
      const size = Number(t.size ?? t.amount ?? t.quantity ?? t.volume ?? t.tradeSize ?? 0);
      const timestamp = t.timestamp || t.time || t.createdAt || Date.now();

      // 验证数据
      if (!tokenId) return null;
      if (!side || (side !== 'buy' && side !== 'sell' && side !== 'yes' && side !== 'no')) return null;
      if (!Number.isFinite(price) || price <= 0) return null;
      if (!Number.isFinite(size) || size <= 0) return null;

      // 标准化 side
      const normalizedSide = this.normalizeSide(side);

      return {
        tokenId,
        side: normalizedSide,
        price,
        size,
        timestamp,
        originalTrade: t
      };
    } catch (error) {
      if (this.debugMode) {
        console.error(`   ⚠️  解析交易失败:`, error.message);
      }
      return null;
    }
  }

  /**
   * 标准化交易方向
   */
  normalizeSide(side) {
    const lower = side.toLowerCase();
    if (lower === 'yes' || lower === 'buy') return 'buy';
    if (lower === 'no' || lower === 'sell') return 'sell';
    return lower;
  }

  /**
   * 创建跟单信号
   */
  createCopySignal(parsed, address) {
    const copySize = Math.max(0, parsed.size * this.sizeMultiplier);
    const stats = this.tradeStats.get(address) || { winRate: 0.5 };

    return {
      type: 'smart_money',
      strategy: 'smart_money_enhanced',
      marketId: parsed.tokenId,
      tokenId: parsed.tokenId,
      direction: parsed.side,
      side: parsed.side,
      price: parsed.price,
      size: copySize,
      amount: copySize,
      strength: this.calculateSignalStrength(stats),
      expectedProfit: 0,
      reason: `跟随聪明钱地址 ${address.substring(0, 10)}...`,
      timestamp: parsed.timestamp,
      details: {
        sourceAddress: address,
        originalTrade: parsed.originalTrade,
        originalSize: parsed.size,
        originalPrice: parsed.price,
        multiplier: this.sizeMultiplier,
        traderWinRate: stats.winRate,
        traderStats: stats
      }
    };
  }

  /**
   * 计算信号强度
   */
  calculateSignalStrength(stats) {
    let strength = 0.7; // 基础强度

    // 根据交易者胜率调整
    if (stats.winRate > 0.6) {
      strength += 0.2;
    } else if (stats.winRate > 0.5) {
      strength += 0.1;
    }

    // 根据平均利润调整
    if (stats.avgProfit > 0.1) {
      strength += 0.1;
    }

    return Math.min(strength, 1.0);
  }

  /**
   * 更新统计信息
   */
  updateStats(address, parsed) {
    const stats = this.tradeStats.get(address) || {
      totalTrades: 0,
      winRate: 0.5,
      avgProfit: 0,
      lastTradeTime: null
    };

    stats.totalTrades++;
    stats.lastTradeTime = parsed.timestamp;

    // TODO: 从链上或API获取实际盈亏数据来计算胜率和平均利润
    // 这里暂时使用模拟数据
    this.tradeStats.set(address, stats);
  }

  /**
   * 清理已处理的交易记录
   */
  cleanupSeenTrades() {
    const keepSize = Math.floor(this.maxSeen / 2);
    const allIds = Array.from(this.seenTradeIds);
    this.seenTradeIds = new Set(allIds.slice(-keepSize));
    if (this.debugMode) {
      console.log(`   🧹 已清理交易记录，保留 ${this.seenTradeIds.size} 条`);
    }
  }

  /**
   * 获取跟单信号（兼容旧接口）
   */
  async getSignals(markets) {
    // 如果未启动监听，执行一次检查
    if (!this.timer) {
      await this.checkSmartMoneyTrades();
    }

    // 返回最近的信号（这里简化处理，实际应该从事件队列获取）
    return [];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      monitoredAddresses: this.smartMoneyAddresses.length,
      seenTrades: this.seenTradeIds.size,
      sizeMultiplier: this.sizeMultiplier,
      fetchLimit: this.fetchLimit,
      addressStats: {}
    };

    this.tradeStats.forEach((stat, addr) => {
      stats.addressStats[addr] = {
        totalTrades: stat.totalTrades,
        winRate: stat.winRate,
        avgProfit: stat.avgProfit,
        lastTradeTime: stat.lastTradeTime
      };
    });

    return stats;
  }

  /**
   * 添加监控地址
   */
  addAddress(address) {
    if (!this.smartMoneyAddresses.includes(address)) {
      this.smartMoneyAddresses.push(address);
      this.tradeStats.set(address, {
        totalTrades: 0,
        winRate: 0.5,
        avgProfit: 0,
        lastTradeTime: null
      });
      console.log(`✅ 已添加聪明钱地址: ${address}`);
      this.emit('addressAdded', address);
    }
  }

  /**
   * 移除监控地址
   */
  removeAddress(address) {
    const index = this.smartMoneyAddresses.indexOf(address);
    if (index > -1) {
      this.smartMoneyAddresses.splice(index, 1);
      this.tradeStats.delete(address);
      console.log(`✅ 已移除聪明钱地址: ${address}`);
      this.emit('addressRemoved', address);
    }
  }

  /**
   * 清空已处理的交易记录
   */
  clearSeenTrades() {
    this.seenTradeIds.clear();
    console.log('✅ 已清空已处理的交易记录');
  }
}
