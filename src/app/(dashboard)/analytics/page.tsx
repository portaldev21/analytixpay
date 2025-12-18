import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getTransactionStatsWithComparison,
  getSpendingTrends,
} from "@/actions/transaction.actions";
import {
  getRecurringTransactions,
  getSmartInsights,
  getFinancialHealthScore,
  getDailySpending,
  getSpendingByCard,
  getInstallmentsProjection,
  getTopTransactions,
} from "@/actions/analytics.actions";
import {
  getPeriodDateRange,
  getPreviousPeriodDateRange,
} from "@/lib/analytics/stats";
import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";

// Opt into dynamic rendering for real-time data
export const dynamic = "force-dynamic";

interface SearchParams {
  period?: string;
  dateType?: "purchase" | "billing";
}

export default async function AnalyticsServerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's primary account
  const { data: accountMember } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  const accountId = (accountMember as { account_id: string } | null)
    ?.account_id;

  if (!accountId) {
    redirect("/dashboard");
  }

  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // Calculate date range from period filter
  const period = params.period || "30";
  const dateType = params.dateType || "billing";
  const dateFilter = getPeriodDateRange(period);
  const previousDateFilter = dateFilter
    ? getPreviousPeriodDateRange(dateFilter)
    : undefined;

  // Fetch ALL data in parallel
  const [
    statsResult,
    trendsResult,
    dailySpendingResult,
    spendingByCardResult,
    installmentsResult,
    topTransactionsResult,
    recurringResult,
    insightsResult,
    healthScoreResult,
  ] = await Promise.all([
    getTransactionStatsWithComparison(accountId, dateFilter, dateType),
    getSpendingTrends(accountId, 12, dateFilter, dateType),
    getDailySpending(accountId, dateFilter),
    getSpendingByCard(accountId, dateFilter),
    getInstallmentsProjection(accountId),
    getTopTransactions(accountId, 10, dateFilter),
    getRecurringTransactions(accountId),
    getSmartInsights(accountId, dateFilter, previousDateFilter),
    getFinancialHealthScore(
      accountId,
      undefined,
      dateFilter,
      previousDateFilter,
    ),
  ]);

  // Extract data with defaults
  const stats = statsResult.success ? statsResult.data : null;
  const trends = trendsResult.success ? trendsResult.data : [];
  const dailySpending = dailySpendingResult.success
    ? dailySpendingResult.data
    : [];
  const spendingByCard = spendingByCardResult.success
    ? spendingByCardResult.data
    : [];
  const installments = installmentsResult.success
    ? installmentsResult.data
    : [];
  const topTransactions = topTransactionsResult.success
    ? topTransactionsResult.data
    : [];
  const recurring = recurringResult.success ? recurringResult.data : [];
  const insights = insightsResult.success ? insightsResult.data : [];
  const defaultHealthScore = {
    score: 0,
    grade: "F" as const,
    recommendations: [
      "Adicione transacoes para calcular seu score financeiro",
    ] as string[],
    factors: {
      budgetAdherence: 0,
      savingsRate: 0,
      spendingTrend: 0,
      diversification: 0,
    },
  };
  const healthScore =
    healthScoreResult.success && healthScoreResult.data
      ? healthScoreResult.data
      : defaultHealthScore;

  // Calculate KPI values
  const totalSpent = stats?.current.totalSpent || 0;
  const previousTotal = stats?.previous.totalSpent || 0;
  const percentageChange = stats?.comparison.totalSpentChange || 0;

  // Calculate days in period
  const daysInPeriod = dateFilter
    ? Math.max(
        1,
        Math.ceil(
          (new Date(dateFilter.endDate).getTime() -
            new Date(dateFilter.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      )
    : 30;
  const dailyAverage = totalSpent / daysInPeriod;

  // Find largest expense
  const largestExpense =
    topTransactions && topTransactions.length > 0
      ? {
          amount: topTransactions[0].amount,
          description: topTransactions[0].description,
        }
      : null;

  const transactionCount = stats?.current.transactionCount || 0;

  return (
    <AnalyticsPage
      accountId={accountId}
      totalSpent={totalSpent}
      previousTotal={previousTotal}
      percentageChange={percentageChange}
      dailyAverage={dailyAverage}
      largestExpense={largestExpense}
      transactionCount={transactionCount}
      dailySpending={dailySpending || []}
      spendingByCard={spendingByCard || []}
      categoryBreakdown={stats?.current.categoryBreakdown || []}
      monthlyTrends={trends || []}
      installments={installments || []}
      topTransactions={topTransactions || []}
      recurring={recurring || []}
      healthScore={healthScore}
      insights={insights || []}
    />
  );
}
