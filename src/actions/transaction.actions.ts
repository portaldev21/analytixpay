"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  hasAccessToAccount,
  requireAuth,
  requireAccountAccess,
} from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  calculateTransactionStats,
  calculateStatsWithComparison,
  filterTransactionsByDateRange,
  getPreviousPeriodDateRange,
  type PeriodDateRange,
  type StatsWithComparison,
} from "@/lib/analytics/stats";
import type {
  TApiResponse,
  TTransaction,
  TDashboardStats,
  TTransactionFilters,
} from "@/db/types";

/**
 * Get transactions for account
 */
export async function getTransactions(
  accountId: string,
  filters?: TTransactionFilters,
): Promise<TApiResponse<TTransaction[]>> {
  try {
    const supabase = await createClient();

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.search) {
      query = query.ilike("description", `%${filters.search}%`);
    }
    if (filters?.minAmount) {
      query = query.gte("amount", filters.minAmount);
    }
    if (filters?.maxAmount) {
      query = query.lte("amount", filters.maxAmount);
    }

    query = query.order("date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar transações",
      success: false,
    };
  }
}

/**
 * Get transaction stats for dashboard (with optional period filter)
 */
export async function getTransactionStats(
  accountId: string,
  period?: PeriodDateRange,
): Promise<
  TApiResponse<{
    totalSpent: number;
    averageTransaction: number;
    transactionCount: number;
    categoryBreakdown: {
      category: string;
      total: number;
      count: number;
      percentage: number;
    }[];
  }>
> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching transaction stats", { accountId, period });

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    // Apply period filter if provided
    if (period) {
      query = query.gte("date", period.startDate).lte("date", period.endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      logger.error("Failed to fetch transactions for stats", error, {
        accountId,
      });
      return { data: null, error: error.message, success: false };
    }

    // Use utility function for calculations
    const stats = calculateTransactionStats(transactions as TTransaction[]);

    const duration = Date.now() - startTime;
    logger.info("Transaction stats calculated", {
      accountId,
      duration,
      transactionCount: stats.transactionCount,
    });

    return { data: stats, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getTransactionStats", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar estatísticas",
      success: false,
    };
  }
}

/**
 * Get transaction stats with comparison to previous period
 * @param dateType - "purchase" filters by transaction date, "billing" filters by billing_date
 */
export async function getTransactionStatsWithComparison(
  accountId: string,
  period?: PeriodDateRange,
  dateType: "purchase" | "billing" = "billing",
): Promise<TApiResponse<StatsWithComparison>> {
  const startTime = Date.now();
  const dateField = dateType === "billing" ? "billing_date" : "date";

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching transaction stats with comparison", {
      accountId,
      period,
      dateType,
      dateField,
    });

    // Fetch current period transactions
    let currentQuery = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (period) {
      currentQuery = currentQuery
        .gte(dateField, period.startDate)
        .lte(dateField, period.endDate);
    }

    const { data: currentTransactions, error: currentError } =
      await currentQuery;

    if (currentError) {
      logger.error(
        "Failed to fetch current period transactions",
        currentError,
        {
          accountId,
        },
      );
      return { data: null, error: currentError.message, success: false };
    }

    // Calculate previous period and fetch transactions
    const previousPeriod = period
      ? getPreviousPeriodDateRange(period)
      : undefined;
    let previousTransactions: TTransaction[] = [];

    if (previousPeriod) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .gte(dateField, previousPeriod.startDate)
        .lte(dateField, previousPeriod.endDate);

      if (!error && data) {
        previousTransactions = data as TTransaction[];
      }
    }

    // Use utility function for calculations
    const comparison = calculateStatsWithComparison(
      currentTransactions as TTransaction[],
      previousTransactions,
    );

    const duration = Date.now() - startTime;
    logger.info("Stats with comparison calculated", {
      accountId,
      duration,
      currentCount: comparison.current.transactionCount,
      previousCount: comparison.previous.transactionCount,
    });

    return { data: comparison, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getTransactionStatsWithComparison", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar estatísticas",
      success: false,
    };
  }
}

/**
 * Get dashboard stats (complete)
 */
