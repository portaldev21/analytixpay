import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getTransactionStatsWithComparison,
  getSpendingTrends,
  getTopExpenses,
} from "@/actions/transaction.actions";
import { getInvoicesSummary } from "@/actions/invoice.actions";
import {
  getRecurringTransactions,
  getSmartInsights,
  getFinancialHealthScore,
} from "@/actions/analytics.actions";
import {
  getPeriodDateRange,
  getPreviousPeriodDateRange,
  type StatsWithComparison,
} from "@/lib/analytics/stats";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SpendingTrendsChart } from "@/components/dashboard/SpendingTrendsChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { InvoicesSummary } from "@/components/dashboard/InvoicesSummary";
import { TopExpenses } from "@/components/dashboard/TopExpenses";
import { RecurringExpenses } from "@/components/dashboard/RecurringExpenses";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import {
  StatsCardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/dashboard/DashboardSkeleton";
import { formatCurrency } from "@/lib/utils";
import type { TTransaction } from "@/db/types";
import type { HealthScore } from "@/lib/analytics/health-score";
import type { Insight } from "@/lib/analytics/insights";
import type { RecurringTransaction } from "@/lib/analytics/recurring";

// Opt into dynamic rendering for real-time data
export const dynamic = "force-dynamic";

interface SearchParams {
  period?: string;
  dateType?: "purchase" | "billing";
}

/**
 * Dashboard stats cards - receives pre-fetched data
 */
function DashboardStatsCards({
  stats,
}: {
  stats: StatsWithComparison;
}) {
  const { current, comparison } = stats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Gasto Total"
        value={formatCurrency(current.totalSpent)}
        icon={DollarSign}
        description="Total gasto no período"
        trend={
          comparison.totalSpentChange !== null
            ? {
                value: comparison.totalSpentChange,
                isPositive: comparison.totalSpentChange < 0,
              }
            : undefined
        }
      />
      <StatsCard
        title="Média por Transação"
        value={formatCurrency(current.averageTransaction)}
        icon={TrendingUp}
        description="Valor médio das compras"
        trend={
          comparison.averageChange !== null
            ? {
                value: comparison.averageChange,
                isPositive: comparison.averageChange < 0,
              }
            : undefined
        }
      />
      <StatsCard
        title="Total de Transações"
        value={current.transactionCount}
        icon={ShoppingCart}
        description="Compras realizadas"
        trend={
          comparison.transactionCountChange !== null
            ? {
                value: comparison.transactionCountChange,
                isPositive: comparison.transactionCountChange > 0,
              }
            : undefined
        }
      />
      <StatsCard
        title="Categorias"
        value={current.categoryBreakdown.length}
        icon={CreditCard}
        description="Categorias diferentes"
      />
    </div>
  );
}

/**
 * Main dashboard page - fetches all data once
 */
export default async function DashboardPage({
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
    return <EmptyDashboard />;
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

  // Fetch ALL data in parallel (single batch)
  const [
    statsResult,
    trendsResult,
    topExpensesResult,
    invoicesResult,
    recurringResult,
    insightsResult,
    healthScoreResult,
  ] = await Promise.all([
    getTransactionStatsWithComparison(accountId, dateFilter, dateType),
    getSpendingTrends(accountId, 6, dateFilter, dateType),
    getTopExpenses(accountId, 5, dateFilter, dateType),
    getInvoicesSummary(accountId),
    getRecurringTransactions(accountId),
    getSmartInsights(accountId, dateFilter, previousDateFilter),
    getFinancialHealthScore(accountId, undefined, dateFilter, previousDateFilter),
  ]);

  // Extract data with defaults
  const stats = statsResult.success ? statsResult.data : null;
  const trends = trendsResult.success ? trendsResult.data : null;
  const topExpenses = topExpensesResult.success ? topExpensesResult.data : null;
  const invoices = invoicesResult.success ? invoicesResult.data : null;
  const recurring = recurringResult.success ? recurringResult.data : null;
  const insights = insightsResult.success ? insightsResult.data : null;
  const healthScore = healthScoreResult.success ? healthScoreResult.data : null;

  const hasTransactions = stats && stats.current.transactionCount > 0;

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral dos seus gastos e transações
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Stats cards */}
      {stats ? (
        <DashboardStatsCards stats={stats} />
      ) : (
        <div className="text-center text-muted-foreground p-8">
          Erro ao carregar estatísticas
        </div>
      )}

      {/* Main charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {trends && trends.length > 0 && (
          <div className="lg:col-span-2">
            <SpendingTrendsChart data={trends} />
          </div>
        )}

        {stats && (
          <CategoryBreakdownChart data={stats.current.categoryBreakdown} />
        )}

        {topExpenses && topExpenses.length > 0 && (
          <TopExpenses data={topExpenses} />
        )}

        {invoices && invoices.length > 0 && (
          <div className="lg:col-span-2">
            <InvoicesSummary data={invoices} />
          </div>
        )}
      </div>

      {/* Advanced analytics - only show if there are transactions */}
      {hasTransactions && (
        <div className="grid gap-6 lg:grid-cols-2">
          {insights && insights.length > 0 && (
            <div className="lg:col-span-2">
              <InsightsPanel insights={insights} />
            </div>
          )}

          {recurring && recurring.length > 0 && (
            <div className="lg:col-span-2">
              <RecurringExpenses data={recurring} />
            </div>
          )}

          {healthScore && <HealthScoreCard data={healthScore} />}
        </div>
      )}
    </div>
  );
}
