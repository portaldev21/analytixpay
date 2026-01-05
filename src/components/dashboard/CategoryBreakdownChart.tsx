"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface CategoryBreakdownChartProps {
  data: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = data.sort((a, b) => b.total - a.total).slice(0, 8);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Gastos por Categoria
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Distribuicao percentual dos gastos
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-[var(--color-surface-muted)]">
            <PieChartIcon className="size-8 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            Nenhuma transacao encontrada
          </p>
          <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">
            Faca upload de uma fatura para comecar
          </p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Gastos por Categoria
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Distribuicao percentual dos gastos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                label={({ payload }: { payload?: { percentage: number } }) =>
                  payload ? `${payload.percentage.toFixed(0)}%` : ""
                }
                labelLine={{
                  stroke: "var(--color-text-muted)",
                  strokeWidth: 1,
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.category}`}
                    fill={getCategoryColor(entry.category)}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="glass-card p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{
                              backgroundColor: getCategoryColor(item.category),
                            }}
                          />
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {item.category}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-lg font-bold text-[var(--color-primary)]">
                            {formatCurrency(item.total)}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {item.count} transacoes
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {item.percentage.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {chartData.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-muted)]/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="size-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                />
                <span className="text-sm text-[var(--color-text-secondary)] truncate">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                  {item.percentage.toFixed(0)}%
                </span>
                <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                  {formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardGlass>
  );
}
