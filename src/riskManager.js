/**
 * 风险管理器
 * 控制交易风险，防止过度交易和重大损失
 */
export class RiskManager {
  constructor(config) {
    this.config = config;
    this.maxPositionSize = config.maxPositionSize || 100;
    this.maxDailyLoss = config.maxDailyLoss || 1000;
    this.maxPositions = config.maxPositions || 10;
    this.minProfitMargin = config.minProfitMargin || 0.02;
    
    // 交易记录
    this.dailyStats = {
      date: new Date().toDateString(),
      totalTrades: 0,
      totalProfit: 0,
      positions: new Set()
    };
    
    // 市场风险评分
    this.marketRiskScores = new Map();
  }

  /**
   * 判断是否应该执行交易
   */
  async shouldExecute(opportunity) {
    // 1. 检查每日损失限制
    if (this.dailyStats.totalProfit <= -this.maxDailyLoss) {
      console.log('⚠️  已达到每日最大损失限制');
      return false;
    }

    // 2. 检查持仓数量限制
    if (this.dailyStats.positions.size >= this.maxPositions) {
      console.log('⚠️  已达到最大持仓数量限制');
      return false;
    }

    // 3. 检查单笔交易金额
    const tradeSize = opportunity.amount || this.maxPositionSize;
    if (tradeSize > this.maxPositionSize) {
      console.log(`⚠️  交易金额 ${tradeSize} 超过最大限制 ${this.maxPositionSize}`);
      return false;
    }

    // 4. 检查利润空间
    if (opportunity.expectedProfit < this.minProfitMargin) {
      console.log(`⚠️  预期利润 ${(opportunity.expectedProfit * 100).toFixed(2)}% 低于最小要求 ${(this.minProfitMargin * 100).toFixed(2)}%`);
      return false;
    }

    // 5. 检查市场风险
    const marketRisk = await this.assessMarketRisk(opportunity.marketId);
    if (marketRisk > 0.8) {
      console.log(`⚠️  市场风险过高: ${(marketRisk * 100).toFixed(2)}%`);
      return false;
    }

    // 6. 检查是否已有相同市场持仓
    if (this.dailyStats.positions.has(opportunity.marketId)) {
      console.log(`⚠️  市场 ${opportunity.marketId} 已有持仓`);
      return false;
    }

    return true;
  }

  /**
   * 评估市场风险
   */
  async assessMarketRisk(marketId) {
    // 如果已缓存风险评分，直接返回
    if (this.marketRiskScores.has(marketId)) {
      return this.marketRiskScores.get(marketId);
    }

    // 简单的风险评分逻辑
    // TODO: 实现更复杂的风险评估
    // 可以考虑：市场流动性、价格波动性、交易量等
    
    let riskScore = 0.5; // 默认中等风险

    // 示例：根据市场特征调整风险
    // - 低流动性 = 高风险
    // - 高波动性 = 高风险
    // - 小交易量 = 高风险

    this.marketRiskScores.set(marketId, riskScore);
    return riskScore;
  }

  /**
   * 记录交易
   */
  async recordTrade(tradeResult) {
    this.dailyStats.totalTrades++;
    this.dailyStats.totalProfit += tradeResult.profit || 0;
    
    if (tradeResult.marketId) {
      this.dailyStats.positions.add(tradeResult.marketId);
    }

    // 如果是新的一天，重置统计
    const today = new Date().toDateString();
    if (this.dailyStats.date !== today) {
      this.resetDailyStats();
    }
  }

  /**
   * 重置每日统计
   */
  resetDailyStats() {
    this.dailyStats = {
      date: new Date().toDateString(),
      totalTrades: 0,
      totalProfit: 0,
      positions: new Set()
    };
    this.marketRiskScores.clear();
  }

  /**
   * 获取当前风险状态
   */
  getRiskStatus() {
    return {
      dailyProfit: this.dailyStats.totalProfit,
      dailyTrades: this.dailyStats.totalTrades,
      currentPositions: this.dailyStats.positions.size,
      maxDailyLoss: this.maxDailyLoss,
      riskLevel: this.dailyStats.totalProfit < -this.maxDailyLoss * 0.5 ? 'high' : 'normal'
    };
  }

  /**
   * 计算建议的交易金额
   */
  calculateRecommendedSize(opportunity, availableBalance) {
    // 基于凯利公式的简化版本
    const winProbability = 0.6; // 假设60%胜率
    const winLossRatio = opportunity.expectedProfit / (1 - opportunity.expectedProfit);
    const kellyFraction = (winProbability * winLossRatio - (1 - winProbability)) / winLossRatio;
    
    // 使用保守的凯利分数（除以2）
    const conservativeFraction = Math.max(0, kellyFraction * 0.5);
    const recommendedSize = availableBalance * conservativeFraction;
    
    // 不超过配置的最大值
    return Math.min(recommendedSize, this.maxPositionSize);
  }
}
