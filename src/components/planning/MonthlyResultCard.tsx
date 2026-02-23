"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import type { MonthlyResult } from "@/lib/planning/calculations";
import { cn, formatCurrency } from "@/lib/utils";

interface MonthlyResultCardProps {
  result: MonthlyResult;
}

export function MonthlyResultCard({ result }: MonthlyResultCardProps) {
  const isPositive = result.result > 0;
  const isNeutral = result.result === 0;

  const ResultIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;

  return (
    <CardGlass variant="default" size="lg">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
        Resultado Mensal (Mes 1)
      </h3>

      <div className="space-y-3">
        {/* Income */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">
            Receita
          </span>
          <span className="text-sm font-semibold text-[var(--color-positive)] tabular-nums">
            {formatCurrency(result.income)}
          </span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">
            Despesas
          </span>
          <span className="text-sm font-semibold text-[var(--color-negative)] tabular-nums">
            {formatCurrency(result.expenses)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border-light)]" />

        {/* Result */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ResultIcon
              className={cn(
                "size-5",
                isPositive
                  ? "text-[var(--color-positive)]"
                  : isNeutral
                    ? "text-[var(--color-text-muted)]"
                    : "text-[var(--color-negative)]",
              )}
            />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Resultado
            </span>
          </div>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              isPositive
                ? "text-[var(--color-positive)]"
                : isNeutral
                  ? "text-[var(--color-text-muted)]"
                  : "text-[var(--color-negative)]",
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(result.result)}
          </span>
        </div>
      </div>
    </CardGlass>
  );
}
