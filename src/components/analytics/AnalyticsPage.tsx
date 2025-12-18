"use client";

import { useMemo } from "react";
import { AnalyticsKPIs } from "./AnalyticsKPIs";
import { ExpenseHeatmap } from "./ExpenseHeatmap";
import { SpendingByCardChart } from "./SpendingByCardChart";
import { InstallmentsTable } from "./InstallmentsTable";
import { TopExpensesTable } from "./TopExpensesTable";
import { ChatContainer } from "./ai-chat/ChatContainer";
import { SpendingTrendsChart } from "@/components/dashboard/SpendingTrendsChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { RecurringExpenses } from "@/components/dashboard/RecurringExpenses";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import type {
  TDailySpending,
  TSpendingByCard,
  TInstallmentProjection,
  TTransaction,
} from "@/db/types";
import type { HealthScore } from "@/lib/analytics/health-score";
import type { Insight } from "@/lib/analytics/insights";
import type { RecurringTransaction } from "@/lib/analytics/recurring";

interface AnalyticsPageProps {
  accountId: string;
  // KPIs
  totalSpent: number;
  previousTotal: number;
  percentageChange: number;
  dailyAverage: number;
  largestExpense: { amount: number; description: string } | null;
  transactionCount: number;
  // Charts data
  dailySpending: TDailySpending[];
  spendingByCard: TSpendingByCard[];
  categoryBreakdown: { category: string; total: number; count: number }[];
  monthlyTrends: { month: string; total: number; count: number }[];
  // Tables data
  installments: TInstallmentProjection[];
  topTransactions: TTransaction[];
  recurring: RecurringTransaction[];
  // Health & Insights
  healthScore: HealthScore;
  insights: Insight[];
}

export function AnalyticsPage({
  accountId,
  totalSpent,
  previousTotal,
  percentageChange,
  dailyAverage,
  largestExpense,
  transactionCount,
  dailySpending,
  spendingByCard,
  categoryBreakdown,
  monthlyTrends,
  installments,
  topTransactions,
  recurring,
  healthScore,
  insights,
}: AnalyticsPageProps) {
  // Calculate percentage for category breakdown
  const categoryBreakdownWithPercentage = useMemo(() => {
    const total = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);
    return categoryBreakdown.map((cat) => ({
      ...cat,
      percentage: total > 0 ? (cat.total / total) * 100 : 0,
    }));
  }, [categoryBreakdown]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Analise detalhada dos seus gastos com inteligencia artificial
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* KPIs */}
      <AnalyticsKPIs
        totalSpent={totalSpent}
        previousTotal={previousTotal}
        percentageChange={percentageChange}
        dailyAverage={dailyAverage}
        largestExpense={largestExpense}
        transactionCount={transactionCount}
      />

      {/* Main Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingTrendsChart data={monthlyTrends} />
        <CategoryBreakdownChart data={categoryBreakdownWithPercentage} />
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingByCardChart data={spendingByCard} />
        <HealthScoreCard data={healthScore} />
      </div>

      {/* Heatmap */}
      <ExpenseHeatmap data={dailySpending} />

      {/* Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopExpensesTable data={topTransactions} limit={10} />
        <InstallmentsTable data={installments} />
      </div>

      {/* Recurring & Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecurringExpenses data={recurring} />
        <InsightsPanel insights={insights} />
      </div>

      {/* AI Chat */}
      <div className="grid gap-6 lg:grid-cols-1">
        <ChatContainer accountId={accountId} />
      </div>
    </div>
  );
}