export async function getDashboardStats(
  accountId: string,
): Promise<TApiResponse<TDashboardStats>> {
  try {
    const supabase = await createClient();

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    // Type assertion
    const transactionList = (transactions || []) as TTransaction[];

    const totalAmount = transactionList.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const averageAmount =
      transactionList.length > 0 ? totalAmount / transactionList.length : 0;

    const largestTransaction =
      transactionList.length > 0
        ? transactionList.reduce((max, t) =>
            Number(t.amount) > Number(max.amount) ? t : max,
          )
        : null;

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    transactionList.forEach((t) => {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      categoryMap.set(t.category, {
        total: existing.total + Number(t.amount),
        count: existing.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, stats]) => ({
        category,
        total: stats.total,
        count: stats.count,
        percentage: totalAmount > 0 ? (stats.total / totalAmount) * 100 : 0,
      }),
    );

    // Monthly comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactionList.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthTransactions = transactionList.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      );
    });

    const currentMonthTotal = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const lastMonthTotal = lastMonthTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const percentageChange =
      lastMonthTotal > 0
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    const stats: TDashboardStats = {
      totalTransactions: transactionList.length,
      totalAmount,
      averageAmount,
      largestTransaction: largestTransaction
        ? {
            amount: Number(largestTransaction.amount),
            description: largestTransaction.description,
            date: largestTransaction.date,
          }
        : null,
      categoryBreakdown,
      monthlyComparison: {
        currentMonth: currentMonthTotal,
        lastMonth: lastMonthTotal,
        percentageChange,
      },
    };

    return { data: stats, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar estatísticas",
      success: false,
    };
  }
}

/**
 * Update transaction
 */
export async function updateTransaction(
  transactionId: string,
  accountId: string,
  updates: Partial<TTransaction>,
): Promise<TApiResponse<TTransaction>> {
  try {
    const supabase = await createClient();

    // Validate access to account
    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Type workaround for Supabase generated types
    const { data, error } = await (supabase.from("transactions") as any)
      .update(updates)
      .eq("id", transactionId)
      .eq("account_id", accountId) // Ensure transaction belongs to account
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { data, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar transação",
      success: false,
    };
  }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(
  transactionId: string,
): Promise<TApiResponse<{ success: true }>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { data: { success: true }, error: null, success: true };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao deletar transação",
      success: false,
    };
  }
}

/**
 * Get spending trends (monthly or weekly)
 * @param dateType - "purchase" filters by transaction date, "billing" filters by billing_date
 */
export async function getSpendingTrends(
  accountId: string,
  months: number = 6,
  period?: PeriodDateRange,
  dateType: "purchase" | "billing" = "billing",
): Promise<TApiResponse<{ month: string; total: number; count: number }[]>> {
  const startTime = Date.now();
  const dateField = dateType === "billing" ? "billing_date" : "date";

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching spending trends", { accountId, months, dateType });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    // Apply period filter or use default months
    if (period) {
      query = query.gte(dateField, period.startDate).lte(dateField, period.endDate);
    } else {
      query = query.gte(dateField, startDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      logger.error("Failed to fetch transactions for trends", error, {
        accountId,
      });
      return { data: null, error: error.message, success: false };
    }

    // Group by month using the selected date field
    const monthMap = new Map<string, { total: number; count: number }>();
    const transactionList = (transactions || []) as TTransaction[];

    for (const t of transactionList) {
      // Use billing_date if available and dateType is billing, otherwise use date
      const dateValue = dateType === "billing" && t.billing_date ? t.billing_date : t.date;
      const date = new Date(dateValue);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthMap.get(monthKey) || { total: 0, count: 0 };
      monthMap.set(monthKey, {
        total: existing.total + Number(t.amount),
        count: existing.count + 1,
      });
    }

    // Convert to array and sort by month
    const trends = Array.from(monthMap.entries())
      .map(([month, stats]) => ({
        month,
        total: stats.total,
        count: stats.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const duration = Date.now() - startTime;
    logger.info("Spending trends calculated", {
      accountId,
      duration,
      monthsCount: trends.length,
    });

    return { data: trends, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getSpendingTrends", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar tendências",
      success: false,
    };
  }
}

/**
 * Get top expenses
 * @param dateType - "purchase" filters by transaction date, "billing" filters by billing_date
 */
export async function getTopExpenses(
  accountId: string,
  limit: number = 5,
  period?: PeriodDateRange,
  dateType: "purchase" | "billing" = "billing",
): Promise<TApiResponse<TTransaction[]>> {
  const startTime = Date.now();
  const dateField = dateType === "billing" ? "billing_date" : "date";

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching top expenses", { accountId, limit, dateType });

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    // Apply period filter if provided
    if (period) {
      query = query.gte(dateField, period.startDate).lte(dateField, period.endDate);
    }

    query = query.order("amount", { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      logger.error("Failed to fetch top expenses", error, { accountId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Top expenses fetched", {
      accountId,
      duration,
      count: data?.length || 0,
    });

    return { data: data || [], error: null, success: true };
  } catch (error) {
    logger.error("Exception in getTopExpenses", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar maiores gastos",
      success: false,
    };
  }
}
