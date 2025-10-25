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

// Opt into dynamic rendering for real-time data
export const dynamic = "force-dynamic";

interface SearchParams {
  period?: string;
}

/**
 * Dashboard stats component with comparison
 */
async function DashboardStats({
  accountId,
  period,
  previousPeriod,
}: {
  accountId: string;
  period?: { startDate: string; endDate: string };
  previousPeriod?: { startDate: string; endDate: string };
}) {
  const statsResult = await getTransactionStatsWithComparison(
    accountId,
    period,
  );

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Erro ao carregar estatísticas
      </div>
    );
  }

  const { current, comparison } = statsResult.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Gasto Total"
        value={formatCurrency(current.totalSpent)}
        icon={DollarSign}
        description="Total gasto no período"
        trend={{
          value: Math.abs(comparison.totalSpentChange),
          isPositive: comparison.totalSpentChange < 0, // Negative spending = good
        }}
      />
      <StatsCard
        title="Média por Transação"
        value={formatCurrency(current.averageTransaction)}
        icon={TrendingUp}
        description="Valor médio das compras"
        trend={{
          value: Math.abs(comparison.averageChange),
          isPositive: comparison.averageChange < 0,
        }}
      />
      <StatsCard
        title="Total de Transações"
        value={current.transactionCount}
        icon={ShoppingCart}
        description="Compras realizadas"
        trend={{
          value: Math.abs(comparison.transactionCountChange),
          isPositive: comparison.transactionCountChange > 0,
        }}
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
 * Dashboard charts and visualizations
 */
async function DashboardCharts({
  accountId,
  period,
}: {
  accountId: string;
  period?: { startDate: string; endDate: string };
}) {
  const [trendsResult, statsResult, invoicesResult, topExpensesResult] =
    await Promise.all([
      getSpendingTrends(accountId, 6, period),
      getTransactionStatsWithComparison(accountId, period),
      getInvoicesSummary(accountId),
      getTopExpenses(accountId, 5, period),
    ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {trendsResult.success &&
        trendsResult.data &&
        trendsResult.data.length > 0 && (
          <div className="lg:col-span-2">
            <SpendingTrendsChart data={trendsResult.data} />
          </div>
        )}

      {statsResult.success && statsResult.data && (
        <CategoryBreakdownChart
          data={statsResult.data.current.categoryBreakdown}
        />
      )}

      {topExpensesResult.success &&
        topExpensesResult.data &&
        topExpensesResult.data.length > 0 && (
          <TopExpenses data={topExpensesResult.data} />
        )}

      {invoicesResult.success &&
        invoicesResult.data &&
        invoicesResult.data.length > 0 && (
          <div className="lg:col-span-2">
            <InvoicesSummary data={invoicesResult.data} />
          </div>
        )}
    </div>
  );
}

/**
 * Advanced analytics section
 */
async function AdvancedAnalytics({
  accountId,
  period,
  previousPeriod,
}: {
  accountId: string;
  period?: { startDate: string; endDate: string };
  previousPeriod?: { startDate: string; endDate: string };
}) {
  const [recurringResult, insightsResult, healthScoreResult] =
    await Promise.all([
      getRecurringTransactions(accountId),
      getSmartInsights(accountId, period, previousPeriod),
      getFinancialHealthScore(accountId, undefined, period, previousPeriod),
    ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {insightsResult.success && insightsResult.data && (
        <div className="lg:col-span-2">
          <InsightsPanel insights={insightsResult.data} />
        </div>
      )}

      {recurringResult.success &&
        recurringResult.data &&
        recurringResult.data.length > 0 && (
          <div className="lg:col-span-2">
            <RecurringExpenses data={recurringResult.data} />
          </div>
        )}

      {healthScoreResult.success && healthScoreResult.data && (
        <HealthScoreCard data={healthScoreResult.data} />
      )}
    </div>
  );
}

/**
 * Main dashboard page
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
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

  const accountId = accountMember?.account_id;

  if (!accountId) {
    return <EmptyDashboard />;
  }

  // Calculate date range from period filter
  const period = searchParams.period || "30";
  const dateFilter = getPeriodDateRange(period);
  const previousDateFilter = dateFilter
    ? getPreviousPeriodDateRange(dateFilter)
    : undefined;

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

      {/* Stats cards with comparison */}
      <Suspense fallback={<StatsCardSkeleton />}>
        <DashboardStats
          accountId={accountId}
          period={dateFilter}
          previousPeriod={previousDateFilter}
        />
      </Suspense>

      {/* Main charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardCharts accountId={accountId} period={dateFilter} />
      </Suspense>

      {/* Advanced analytics */}
      <Suspense fallback={<ListSkeleton />}>
        <AdvancedAnalytics
          accountId={accountId}
          period={dateFilter}
          previousPeriod={previousDateFilter}
        />
      </Suspense>
    </div>
  );
}
