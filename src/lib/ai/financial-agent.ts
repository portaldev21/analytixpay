import type { SupabaseClient } from "@supabase/supabase-js";
import type { TFinancialContext, TTransaction } from "@/db/types";
import { calculateTransactionStats } from "@/lib/analytics/stats";
import {
  calculateHealthScore,
  type HealthScore,
} from "@/lib/analytics/health-score";
import {
  detectRecurringTransactions,
  type RecurringTransaction,
} from "@/lib/analytics/recurring";
import { logger } from "@/lib/logger";

export interface PeriodDateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get default period (current month)
 */
export function getDefaultPeriod(): PeriodDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

/**
 * Get previous period (previous month)
 */
export function getPreviousPeriod(period: PeriodDateRange): PeriodDateRange {
  const start = new Date(period.startDate);
  const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);

  return {
    startDate: prevStart.toISOString().split("T")[0],
    endDate: prevEnd.toISOString().split("T")[0],
  };
}

/**
 * Fetch transactions for a period
 */
async function fetchTransactions(
  supabase: SupabaseClient,
  accountId: string,
  period?: PeriodDateRange,
): Promise<TTransaction[]> {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("account_id", accountId);

  if (period) {
    query = query.gte("date", period.startDate).lte("date", period.endDate);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to fetch transactions for context", error, {
      accountId,
    });
    return [];
  }

  return (data as TTransaction[]) || [];
}

/**
 * Fetch all transactions for recurring detection
 */
async function fetchAllTransactions(
  supabase: SupabaseClient,
  accountId: string,
): Promise<TTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .order("date", { ascending: true });

  if (error) {
    logger.error("Failed to fetch all transactions", error, { accountId });
    return [];
  }

  return (data as TTransaction[]) || [];
}

/**
 * Build financial context for AI agent
 */
export async function buildFinancialContext(
  supabase: SupabaseClient,
  accountId: string,
  period?: PeriodDateRange,
): Promise<TFinancialContext> {
  const startTime = Date.now();
  const currentPeriod = period || getDefaultPeriod();
  const previousPeriod = getPreviousPeriod(currentPeriod);

  logger.info("Building financial context", {
    accountId,
    period: currentPeriod,
  });

  // Fetch data in parallel
  const [currentTransactions, previousTransactions, allTransactions] =
    await Promise.all([
      fetchTransactions(supabase, accountId, currentPeriod),
      fetchTransactions(supabase, accountId, previousPeriod),
      fetchAllTransactions(supabase, accountId),
    ]);

  // Calculate stats for current period
  const currentStats = calculateTransactionStats(currentTransactions);
  const previousStats = calculateTransactionStats(previousTransactions);

  // Calculate health score
  const healthScore: HealthScore = calculateHealthScore(
    currentStats,
    undefined,
    previousStats,
  );

  // Detect recurring transactions
  const recurring: RecurringTransaction[] =
    detectRecurringTransactions(allTransactions);

  // Calculate days in period
  const startDate = new Date(currentPeriod.startDate);
  const endDate = new Date(currentPeriod.endDate);
  const daysInPeriod = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );

  // Calculate comparison
  const percentageChange =
    previousStats.totalSpent > 0
      ? ((currentStats.totalSpent - previousStats.totalSpent) /
          previousStats.totalSpent) *
        100
      : 0;

  // Get top expenses
  const topExpenses = [...currentTransactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((t) => ({
      description: t.description,
      amount: t.amount,
      date: t.date,
      category: t.category,
    }));

  // Build context
  const context: TFinancialContext = {
    period: {
      startDate: currentPeriod.startDate,
      endDate: currentPeriod.endDate,
    },
    stats: {
      totalSpent: currentStats.totalSpent,
      transactionCount: currentStats.transactionCount,
      averageTransaction: currentStats.averageTransaction,
      dailyAverage: currentStats.totalSpent / daysInPeriod,
    },
    categoryBreakdown: currentStats.categoryBreakdown.map((c) => ({
      category: c.category,
      total: c.total,
      percentage: c.percentage,
    })),
    comparison: {
      previousPeriodTotal: previousStats.totalSpent,
      percentageChange,
    },
    topExpenses,
    recurring: recurring.slice(0, 10).map((r) => ({
      description: r.description,
      amount: r.averageAmount,
      frequency: r.frequency,
    })),
    healthScore: {
      score: healthScore.score,
      grade: healthScore.grade,
      recommendations: healthScore.recommendations,
    },
  };

  const duration = Date.now() - startTime;
  logger.info("Financial context built", {
    accountId,
    duration,
    transactionCount: currentStats.transactionCount,
    totalSpent: currentStats.totalSpent,
  });

  return context;
}

/**
 * Format context for logging (abbreviated version)
 */
export function formatContextForLog(context: TFinancialContext): string {
  return `Period: ${context.period.startDate} to ${context.period.endDate}, Total: R$ ${context.stats.totalSpent.toFixed(2)}, Transactions: ${context.stats.transactionCount}, Score: ${context.healthScore.score}`;
}
