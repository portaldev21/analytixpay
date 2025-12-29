"use client";

import { motion } from "framer-motion";
import { TrendingDown, Wallet, Calendar, AlertTriangle } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import type { TBudgetForecast } from "@/db/types";

interface BudgetImpactCardProps {
  forecast: TBudgetForecast;
  className?: string;
}

export function BudgetImpactCard({ forecast, className }: BudgetImpactCardProps) {
  const { budget_config, budget_impact } = forecast;
  const hasConfig = budget_config !== null;

  // Determine commitment level for color coding
  const commitmentLevel =
    budget_impact.commitment_percentage < 30
      ? "low"
      : budget_impact.commitment_percentage < 60
        ? "medium"
        : "high";

  const levelConfig = {
    low: {
      color: "text-[var(--color-positive)]",
      bgColor: "bg-[var(--color-positive)]/10",
      borderColor: "border-[var(--color-positive)]/20",
      label: "Comprometimento Baixo",
      hoverGlow: "green" as const,
    },
    medium: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20",
      label: "Comprometimento Moderado",
      hoverGlow: "none" as const,
    },
    high: {
      color: "text-[var(--color-negative)]",
      bgColor: "bg-[var(--color-negative)]/10",
      borderColor: "border-[var(--color-negative)]/20",
      label: "Comprometimento Alto",
      hoverGlow: "none" as const,
    },
  };

  const config = levelConfig[commitmentLevel];

  if (!hasConfig) {
    return (
      <CardGlass variant="dark-1" size="lg" className={className}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 rounded-full bg-yellow-400/10 mb-4">
            <AlertTriangle className="size-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Configure seu orcamento
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            Para ver o impacto das parcelas no seu orcamento, primeiro configure
            um orcamento diario nas configuracoes.
          </p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass
      variant="dark-1"
      size="xl"
      interactive
      hoverGlow={config.hoverGlow}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Impacto das Parcelas no Orcamento
          </p>
          <div className="flex items-baseline gap-2">
            <motion.p
              className={cn("text-3xl font-bold tabular-nums", config.color)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {budget_impact.commitment_percentage.toFixed(1)}%
            </motion.p>
            <span className="text-sm text-[var(--color-text-muted)]">
              comprometido
            </span>
          </div>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            "bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20",
          )}
        >
          <TrendingDown className="size-6 text-[var(--color-primary-start)]" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-[var(--color-card-dark-3)] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              commitmentLevel === "high"
                ? "bg-gradient-to-r from-[var(--color-negative)] to-red-400"
                : commitmentLevel === "medium"
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-positive)]",
            )}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(budget_impact.commitment_percentage, 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Daily */}
        <div className="p-4 rounded-xl bg-[var(--color-card-dark-2)] border border-[var(--glass-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              Diario
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--color-text-muted)]">Base</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(budget_config.daily_base)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Disponivel</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                budget_impact.daily_available >= budget_config.daily_base * 0.5
                  ? "text-[var(--color-positive)]"
                  : budget_impact.daily_available >= 0
                    ? "text-yellow-400"
                    : "text-[var(--color-negative)]",
              )}
            >
              {formatCurrency(budget_impact.daily_available)}
            </p>
          </div>
        </div>

        {/* Weekly */}
        <div className="p-4 rounded-xl bg-[var(--color-card-dark-2)] border border-[var(--glass-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              Semanal
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--color-text-muted)]">Base</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(budget_config.weekly_budget)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Disponivel</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                budget_impact.weekly_available >= budget_config.weekly_budget * 0.5
                  ? "text-[var(--color-positive)]"
                  : budget_impact.weekly_available >= 0
                    ? "text-yellow-400"
                    : "text-[var(--color-negative)]",
              )}
            >
              {formatCurrency(budget_impact.weekly_available)}
            </p>
          </div>
        </div>

        {/* Monthly */}
        <div className="p-4 rounded-xl bg-[var(--color-card-dark-2)] border border-[var(--glass-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">
              Mensal
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--color-text-muted)]">Base</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(budget_config.monthly_budget)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">Disponivel</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                budget_impact.monthly_available >= budget_config.monthly_budget * 0.5
                  ? "text-[var(--color-positive)]"
                  : budget_impact.monthly_available >= 0
                    ? "text-yellow-400"
                    : "text-[var(--color-negative)]",
              )}
            >
              {formatCurrency(budget_impact.monthly_available)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)]">
              Media mensal em parcelas
            </span>
          </div>
          <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(budget_impact.avg_monthly_installments)}
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
          {config.label}
        </span>
      </div>
    </CardGlass>
  );
}
