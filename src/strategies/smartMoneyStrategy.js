/**
 * 聪明钱跟单策略
 * 独立模块：专门用于跟随指定的聪明钱地址
 */
export class SmartMoneyStrategy {
  constructor(config) {
    this.config = config;
    this.smartMoneyAddresses = config.smartMoneyAddresses || [];
    this.seenTradeIds = new Set();
    this.maxSeen = 5000;
    this.sizeMultiplier = config.copyTradeSizeMultiplier || 0.1;
    this.fetchLimit = config.copyTradeFetchLimit || 50;
  }

  /**
   * 初始化策略
   */
  async initialize(client) {
    this.client = client;
    console.log(`✅ 聪明钱跟单策略已初始化`);
    console.log(`   监控地址数量: ${this.smartMoneyAddresses.length}`);
    if (this.smartMoneyAddresses.length > 0) {
      console.log(`   地址列表: ${this.smartMoneyAddresses.slice(0, 3).join(', ')}${this.smartMoneyAddresses.length > 3 ? '...' : ''}`);
    }
  }

  /**
   * 获取聪明钱跟单信号
   */
  async getSignals(markets) {
    const signals = [];

    if (this.smartMoneyAddresses.length === 0) {
      return signals;
    }

    try {
      for (const address of this.smartMoneyAddresses) {
        try {
          const trades = await this.client.getTradesByAddress(address, this.fetchLimit);
          if (!Array.isArray(trades) || trades.length === 0) {
            continue;
          }

          let newTradesCount = 0;
          for (const t of trades) {
            const tradeId = t.id || t.tradeID || t.tradeId || t.hash;
            
            // 去重：跳过已处理的交易
            if (tradeId && this.seenTradeIds.has(tradeId)) {
              continue;
            }

            // 记录已处理的交易ID
            if (tradeId) {
              this.seenTradeIds.add(tradeId);
              // 防止 set 无限增长
              if (this.seenTradeIds.size > this.maxSeen) {
                // 简单清理：重建一个较小的集合
                this.seenTradeIds = new Set(Array.from(this.seenTradeIds).slice(-Math.floor(this.maxSeen / 2)));
              }
            }

            // 兼容字段：tokenID / tokenId / marketId 等
            const tokenId = t.tokenID || t.tokenId || t.marketId || t.marketID;
            const side = (t.side || t.takerSide || t.makerSide || '').toString().toLowerCase();
            const price = Number(t.price ?? t.avgPrice ?? t.executionPrice);
            const size = Number(t.size ?? t.amount ?? t.quantity);

            // 不足信息则跳过
            if (!tokenId || !side || !Number.isFinite(price) || !Number.isFinite(size)) {
              continue;
            }

            // 跟单规模：按比例复制
            const copySize = Math.max(0, size * this.sizeMultiplier);

            signals.push({
              type: 'smart_money',
              strategy: 'smart_money',
              marketId: tokenId,
              tokenId,
              direction: side,
              side,
              price,
              size: copySize,
              amount: copySize,
              strength: 0.9, // 聪明钱信号强度较高
              expectedProfit: 0,
              reason: `跟随聪明钱地址 ${address.substring(0, 10)}...`,
              details: {
                sourceAddress: address,
                originalTrade: t,
                multiplier: this.sizeMultiplier,
                originalSize: size,
                originalPrice: price
              }
            });

            newTradesCount++;
          }

          if (newTradesCount > 0 && this.config.enableDetailedLogs) {
            console.log(`   📍 地址 ${address.substring(0, 10)}...: 发现 ${newTradesCount} 个新交易`);
          }

        } catch (error) {
          console.error(`   ⚠️  获取地址 ${address.substring(0, 10)}... 的交易失败:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ 聪明钱跟单策略出错:', error);
    }

    return signals;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      monitoredAddresses: this.smartMoneyAddresses.length,
      seenTrades: this.seenTradeIds.size,
      sizeMultiplier: this.sizeMultiplier,
      fetchLimit: this.fetchLimit
    };
  }

  /**
   * 添加监控地址
   */
  addAddress(address) {
    if (!this.smartMoneyAddresses.includes(address)) {
      this.smartMoneyAddresses.push(address);
      console.log(`✅ 已添加聪明钱地址: ${address}`);
    }
  }

  /**
   * 移除监控地址
   */
  removeAddress(address) {
    const index = this.smartMoneyAddresses.indexOf(address);
    if (index > -1) {
      this.smartMoneyAddresses.splice(index, 1);
      console.log(`✅ 已移除聪明钱地址: ${address}`);
    }
  }

  /**
   * 清空已处理的交易记录（用于重新开始跟踪）
   */
  clearSeenTrades() {
    this.seenTradeIds.clear();
    console.log('✅ 已清空已处理的交易记录');
  }
}
