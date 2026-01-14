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
    // 启用详细日志（如果配置了调试模式）
    this.debugMode = config.enableSmartMoneyDebug || config.enableDetailedLogs;
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
      console.log(`🔍 开始检查 ${this.smartMoneyAddresses.length} 个聪明钱地址...`);
      
      for (const address of this.smartMoneyAddresses) {
        try {
          console.log(`   📍 检查地址: ${address.substring(0, 10)}...`);
          const trades = await this.client.getTradesByAddress(address, this.fetchLimit);
          
          if (!Array.isArray(trades)) {
            console.log(`   ⚠️  返回数据不是数组，类型: ${typeof trades}`);
            continue;
          }
          
          if (trades.length === 0) {
            console.log(`   ℹ️  该地址暂无交易记录`);
            continue;
          }
          
          console.log(`   ✅ 获取到 ${trades.length} 条交易记录`);

          let newTradesCount = 0;
          let skippedCount = 0;
          let invalidCount = 0;
          
          for (const t of trades) {
            // 显示原始交易数据（调试用）
            if (this.debugMode) {
              console.log(`   🔍 原始交易数据:`, JSON.stringify(t, null, 2).substring(0, 300));
            }
            
            const tradeId = t.id || t.tradeID || t.tradeId || t.hash || t.transactionHash;
            
            // 去重：跳过已处理的交易
            if (tradeId && this.seenTradeIds.has(tradeId)) {
              skippedCount++;
              if (this.debugMode) {
                console.log(`   ⏭️  跳过已处理交易: ${tradeId}`);
              }
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

            // 兼容字段：tokenID / tokenId / marketId / conditionId / outcome 等
            const tokenId = t.tokenID || t.tokenId || t.marketId || t.marketID || t.conditionId || t.outcome || t.assetId;
            const side = (t.side || t.takerSide || t.makerSide || t.direction || t.type || '').toString().toLowerCase();
            const price = Number(t.price ?? t.avgPrice ?? t.executionPrice ?? t.fillPrice ?? t.tradePrice ?? 0);
            const size = Number(t.size ?? t.amount ?? t.quantity ?? t.volume ?? t.tradeSize ?? 0);

            // 详细日志
            if (this.debugMode) {
              console.log(`   📊 解析结果:`, {
                tradeId: tradeId || '无ID',
                tokenId: tokenId || '无tokenId',
                side: side || '无side',
                price: price || '无price',
                size: size || '无size'
              });
            }

            // 不足信息则跳过
            if (!tokenId) {
              invalidCount++;
              if (this.debugMode) {
                console.log(`   ⚠️  缺少 tokenId，跳过交易`);
              }
              continue;
            }
            
            if (!side || (side !== 'buy' && side !== 'sell' && side !== 'yes' && side !== 'no')) {
              invalidCount++;
              if (this.debugMode) {
                console.log(`   ⚠️  无效的 side: ${side}，跳过交易`);
              }
              continue;
            }
            
            if (!Number.isFinite(price) || price <= 0) {
              invalidCount++;
              if (this.debugMode) {
                console.log(`   ⚠️  无效的 price: ${price}，跳过交易`);
              }
              continue;
            }
            
            if (!Number.isFinite(size) || size <= 0) {
              invalidCount++;
              if (this.debugMode) {
                console.log(`   ⚠️  无效的 size: ${size}，跳过交易`);
              }
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
            console.log(`   ✅ 生成跟单信号: ${tokenId} ${side} ${size} @ ${price}`);
          }

          // 显示统计信息
          console.log(`   📊 地址 ${address.substring(0, 10)}... 统计:`);
          console.log(`      总交易: ${trades.length}`);
          console.log(`      新交易: ${newTradesCount}`);
          console.log(`      已跳过: ${skippedCount}`);
          console.log(`      无效: ${invalidCount}`);
          
          if (newTradesCount > 0) {
            console.log(`   🎯 成功生成 ${newTradesCount} 个跟单信号`);
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
