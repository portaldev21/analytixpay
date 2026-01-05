"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getCategoryColor, cn } from "@/lib/utils";
import type { TTransaction } from "@/db/types";
import { TrendingUp } from "lucide-react";

interface TopExpensesTableProps {
  data: TTransaction[];
  limit?: number;
}

export function TopExpensesTable({ data, limit = 10 }: TopExpensesTableProps) {
  const expenses = data.slice(0, limit);

  if (expenses.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Maiores Gastos
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Top {limit} maiores transacoes do periodo
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[150px] text-[var(--color-text-muted)]">
          <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhuma transacao encontrada</p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Maiores Gastos
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Top {limit} maiores transacoes do periodo
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
        {expenses.map((transaction, index) => {
          const categoryColor = getCategoryColor(transaction.category);

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              {/* Rank */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                  index < 3
                    ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
                )}
              >
                {index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--color-text-primary)] truncate">
                  {transaction.description}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: categoryColor,
                      color: categoryColor,
                    }}
                  >
                    {transaction.category}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(transaction.date)}
                  </span>
                  {transaction.installment && (
                    <Badge variant="info" className="text-xs">
                      {transaction.installment}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="font-bold text-[var(--color-text-primary)] text-right tabular-nums">
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </CardGlass>
  );
}
