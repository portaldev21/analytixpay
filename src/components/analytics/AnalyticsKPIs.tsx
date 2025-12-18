"use client";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Receipt,
} from "lucide-react";

interface AnalyticsKPIsProps {
  totalSpent: number;
  previousTotal: number;
  percentageChange: number;
  dailyAverage: number;
  largestExpense: {
    amount: number;
    description: string;
  } | null;
  transactionCount: number;
}

export function AnalyticsKPIs({
  totalSpent,
  previousTotal,
  percentageChange,
  dailyAverage,
  largestExpense,
  transactionCount,
}: AnalyticsKPIsProps) {
  const isIncrease = percentageChange >= 0;
  const TrendIcon = isIncrease ? TrendingUp : TrendingDown;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Spent */}
      <StatsCard
        title="Total do Periodo"
        value={formatCurrency(totalSpent)}
        description="Soma de todas as transacoes"
        icon={DollarSign}
      />

      {/* Comparison */}
      <StatsCard
        title="vs Periodo Anterior"
        value={`${isIncrease ? "+" : ""}${percentageChange.toFixed(1)}%`}
        description={`Anterior: ${formatCurrency(previousTotal)}`}
        icon={TrendIcon}
        trend={
          percentageChange !== 0
            ? {
                value: Math.abs(percentageChange),
                isPositive: !isIncrease, // Lower spending is positive
              }
            : undefined
        }
      />

      {/* Daily Average */}
      <StatsCard
        title="Media Diaria"
        value={formatCurrency(dailyAverage)}
        description="Gasto medio por dia"
        icon={Calendar}
      />

      {/* Largest Expense */}
      <StatsCard
        title="Maior Gasto"
        value={largestExpense ? formatCurrency(largestExpense.amount) : "N/A"}
        description={
          largestExpense
            ? largestExpense.description.slice(0, 30) +
              (largestExpense.description.length > 30 ? "..." : "")
            : "Sem transacoes"
        }
        icon={CreditCard}
      />

      {/* Transaction Count */}
      <StatsCard
        title="Transacoes"
        value={transactionCount.toString()}
        description="Numero de transacoes"
        icon={Receipt}
      />
    </div>
  );
}
