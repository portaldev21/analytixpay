"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import type { TTodayBudgetResponse } from "@/db/types";

interface TodayBudgetCardProps {
  data: TTodayBudgetResponse;
  className?: string;
}

export function TodayBudgetCard({ data, className }: TodayBudgetCardProps) {
  const percentUsed = (data.total_spent_today / data.available_budget) * 100;
  const isOverBudget = data.total_spent_today > data.available_budget;

  const statusConfig = {
    above_base: {
      color: "text-[var(--color-positive)]",
      bgColor: "bg-[var(--color-positive)]/10",
      icon: TrendingUp,
      label: "Acima da base",
      hoverGlow: "green" as const,
    },
    at_base: {
      color: "text-[var(--color-primary-start)]",
      bgColor: "bg-[var(--color-primary-start)]/10",
      icon: Minus,
      label: "Na base",
      hoverGlow: "green" as const,
    },
    below_base: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      icon: TrendingDown,
      label: "Abaixo da base",
      hoverGlow: "none" as const,
    },
    critical: {
      color: "text-[var(--color-negative)]",
      bgColor: "bg-[var(--color-negative)]/10",
      icon: TrendingDown,
      label: "Critico",
      hoverGlow: "none" as const,
    },
  };

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <CardGlass
      variant="dark-1"
      size="xl"
      interactive
      hoverGlow={config.hoverGlow}
      className={className}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Hoje voce pode gastar
          </p>
          <motion.p
            className="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(data.available_budget)}
          </motion.p>
          {data.adjustment !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2",
                data.adjustment > 0 ? "text-[var(--color-positive)]" : "text-[var(--color-negative)]",
              )}
            >
              <StatusIcon className="size-4" />
              <span className="text-sm font-medium">
                {data.adjustment > 0 ? "+" : ""}
                {formatCurrency(data.adjustment)} vs base diaria
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "p-3 rounded-xl",
            "bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20",
          )}
        >
          <Wallet className="size-6 text-[var(--color-primary-start)]" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Gasto hoje</span>
          <span className="text-[var(--color-text-primary)] font-medium tabular-nums">
            {formatCurrency(data.total_spent_today)} / {formatCurrency(data.available_budget)}
          </span>
        </div>
        <div className="h-3 bg-[var(--color-card-dark-3)] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isOverBudget
                ? "bg-gradient-to-r from-[var(--color-negative)] to-red-400"
                : percentUsed > 80
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-positive)]",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentUsed, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Remaining */}
      <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">
            Restante para hoje
          </span>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              data.remaining_today >= 0
                ? "text-[var(--color-positive)]"
                : "text-[var(--color-negative)]",
            )}
          >
            {formatCurrency(data.remaining_today)}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
            config.bgColor,
            config.color,
          )}
        >
          <StatusIcon className="size-3.5" />
          {config.label}
        </span>
      </div>
    </CardGlass>
  );
}
