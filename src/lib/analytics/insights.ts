import type { TTransaction } from "@/db/types";
import type { TransactionStats } from "./stats";
import type { RecurringTransaction } from "./recurring";
import { formatCurrency } from "@/lib/utils";

/**
 * Insight types
 */
export type InsightType = "warning" | "info" | "success" | "tip";

/**
 * Insight interface
 */
export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Generate smart insights based on spending patterns
 */
export function generateInsights(
  stats: TransactionStats,
  previousStats?: TransactionStats,
  recurring?: RecurringTransaction[],
): Insight[] {
  const insights: Insight[] = [];

  // 1. Unusual spending spike detection
  if (previousStats && previousStats.categoryBreakdown.length > 0) {
    const prevCategories = new Map(
      previousStats.categoryBreakdown.map((c) => [c.category, c.total]),
    );

    for (const category of stats.categoryBreakdown) {
      const prevTotal = prevCategories.get(category.category) || 0;
      if (prevTotal === 0) continue;

      const increase = ((category.total - prevTotal) / prevTotal) * 100;

      if (increase > 50) {
        insights.push({
          type: "warning",
          title: `${category.category} spending spike`,
          description: `You spent ${increase.toFixed(0)}% more on ${category.category} this period compared to last.`,
          action: {
            label: "View transactions",
            href: `/transactions?category=${encodeURIComponent(category.category)}`,
          },
        });
      }
    }
  }

  // 2. Forgotten subscriptions
  if (recurring && recurring.length > 0) {
    const unused = recurring.filter((r) => {
      const lastOccurrence = new Date(
        r.occurrences[r.occurrences.length - 1].date,
      );
      const expectedInterval =
        r.frequency === "monthly" ? 30 : r.frequency === "weekly" ? 7 : 365;
      const daysSinceLastUse = Math.floor(
        (Date.now() - lastOccurrence.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSinceLastUse > expectedInterval * 2;
    });

    if (unused.length > 0) {
      insights.push({
        type: "tip",
        title: "Potential unused subscriptions",
        description: `Found ${unused.length} recurring charge(s) that haven't occurred recently. Consider canceling if no longer needed.`,
        action: {
          label: "Review subscriptions",
          href: "/dashboard#recurring",
        },
      });
    }
  }

  // 3. Saving opportunities
  if (stats.categoryBreakdown.length > 0) {
    const topCategory = stats.categoryBreakdown.reduce((max, cat) =>
      cat.total > max.total ? cat : max,
    );

    if (topCategory.percentage > 40) {
      insights.push({
        type: "tip",
        title: "Saving opportunity detected",
        description: `${topCategory.category} represents ${topCategory.percentage.toFixed(0)}% of your spending (${formatCurrency(topCategory.total)}). Small reductions here could have big impact.`,
      });
    }
  }

  // 4. Positive trends
  if (previousStats && stats.totalSpent < previousStats.totalSpent) {
    const reduction =
      ((previousStats.totalSpent - stats.totalSpent) /
        previousStats.totalSpent) *
      100;
    insights.push({
      type: "success",
      title: "Great job reducing spending!",
      description: `You spent ${reduction.toFixed(1)}% less this period. Keep up the good work!`,
    });
  }

  // 5. High transaction count with low average (many small purchases)
  if (stats.transactionCount > 50 && stats.averageTransaction < 50) {
    insights.push({
      type: "info",
      title: "Many small transactions detected",
      description: `You made ${stats.transactionCount} transactions with an average of ${formatCurrency(stats.averageTransaction)}. Consider consolidating purchases to save time.`,
    });
  }

  // 6. Category concentration warning
  if (stats.categoryBreakdown.length > 0) {
    const topCategoryPercentage = Math.max(
      ...stats.categoryBreakdown.map((c) => c.percentage),
    );

    if (topCategoryPercentage > 75) {
      const topCategory = stats.categoryBreakdown.find(
        (c) => c.percentage === topCategoryPercentage,
      );
      insights.push({
        type: "warning",
        title: "Spending highly concentrated",
        description: `Over ${topCategoryPercentage.toFixed(0)}% of spending is in ${topCategory?.category}. Consider diversifying expenses for better financial balance.`,
      });
    }
  }

  // Sort insights: warnings first, then tips, info, success
  const priorityOrder: Record<InsightType, number> = {
    warning: 1,
    tip: 2,
    info: 3,
    success: 4,
  };

  return insights
    .sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
    .slice(0, 5); // Limit to top 5 insights
}
