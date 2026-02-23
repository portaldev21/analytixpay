"use client";

import { TrendingUp } from "lucide-react";
import {
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CardGlass } from "@/components/ui/card-glass";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { MonthProjection } from "@/lib/planning/calculations";
import { formatCurrency } from "@/lib/utils";

interface ProjectionChartProps {
  projection: MonthProjection[];
  startMonth: string;
}

function formatMonthShort(startMonth: string, monthIndex: number): string {
  const [yearStr, monthStr] = startMonth.split("-");
  const baseYear = Number.parseInt(yearStr, 10);
  const baseMonth = Number.parseInt(monthStr, 10) - 1;

  const date = new Date(baseYear, baseMonth + monthIndex, 1);
  const month = date.toLocaleDateString("pt-BR", { month: "short" });
  return month.replace(".", "");
}

type ChartDataPoint = {
  label: string;
  current: number;
  optimistic: number;
  pessimistic: number;
};

export function ProjectionChart({
  projection,
  startMonth,
}: ProjectionChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (projection.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="flex flex-col items-center justify-center h-[200px] text-[var(--color-text-muted)]">
          <TrendingUp className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma projecao disponivel</p>
        </div>
      </CardGlass>
    );
  }

  const chartData: ChartDataPoint[] = projection.map((row) => ({
    label: formatMonthShort(startMonth, row.monthIndex),
    current: row.current.cash,
    optimistic: row.optimistic.cash,
    pessimistic: row.pessimistic.cash,
  }));

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Evolucao do Saldo
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Saldo acumulado projetado por cenario
        </p>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="label"
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
          />
          <YAxis
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
            tickFormatter={(value) =>
              isMobile ? `${(value / 1000).toFixed(0)}k` : formatCurrency(value)
            }
            width={isMobile ? 50 : 100}
          />
          <ReferenceLine
            y={0}
            stroke="var(--color-border-light)"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]">
                    <div className="font-medium text-[var(--color-text-primary)] mb-2 capitalize">
                      {label}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
                          <span className="text-sm text-[var(--color-text-muted)]">
                            Atual
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[var(--color-primary)]">
                          {formatCurrency((payload[0]?.value as number) ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-positive)]" />
                          <span className="text-sm text-[var(--color-text-muted)]">
                            Otimista
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[var(--color-positive)]">
                          {formatCurrency((payload[1]?.value as number) ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-negative)]" />
                          <span className="text-sm text-[var(--color-text-muted)]">
                            Pessimista
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[var(--color-negative)]">
                          {formatCurrency((payload[2]?.value as number) ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                current: "Atual",
                optimistic: "Otimista",
                pessimistic: "Pessimista",
              };
              return (
                <span style={{ color: "var(--color-text-muted)" }}>
                  {labels[value] || value}
                </span>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-primary)" }}
            activeDot={{ r: 5 }}
            name="current"
          />
          <Line
            type="monotone"
            dataKey="optimistic"
            stroke="var(--color-positive)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-positive)" }}
            activeDot={{ r: 5 }}
            name="optimistic"
          />
          <Line
            type="monotone"
            dataKey="pessimistic"
            stroke="var(--color-negative)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-negative)" }}
            activeDot={{ r: 5 }}
            name="pessimistic"
          />
        </LineChart>
      </ResponsiveContainer>
    </CardGlass>
  );
}
