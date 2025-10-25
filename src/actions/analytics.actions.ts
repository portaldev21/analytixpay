"use server";

import { requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  detectRecurringTransactions,
  type RecurringTransaction,
} from "@/lib/analytics/recurring";
import { generateInsights, type Insight } from "@/lib/analytics/insights";
import {
  calculateHealthScore,
  type HealthScore,
} from "@/lib/analytics/health-score";
import {
  calculateTransactionStats,
  type PeriodDateRange,
} from "@/lib/analytics/stats";
import type { TApiResponse, TTransaction } from "@/db/types";

/**
 * Get recurring transactions for account
 */
export async function getRecurringTransactions(
  accountId: string,
): Promise<TApiResponse<RecurringTransaction[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Detecting recurring transactions", { accountId });

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("date", { ascending: true });

    if (error) {
      logger.error(
        "Failed to fetch transactions for recurring detection",
        error,
        {
          accountId,
        },
      );
      return { data: null, error: error.message, success: false };
    }

    const recurring = detectRecurringTransactions(
      transactions as TTransaction[],
    );

    const duration = Date.now() - startTime;
    logger.info("Recurring transactions detected", {
      accountId,
      duration,
      recurringCount: recurring.length,
    });

    return { data: recurring, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getRecurringTransactions", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao detectar recorrências",
      success: false,
    };
  }
}

/**
 * Get smart insights for account
 */
export async function getSmartInsights(
  accountId: string,
  period?: PeriodDateRange,
  previousPeriod?: PeriodDateRange,
): Promise<TApiResponse<Insight[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Generating smart insights", { accountId });

    // Fetch current period transactions
    let currentQuery = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (period) {
      currentQuery = currentQuery
        .gte("date", period.startDate)
        .lte("date", period.endDate);
    }

    const { data: currentTransactions, error: currentError } =
      await currentQuery;

    if (currentError) {
      logger.error(
        "Failed to fetch current transactions for insights",
        currentError,
        {
          accountId,
        },
      );
      return { data: null, error: currentError.message, success: false };
    }

    // Calculate current stats
    const stats = calculateTransactionStats(
      currentTransactions as TTransaction[],
    );

    // Fetch previous period stats if available
    let previousStats: ReturnType<typeof calculateTransactionStats> | undefined;
    if (previousPeriod) {
      const { data: prevTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .gte("date", previousPeriod.startDate)
        .lte("date", previousPeriod.endDate);

      if (prevTransactions) {
        previousStats = calculateTransactionStats(
          prevTransactions as TTransaction[],
        );
      }
    }

    // Get recurring transactions
    const { data: recurring } = await getRecurringTransactions(accountId);

    // Generate insights
    const insights = generateInsights(
      stats,
      previousStats,
      recurring ?? undefined,
    );

    const duration = Date.now() - startTime;
    logger.info("Smart insights generated", {
      accountId,
      duration,
      insightCount: insights.length,
    });

    return { data: insights, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getSmartInsights", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao gerar insights",
      success: false,
    };
  }
}

/**
 * Get financial health score for account
 */
export async function getFinancialHealthScore(
  accountId: string,
  budget?: number,
  period?: PeriodDateRange,
  previousPeriod?: PeriodDateRange,
): Promise<TApiResponse<HealthScore>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Calculating health score", { accountId, budget });

    // Fetch current period transactions
    let currentQuery = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (period) {
      currentQuery = currentQuery
        .gte("date", period.startDate)
        .lte("date", period.endDate);
    }

    const { data: currentTransactions, error: currentError } =
      await currentQuery;

    if (currentError) {
      logger.error(
        "Failed to fetch current transactions for health score",
        currentError,
        {
          accountId,
        },
      );
      return { data: null, error: currentError.message, success: false };
    }

    // Calculate current stats
    const stats = calculateTransactionStats(
      currentTransactions as TTransaction[],
    );

    // Fetch previous period stats if available
    let previousStats: ReturnType<typeof calculateTransactionStats> | undefined;
    if (previousPeriod) {
      const { data: prevTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .gte("date", previousPeriod.startDate)
        .lte("date", previousPeriod.endDate);

      if (prevTransactions) {
        previousStats = calculateTransactionStats(
          prevTransactions as TTransaction[],
        );
      }
    }

    // Calculate health score
    const healthScore = calculateHealthScore(stats, budget, previousStats);

    const duration = Date.now() - startTime;
    logger.info("Health score calculated", {
      accountId,
      duration,
      score: healthScore.score,
      grade: healthScore.grade,
    });

    return { data: healthScore, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getFinancialHealthScore", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao calcular score de saúde",
      success: false,
    };
  }
}
