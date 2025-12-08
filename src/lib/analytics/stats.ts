import type { TTransaction } from "@/db/types";

/**
 * Transaction statistics interface
 */
export interface TransactionStats {
  totalSpent: number;
  averageTransaction: number;
  transactionCount: number;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
}

/**
 * Monthly comparison interface
 */
export interface MonthlyComparison {
  currentMonth: number;
  lastMonth: number;
  percentageChange: number;
}

/**
 * Calculate transaction statistics
 * Centralized calculation logic for reusability
 */
export function calculateTransactionStats(
  transactions: TTransaction[],
): TransactionStats {
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const averageTransaction =
    transactions.length > 0 ? totalSpent / transactions.length : 0;

  // Category breakdown with Map for better performance
  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const transaction of transactions) {
    const existing = categoryMap.get(transaction.category) || {
      total: 0,
      count: 0,
    };
    categoryMap.set(transaction.category, {
      total: existing.total + Number(transaction.amount),
      count: existing.count + 1,
    });
  }

  // Convert to array and calculate percentages
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
      percentage: totalSpent > 0 ? (stats.total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total); // Sort by total descending

  return {
    totalSpent,
    averageTransaction,
    transactionCount: transactions.length,
    categoryBreakdown,
  };
}

/**
 * Calculate monthly comparison
 * Compares current month spending with last month
 */
export function calculateMonthlyComparison(
  transactions: TTransaction[],
): MonthlyComparison {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter current month transactions
  const currentMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  // Calculate last month
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filter last month transactions
  const lastMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    );
  });

  // Calculate totals
  const currentMonthTotal = currentMonthTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );
  const lastMonthTotal = lastMonthTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  // Calculate percentage change
  const percentageChange =
    lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

  return {
    currentMonth: currentMonthTotal,
    lastMonth: lastMonthTotal,
    percentageChange,
  };
}

/**
 * Get top transactions by amount
 */
export function getTopTransactions(
  transactions: TTransaction[],
  limit = 5,
): TTransaction[] {
  return [...transactions]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit);
}

/**
 * Calculate spending trends by month
 */
export function calculateSpendingTrends(
  transactions: TTransaction[],
  months = 6,
): { month: string; total: number; count: number }[] {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Filter transactions within time range
  const recentTransactions = transactions.filter(
    (t) => new Date(t.date) >= startDate,
  );

  // Group by month
  const monthMap = new Map<string, { total: number; count: number }>();

  for (const transaction of recentTransactions) {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
    monthMap.set(monthKey, {
      total: existing.total + Number(transaction.amount),
      count: existing.count + 1,
    });
  }

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, stats]) => ({
      month,
      total: stats.total,
      count: stats.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: TTransaction[],
  startDate: string,
  endDate: string,
): TTransaction[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= start && date <= end;
  });
}

/**
 * Group transactions by category
 */
export function groupTransactionsByCategory(
  transactions: TTransaction[],
): Map<string, TTransaction[]> {
  const categoryMap = new Map<string, TTransaction[]>();

  for (const transaction of transactions) {
    const existing = categoryMap.get(transaction.category) || [];
    existing.push(transaction);
    categoryMap.set(transaction.category, existing);
  }

  return categoryMap;
}

/**
 * Calculate percentage change between two values
 * Returns null when there's no valid comparison (oldValue is 0)
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number,
): number | null {
  if (oldValue === 0) return null; // No valid comparison when previous value is 0
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Period date range type
 */
export interface PeriodDateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get date range for a period filter
 */
export function getPeriodDateRange(
  period: string,
): PeriodDateRange | undefined {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "7":
      start.setDate(now.getDate() - 7);
      break;
    case "30":
      start.setDate(now.getDate() - 30);
      break;
    case "90":
      start.setDate(now.getDate() - 90);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "all":
      return undefined; // No filter
    default:
      start.setDate(now.getDate() - 30); // Default to 30 days
  }

  return {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
  };
}

/**
 * Calculate previous period date range
 */
export function getPreviousPeriodDateRange(
  period: PeriodDateRange,
): PeriodDateRange {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);

  const periodDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - periodDays);

  return {
    startDate: previousStart.toISOString(),
    endDate: start.toISOString(),
  };
}

/**
 * Stats with comparison interface
 */
export interface StatsWithComparison {
  current: TransactionStats;
  previous: TransactionStats;
  comparison: {
    totalSpentChange: number | null;
    transactionCountChange: number | null;
    averageChange: number | null;
  };
}

/**
 * Calculate stats with period comparison
 */
export function calculateStatsWithComparison(
  currentTransactions: TTransaction[],
  previousTransactions: TTransaction[],
): StatsWithComparison {
  const current = calculateTransactionStats(currentTransactions);
  const previous = calculateTransactionStats(previousTransactions);

  return {
    current,
    previous,
    comparison: {
      totalSpentChange: calculatePercentageChange(
        previous.totalSpent,
        current.totalSpent,
      ),
      transactionCountChange: calculatePercentageChange(
        previous.transactionCount,
        current.transactionCount,
      ),
      averageChange: calculatePercentageChange(
        previous.averageTransaction,
        current.averageTransaction,
      ),
    },
  };
}
