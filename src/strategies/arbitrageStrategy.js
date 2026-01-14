/**
 * 套利策略
 * 识别跨市场或跨交易对的套利机会
 */
export class ArbitrageStrategy {
  constructor(config) {
    this.config = config;
    this.minProfitMargin = config.minProfitMargin || 0.02; // 最小2%利润
  }

  /**
   * 初始化策略
   */
  async initialize(client) {
    this.client = client;
  }

  /**
   * 查找套利机会
   */
  async findOpportunities(markets) {
    const opportunities = [];

    try {
      // 确保 markets 是数组
      if (!Array.isArray(markets)) {
        console.warn('⚠️  markets 不是数组，返回空机会列表');
        return [];
      }

      if (markets.length === 0) {
        return [];
      }

      // 策略1: 跨市场套利
      // 寻找相同或相似事件在不同市场的价格差异
      const crossMarketOpportunities = await this.findCrossMarketArbitrage(markets);
      if (Array.isArray(crossMarketOpportunities)) {
        opportunities.push(...crossMarketOpportunities);
      }

      // 策略2: 订单簿套利
      // 在同一市场的订单簿中寻找价格差异
      const marketsToCheck = markets.slice(0, 10); // 限制检查数量
      for (const market of marketsToCheck) {
        try {
          const orderBookOpportunities = await this.findOrderBookArbitrage(market);
          if (Array.isArray(orderBookOpportunities)) {
            opportunities.push(...orderBookOpportunities);
          }
        } catch (error) {
          console.error(`检查市场 ${market?.id || 'unknown'} 的订单簿套利时出错:`, error.message);
        }
      }

      // 策略3: Yes/No 价格不一致套利
      // 如果 Yes + No 价格不等于 1，可能存在套利机会
      const priceMismatchOpportunities = await this.findPriceMismatchArbitrage(markets);
      if (Array.isArray(priceMismatchOpportunities)) {
        opportunities.push(...priceMismatchOpportunities);
      }

    } catch (error) {
      console.error('查找套利机会时出错:', error);
    }

    // 按预期利润排序
    return opportunities
      .filter(opp => opp.expectedProfit >= this.minProfitMargin)
      .sort((a, b) => b.expectedProfit - a.expectedProfit);
  }

  /**
   * 跨市场套利
   * 寻找相同事件在不同市场的价格差异
   */
  async findCrossMarketArbitrage(markets) {
    const opportunities = [];
    
    // TODO: 实现跨市场套利逻辑
    // 1. 识别相同或相关的事件
    // 2. 比较不同市场的价格
    // 3. 计算套利空间
    
    return opportunities;
  }

  /**
   * 订单簿套利
   * 在订单簿的买卖价差中寻找机会
   */
  async findOrderBookArbitrage(market) {
    const opportunities = [];
    
    try {
      const yesPrices = await this.client.getMarketPrices(market.id);
      const noPrices = await this.client.getMarketPrices(market.id);
      
      // 检查 Yes 和 No 价格是否合理
      const totalPrice = yesPrices.yes + noPrices.no;
      
      if (Math.abs(totalPrice - 1.0) > 0.01) {
        // 价格不一致，可能存在套利机会
        const profitMargin = Math.abs(totalPrice - 1.0);
        
        if (profitMargin >= this.minProfitMargin) {
          opportunities.push({
            type: 'orderbook_arbitrage',
            marketId: market.id,
            expectedProfit: profitMargin,
            strategy: 'price_mismatch',
            details: {
              yesPrice: yesPrices.yes,
              noPrice: noPrices.no,
              totalPrice
            }
          });
        }
      }
    } catch (error) {
      console.error(`检查市场 ${market.id} 的订单簿套利时出错:`, error);
    }
    
    return opportunities;
  }

  /**
   * 价格不匹配套利
   * Yes + No 价格应该等于 1
   */
  async findPriceMismatchArbitrage(markets) {
    const opportunities = [];
    
    // 确保 markets 是数组
    if (!Array.isArray(markets) || markets.length === 0) {
      return [];
    }
    
    const marketsToCheck = markets.slice(0, 20);
    for (const market of marketsToCheck) {
      try {
        const prices = await this.client.getMarketPrices(market.id);
        const totalPrice = prices.yes + prices.no;
        const deviation = Math.abs(totalPrice - 1.0);
        
        if (deviation >= this.minProfitMargin) {
          const profitMargin = deviation * 0.5; // 考虑交易费用后的实际利润
          
          opportunities.push({
            type: 'price_mismatch',
            marketId: market.id,
            expectedProfit: profitMargin,
            strategy: 'price_mismatch',
            details: {
              yesPrice: prices.yes,
              noPrice: prices.no,
              deviation
            },
            // 如果总价 < 1，买入 Yes + No
            // 如果总价 > 1，卖出 Yes + No
            trade: totalPrice < 1.0 ? 'buy_both' : 'sell_both'
          });
        }
      } catch (error) {
        // 忽略单个市场的错误
      }
    }
    
    return opportunities;
  }

  /**
   * 计算套利利润
   */
  calculateProfit(opportunity, tradeSize) {
    return opportunity.expectedProfit * tradeSize;
  }
}
