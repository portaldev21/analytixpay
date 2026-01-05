"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import type { TWeekSummary } from "@/db/types";

interface WeekSummaryCardProps {
  data: TWeekSummary;
  className?: string;
}

export function WeekSummaryCard({ data, className }: WeekSummaryCardProps) {
  const progressPercent = (data.total_spent / data.total_budget) * 100;
  const daysCompleted = data.daily_records.length;
  const currentDayOfWeek = new Date().getDay();
  const isPositiveBalance = data.cycle.accumulated_balance >= 0;

  // Format dates for display
  const startDate = new Date(data.cycle.start_date);
  const endDate = new Date(data.cycle.end_date);
  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <CardGlass variant="default" size="lg" interactive className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Resumo da Semana
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-surface-muted)]">
          <Calendar className="size-5 text-[var(--color-text-muted)]" />
        </div>
      </div>

      {/* Week days indicator */}
      <div className="flex gap-1 mb-4">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => {
          const isCompleted = data.daily_records.some((r) => {
            const recordDate = new Date(r.record_date);
            return recordDate.getDay() === index;
          });
          const isToday = index === currentDayOfWeek;

          return (
            <div
              key={`${day}-${index}`}
              className={cn(
                "flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
                isToday
                  ? "bg-[var(--color-primary)] text-white"
                  : isCompleted
                    ? "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Budget progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-muted)]">Orcamento semanal</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.total_budget)}
          </span>
        </div>

        <div className="h-2 bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              progressPercent > 100
                ? "bg-gradient-to-r from-[var(--color-negative)] to-red-400"
                : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-positive)]",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--color-text-muted)]">Gasto ate agora</span>
          <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.total_spent)}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--color-border-light)]">
        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Saldo acumulado</p>
          <div className="flex items-center gap-1">
            {isPositiveBalance ? (
              <TrendingUp className="size-4 text-[var(--color-positive)]" />
            ) : (
              <TrendingDown className="size-4 text-[var(--color-negative)]" />
            )}
            <span
              className={cn(
                "font-semibold tabular-nums",
                isPositiveBalance
                  ? "text-[var(--color-positive)]"
                  : "text-[var(--color-negative)]",
              )}
            >
              {isPositiveBalance ? "+" : ""}
              {formatCurrency(data.cycle.accumulated_balance)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Media diaria</p>
          <p className="font-semibold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.average_daily_spent)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Dias no orcamento</p>
          <div className="flex items-center gap-1">
            <CheckCircle className="size-4 text-[var(--color-positive)]" />
            <span className="font-semibold text-[var(--color-positive)]">
              {data.days_under_budget}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Dias acima</p>
          <div className="flex items-center gap-1">
            <XCircle className="size-4 text-[var(--color-negative)]" />
            <span className="font-semibold text-[var(--color-negative)]">
              {data.days_over_budget}
            </span>
          </div>
        </div>
      </div>
    </CardGlass>
  );
}
