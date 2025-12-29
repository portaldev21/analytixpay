"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationStatsProps {
  stats: {
    total_expenses: number;
    pending: number;
    matched: number;
    unmatched: number;
    manual: number;
    match_rate: number;
  };
}

export function ReconciliationStats({ stats }: ReconciliationStatsProps) {
  const statItems = [
    {
      label: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-[var(--color-warning)]",
      bg: "bg-[var(--color-warning)]/10",
    },
    {
      label: "Reconciliados",
      value: stats.matched,
      icon: CheckCircle2,
      color: "text-[var(--color-positive)]",
      bg: "bg-[var(--color-positive)]/10",
    },
    {
      label: "Sem match",
      value: stats.unmatched,
      icon: XCircle,
      color: "text-[var(--color-negative)]",
      bg: "bg-[var(--color-negative)]/10",
    },
    {
      label: "Manual",
      value: stats.manual,
      icon: FileEdit,
      color: "text-[var(--color-text-muted)]",
      bg: "bg-[var(--color-text-muted)]/10",
    },
  ];

  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Status de Reconciliacao
        </h3>
        <span className="text-sm text-[var(--color-text-muted)]">
          {stats.total_expenses} gastos registrados
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-text-muted)]">
            Taxa de reconciliacao
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {stats.match_rate}%
          </span>
        </div>
        <Progress
          value={stats.match_rate}
          className="h-2 bg-[var(--color-card-dark-2)]"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-card-dark-2)]/50"
          >
            <div className={cn("p-2 rounded-lg", item.bg)}>
              <item.icon className={cn("size-4", item.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {item.value}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CardGlass>
  );
}
