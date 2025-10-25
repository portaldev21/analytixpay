"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/transactions/CategoryBadge";
import { TrendingUp } from "lucide-react";
import type { TTransaction } from "@/db/types";

interface TopExpensesProps {
  data: TTransaction[];
}

export function TopExpenses({ data }: TopExpensesProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Maiores Gastos</h3>
        <p className="text-sm text-muted-foreground">
          Top 5 transações de maior valor
        </p>
      </div>

      <div className="space-y-3">
        {data.map((transaction, index) => (
          <div
            key={transaction.id}
            className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {transaction.description}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </span>
                  <CategoryBadge category={transaction.category} />
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-semibold text-lg">
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
