"use client";

import { Table } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import type { MonthProjection } from "@/lib/planning/calculations";
import { cn, formatCurrency } from "@/lib/utils";

interface ProjectionTableProps {
  projection: MonthProjection[];
  startMonth: string;
}

function formatMonthLabel(startMonth: string, monthIndex: number): string {
  const [yearStr, monthStr] = startMonth.split("-");
  const baseYear = Number.parseInt(yearStr, 10);
  const baseMonth = Number.parseInt(monthStr, 10) - 1; // 0-indexed

  const date = new Date(baseYear, baseMonth + monthIndex, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function ValueCell({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "tabular-nums text-sm font-medium",
        value > 0
          ? "text-[var(--color-positive)]"
          : value < 0
            ? "text-[var(--color-negative)]"
            : "text-[var(--color-text-muted)]",
      )}
    >
      {formatCurrency(value)}
    </span>
  );
}

export function ProjectionTable({
  projection,
  startMonth,
}: ProjectionTableProps) {
  if (projection.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="flex flex-col items-center justify-center h-[120px] text-[var(--color-text-muted)]">
          <Table className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma projecao disponivel</p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Projecao de Cenarios
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Resultado mensal e saldo acumulado por cenario
        </p>
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[var(--color-border-light)]">
              <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Mes
              </th>
              <th
                colSpan={2}
                className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]"
              >
                Atual
              </th>
              <th
                colSpan={2}
                className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-positive)]"
              >
                Otimista
              </th>
              <th
                colSpan={2}
                className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-negative)]"
              >
                Pessimista
              </th>
            </tr>
            <tr className="border-b border-[var(--color-border-light)]">
              <th className="px-5 py-1.5" />
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Resultado
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Saldo
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Resultado
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Saldo
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Resultado
              </th>
              <th className="px-3 py-1.5 text-center text-xs text-[var(--color-text-muted)]">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody>
            {projection.map((row) => (
              <tr
                key={row.monthIndex}
                className="border-b border-[var(--color-border-light)] last:border-b-0 hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                <td className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] whitespace-nowrap capitalize">
                  {formatMonthLabel(startMonth, row.monthIndex)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.current.result} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.current.cash} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.optimistic.result} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.optimistic.cash} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.pessimistic.result} />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <ValueCell value={row.pessimistic.cash} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardGlass>
  );
}
