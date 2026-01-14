/**
 * 跟单策略
 * 跟随"聪明钱"（smart money）的交易
 */
export class CopyTradingStrategy {
  constructor(config) {
    this.config = config;
    this.minSignalStrength = config.minSignalStrength || 0.7;
    this.smartMoneyAddresses = config.smartMoneyAddresses || [];
    this.seenTradeIds = new Set();
    this.maxSeen = 5000;
  }

  /**
   * 初始化策略
   */
  async initialize(client) {
    this.client = client;
  }

  /**
   * 获取跟单信号
   */
  async getSignals(markets) {
    const signals = [];

    try {
      // 策略1: 跟随大额交易
      const largeTradeSignals = await this.findLargeTrades(markets);
      signals.push(...largeTradeSignals);

      // 策略2: 跟随聪明钱地址
      if (this.smartMoneyAddresses.length > 0) {
        const smartMoneySignals = await this.followSmartMoney(markets);
        signals.push(...smartMoneySignals);
      }

      // 策略3: 跟随高胜率交易者
      const highWinRateSignals = await this.followHighWinRateTraders(markets);
      if (Array.isArray(highWinRateSignals)) {
        signals.push(...highWinRateSignals);
      }

    } catch (error) {
      console.error('获取跟单信号时出错:', error);
    }

    // 按信号强度排序
    return signals
      .filter(signal => signal.strength >= this.minSignalStrength)
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * 寻找大额交易
   * 大额交易通常意味着交易者有较强的信心
   */
  async findLargeTrades(markets) {
    const signals = [];
    const minTradeSize = this.config.minLargeTradeSize || 1000; // 最小交易金额（USDC）

    try {
      // 确保 markets 是数组
      if (!Array.isArray(markets) || markets.length === 0) {
        return [];
      }

      const marketsToCheck = markets.slice(0, 20);
      for (const market of marketsToCheck) {
        // TODO: 实现大额交易检测
        // 1. 获取最近的交易记录
        // 2. 筛选大额交易
        // 3. 分析交易方向和时机
        
        // 示例逻辑
        const recentTrades = await this.client.getTradeHistory(50);
        const largeTrades = recentTrades.filter(
          trade => trade.amount >= minTradeSize && trade.marketId === market.id
        );

        if (largeTrades.length > 0) {
          // 分析大额交易的方向
          const buyTrades = largeTrades.filter(t => t.side === 'buy').length;
          const sellTrades = largeTrades.filter(t => t.side === 'sell').length;
          
          if (buyTrades > sellTrades * 1.5) {
            signals.push({
              type: 'copy_large_trade',
              marketId: market.id,
              direction: 'buy',
              strength: Math.min(buyTrades / (buyTrades + sellTrades), 0.95),
              reason: '大额买入信号',
              details: {
                largeTradeCount: largeTrades.length,
                buyRatio: buyTrades / (buyTrades + sellTrades)
              }
            });
          } else if (sellTrades > buyTrades * 1.5) {
            signals.push({
              type: 'copy_large_trade',
              marketId: market.id,
              direction: 'sell',
              strength: Math.min(sellTrades / (buyTrades + sellTrades), 0.95),
              reason: '大额卖出信号',
              details: {
                largeTradeCount: largeTrades.length,
                sellRatio: sellTrades / (buyTrades + sellTrades)
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('寻找大额交易时出错:', error);
    }

    return signals;
  }

  /**
   * 跟随聪明钱
   * 跟踪已知的高胜率交易者地址
   */
  async followSmartMoney(markets) {
    const signals = [];

    try {
      const limit = this.config.copyTradeFetchLimit || 50;
      const sizeMultiplier = this.config.copyTradeSizeMultiplier || 0.1;

      for (const address of this.smartMoneyAddresses) {
        const trades = await this.client.getTradesByAddress(address, limit);
        if (!Array.isArray(trades) || trades.length === 0) continue;

        for (const t of trades) {
          const tradeId = t.id || t.tradeID || t.tradeId || t.hash;
          if (tradeId && this.seenTradeIds.has(tradeId)) continue;

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
          if (!tokenId || !side || !Number.isFinite(price) || !Number.isFinite(size)) continue;

          // 跟单规模：按比例复制，并交给风控再做上限控制
          const copySize = Math.max(0, size * sizeMultiplier);

          signals.push({
            type: 'copy_smart_money',
            // 这里用 marketId 字段承载 tokenId，方便日志展示；真实下单时需要按你的 executeTrade 结构再适配
            marketId: tokenId,
            tokenId,
            direction: side,
            side,
            price,
            size: copySize,
            amount: copySize,
            strength: 0.9,
            // 默认不用于套利判断，避免被风控当成可执行套利机会
            expectedProfit: 0,
            reason: `跟随地址 ${address} 的成交`,
            details: {
              sourceAddress: address,
              originalTrade: t,
              multiplier: sizeMultiplier,
            }
          });
        }
      }
    } catch (error) {
      console.error('跟随聪明钱时出错:', error);
    }

    return signals;
  }

  /**
   * 跟随高胜率交易者
   * 识别并跟随历史胜率高的交易者
   */
  async followHighWinRateTraders(markets) {
    const signals = [];

    try {
      // TODO: 实现高胜率交易者识别
      // 1. 分析历史交易数据
      // 2. 计算交易者胜率
      // 3. 跟随高胜率交易者的新交易
      
    } catch (error) {
      console.error('跟随高胜率交易者时出错:', error);
    }

    return signals;
  }

  /**
   * 计算信号强度
   */
  calculateSignalStrength(signal) {
    // 综合多个因素计算信号强度
    let strength = 0.5;

    // 大额交易权重
    if (signal.type === 'copy_large_trade') {
      strength += 0.3;
    }

    // 聪明钱权重
    if (signal.type === 'copy_smart_money') {
      strength += 0.4;
    }

    // 交易者历史胜率权重
    if (signal.traderWinRate) {
      strength += signal.traderWinRate * 0.3;
    }

    return Math.min(strength, 1.0);
  }
}
