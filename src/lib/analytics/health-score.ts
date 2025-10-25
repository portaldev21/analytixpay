import type { TransactionStats } from "./stats";

/**
 * Health score grade
 */
export type HealthGrade = "A" | "B" | "C" | "D" | "F";

/**
 * Health score factors breakdown
 */
export interface HealthScoreFactors {
  budgetAdherence: number; // 0-25 points
  savingsRate: number; // 0-25 points
  spendingTrend: number; // 0-25 points
  diversification: number; // 0-25 points
}

/**
 * Financial health score interface
 */
export interface HealthScore {
  score: number; // 0-100
  grade: HealthGrade;
  factors: HealthScoreFactors;
  recommendations: string[];
}

/**
 * Calculate financial health score based on spending patterns
 */
export function calculateHealthScore(
  stats: TransactionStats,
  budget?: number,
  previousPeriodStats?: TransactionStats,
): HealthScore {
  const factors: HealthScoreFactors = {
    budgetAdherence: 0,
    savingsRate: 0,
    spendingTrend: 0,
    diversification: 0,
  };

  const recommendations: string[] = [];

  // ============================================
  // 1. Budget Adherence (0-25 points)
  // ============================================
  if (budget && budget > 0) {
    const budgetUsage = (stats.totalSpent / budget) * 100;

    if (budgetUsage <= 80) {
      factors.budgetAdherence = 25;
    } else if (budgetUsage <= 90) {
      factors.budgetAdherence = 20;
    } else if (budgetUsage <= 100) {
      factors.budgetAdherence = 15;
    } else if (budgetUsage <= 110) {
      factors.budgetAdherence = 10;
      recommendations.push(
        "You're over budget this month. Review your spending to get back on track.",
      );
    } else {
      factors.budgetAdherence = 0;
      recommendations.push(
        "Significantly over budget! Consider cutting non-essential expenses.",
      );
    }
  } else {
    // Neutral score if no budget set
    factors.budgetAdherence = 15;
    recommendations.push("Set a monthly budget to better track your spending.");
  }

  // ============================================
  // 2. Savings Rate (0-25 points)
  // ============================================
  // Based on spending reduction compared to previous period
  if (previousPeriodStats && previousPeriodStats.totalSpent > 0) {
    const spendingChange =
      ((stats.totalSpent - previousPeriodStats.totalSpent) /
        previousPeriodStats.totalSpent) *
      100;

    if (spendingChange < -10) {
      // Spending reduced by >10%
      factors.savingsRate = 25;
    } else if (spendingChange < -5) {
      // Spending reduced by 5-10%
      factors.savingsRate = 22;
    } else if (spendingChange < 0) {
      // Any spending reduction
      factors.savingsRate = 20;
    } else if (spendingChange < 5) {
      // Slight increase (<5%)
      factors.savingsRate = 15;
    } else if (spendingChange < 10) {
      // Moderate increase (5-10%)
      factors.savingsRate = 10;
      recommendations.push(
        `Spending increased ${spendingChange.toFixed(1)}% vs last period.`,
      );
    } else {
      // Large increase (>10%)
      factors.savingsRate = 5;
      recommendations.push(
        `Spending increased significantly (${spendingChange.toFixed(1)}%). Review recent purchases.`,
      );
    }
  } else {
    // Neutral if no previous data
    factors.savingsRate = 15;
  }

  // ============================================
  // 3. Spending Trend (0-25 points)
  // ============================================
  // Based on average transaction amount changes
  if (previousPeriodStats && previousPeriodStats.averageTransaction > 0) {
    const avgChange =
      ((stats.averageTransaction - previousPeriodStats.averageTransaction) /
        previousPeriodStats.averageTransaction) *
      100;

    if (avgChange < -10) {
      // Average transaction decreased significantly
      factors.spendingTrend = 25;
    } else if (avgChange < -5) {
      factors.spendingTrend = 22;
    } else if (avgChange < 5) {
      // Stable
      factors.spendingTrend = 20;
    } else if (avgChange < 15) {
      factors.spendingTrend = 12;
      recommendations.push("Average transaction amount is increasing.");
    } else {
      factors.spendingTrend = 5;
      recommendations.push(
        "Large increase in average spending. Review recent large purchases.",
      );
    }
  } else {
    factors.spendingTrend = 15;
  }

  // ============================================
  // 4. Category Diversification (0-25 points)
  // ============================================
  // Too concentrated in one category is risky
  if (stats.categoryBreakdown.length === 0) {
    factors.diversification = 15;
  } else {
    const topCategoryPercentage = Math.max(
      ...stats.categoryBreakdown.map((c) => c.percentage),
    );

    if (topCategoryPercentage < 30) {
      // Very well diversified
      factors.diversification = 25;
    } else if (topCategoryPercentage < 40) {
      // Good diversification
      factors.diversification = 22;
    } else if (topCategoryPercentage < 50) {
      // Moderate concentration
      factors.diversification = 18;
    } else if (topCategoryPercentage < 60) {
      // High concentration
      factors.diversification = 12;
      recommendations.push(
        `${topCategoryPercentage.toFixed(0)}% of spending in one category.`,
      );
    } else if (topCategoryPercentage < 75) {
      // Very high concentration
      factors.diversification = 7;
      const topCategory = stats.categoryBreakdown.find(
        (c) => c.percentage === topCategoryPercentage,
      );
      recommendations.push(
        `Over ${topCategoryPercentage.toFixed(0)}% in ${topCategory?.category}. Consider diversifying expenses.`,
      );
    } else {
      // Extreme concentration
      factors.diversification = 0;
      const topCategory = stats.categoryBreakdown.find(
        (c) => c.percentage === topCategoryPercentage,
      );
      recommendations.push(
        `Extreme concentration in ${topCategory?.category} (${topCategoryPercentage.toFixed(0)}%). This limits financial flexibility.`,
      );
    }
  }

  // ============================================
  // Calculate Total Score
  // ============================================
  const score = Math.round(
    factors.budgetAdherence +
      factors.savingsRate +
      factors.spendingTrend +
      factors.diversification,
  );

  // ============================================
  // Assign Grade
  // ============================================
  let grade: HealthGrade;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  // ============================================
  // Add positive recommendation if score is good
  // ============================================
  if (score >= 85 && recommendations.length === 0) {
    recommendations.push(
      "Excellent financial health! Keep maintaining these good spending habits.",
    );
  }

  return {
    score,
    grade,
    factors,
    recommendations: recommendations.slice(0, 3), // Top 3 recommendations
  };
}

/**
 * Get health score description based on grade
 */
export function getHealthScoreDescription(grade: HealthGrade): string {
  switch (grade) {
    case "A":
      return "Excellent financial health";
    case "B":
      return "Good financial health";
    case "C":
      return "Fair financial health";
    case "D":
      return "Poor financial health";
    case "F":
      return "Critical financial health";
  }
}

/**
 * Get health score color class for styling
 */
export function getHealthScoreColor(grade: HealthGrade): string {
  switch (grade) {
    case "A":
      return "text-green-600";
    case "B":
      return "text-blue-600";
    case "C":
      return "text-yellow-600";
    case "D":
      return "text-orange-600";
    case "F":
      return "text-red-600";
  }
}
