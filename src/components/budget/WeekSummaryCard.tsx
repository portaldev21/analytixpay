"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import type { TWeekSummary } from "@/db/types";
import {
  calculateAvailablePerDay,
  calculateRunningAccumulated,
  formatDateToString,
  parseDateString,
} from "@/lib/budget/calculations";
import { cn, formatCurrency } from "@/lib/utils";

interface WeekSummaryCardProps {
  data: TWeekSummary;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
}

export function WeekSummaryCard({
  data,
  selectedDate,
  onSelectDate,
  className,
}: WeekSummaryCardProps) {
  const progressPercent = (data.total_spent / data.total_budget) * 100;
  const todayStr = formatDateToString(new Date());

  // Build array of all days in the cycle
  const cycleStart = parseDateString(data.cycle.start_date);
  const cycleEnd = parseDateString(data.cycle.end_date);
  const cycleDays: string[] = [];
  const current = new Date(cycleStart);
  while (current <= cycleEnd) {
    cycleDays.push(formatDateToString(current));
    current.setDate(current.getDate() + 1);
  }

  // Map daily records by date for quick lookup
  const recordsByDate = new Map(
    data.daily_records.map((r) => [r.record_date, r]),
  );

  // Sort records by date for accumulated calculation
  const sortedRecords = [...data.daily_records].sort((a, b) =>
    a.record_date.localeCompare(b.record_date),
  );

  // Calculate running accumulated
  const accumulatedValues = calculateRunningAccumulated(sortedRecords);
  const accumulatedByDate = new Map(
    sortedRecords.map((r, i) => [r.record_date, accumulatedValues[i]]),
  );

  // Day abbreviations in Portuguese (Sunday=0 to Saturday=6)
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Format dates for header
  const formatHeaderDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <CardGlass variant="default" size="lg" interactive className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Resumo da Semana
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatHeaderDate(cycleStart)} - {formatHeaderDate(cycleEnd)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-surface-muted)]">
          <Calendar className="size-5 text-[var(--color-text-muted)]" />
        </div>
      </div>

      {/* Clickable week day buttons */}
      <div className="flex gap-1 mb-4">
        {cycleDays.map((dateStr) => {
          const dayOfWeek = parseDateString(dateStr).getDay();
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasRecord = recordsByDate.has(dateStr);
          const isFuture = dateStr > todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDate?.(dateStr)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors relative",
                isSelected
                  ? "bg-[var(--color-primary)] text-white"
                  : isToday
                    ? "bg-[var(--color-surface-muted)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                    : hasRecord
                      ? "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]/80"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
                isFuture && "opacity-50 cursor-not-allowed",
                !isFuture && !isSelected && "cursor-pointer",
              )}
            >
              <span className="text-xs font-medium">
                {dayLabels[dayOfWeek]}
              </span>
              {hasRecord && !isSelected && (
                <span className="size-1 rounded-full bg-[var(--color-positive)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Budget progress bar */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-muted)]">
            Orcamento semanal
          </span>
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
          <span className="text-[var(--color-text-muted)]">
            Gasto ate agora
          </span>
          <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.total_spent)}
          </span>
        </div>
      </div>

      {/* Day-by-day accumulated table */}
      <div className="border-t border-[var(--color-border-light)] pt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left font-medium pb-2">Dia</th>
              <th className="text-right font-medium pb-2">Gasto</th>
              <th className="text-right font-medium pb-2">Disp/dia</th>
              <th className="text-right font-medium pb-2">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {cycleDays.map((dateStr) => {
              const record = recordsByDate.get(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isFuture = dateStr > todayStr;
              const accumulated = accumulatedByDate.get(dateStr);

              // For available per day calculation
              const lastKnownAccumulated =
                [...accumulatedByDate.values()].pop() ?? 0;
              const currentAccumulated = accumulated ?? lastKnownAccumulated;
              const daysLeft = cycleDays.filter((d) => d >= dateStr).length;
              const availPerDay =
                record || isFuture
                  ? calculateAvailablePerDay(
                      data.total_budget,
                      isFuture ? lastKnownAccumulated : currentAccumulated,
                      daysLeft,
                    )
                  : null;

              const dayDate = parseDateString(dateStr);
              const dayLabel = dayDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              });

              return (
                <tr
                  key={dateStr}
                  onClick={() => !isFuture && onSelectDate?.(dateStr)}
                  className={cn(
                    "border-b border-[var(--color-border-light)]/50 last:border-0",
                    isSelected && "bg-[var(--color-primary)]/10",
                    isToday && !isSelected && "bg-[var(--color-surface-muted)]",
                    !isFuture &&
                      "cursor-pointer hover:bg-[var(--color-surface-muted)]/50",
                    isFuture && "opacity-50",
                  )}
                >
                  <td
                    className={cn(
                      "py-1.5 text-left",
                      isToday && "font-semibold text-[var(--color-primary)]",
                    )}
                  >
                    {dayLabel}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 text-right tabular-nums",
                      record && record.total_spent > record.available_budget
                        ? "text-[var(--color-negative)]"
                        : record && record.total_spent > 0
                          ? "text-[var(--color-positive)]"
                          : "",
                    )}
                  >
                    {record && record.total_spent > 0
                      ? formatCurrency(record.total_spent)
                      : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {availPerDay != null ? formatCurrency(availPerDay) : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {accumulated != null ? formatCurrency(accumulated) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary row */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--color-border-light)] text-xs">
          <span className="text-[var(--color-text-muted)]">
            Total: {formatCurrency(data.total_spent)} | Media:{" "}
            {formatCurrency(data.average_daily_spent)}
          </span>
          <span
            className={cn(
              "font-semibold",
              data.cycle.accumulated_balance >= 0
                ? "text-[var(--color-positive)]"
                : "text-[var(--color-negative)]",
            )}
          >
            Saldo: {data.cycle.accumulated_balance >= 0 ? "+" : ""}
            {formatCurrency(data.cycle.accumulated_balance)}
          </span>
        </div>
      </div>
    </CardGlass>
  );
}
