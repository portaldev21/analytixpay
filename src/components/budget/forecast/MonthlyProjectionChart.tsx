"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { TMonthlyProjection } from "@/db/types";
import { CalendarDays } from "lucide-react";

interface MonthlyProjectionChartProps {
  data: TMonthlyProjection[];
  monthlyBudget?: number;
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez",
};

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  return `${MONTH_NAMES[month] || month}/${year.slice(2)}`;
}

export function MonthlyProjectionChart({
  data,
  monthlyBudget,
}: MonthlyProjectionChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (data.length === 0) {
    return (
      <CardGlass variant="dark-1" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Projecao Mensal de Parcelas
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Total de parcelas previstas por mes
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-[var(--color-text-muted)]">
          <CalendarDays className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhuma parcela ativa</p>
        </div>
      </CardGlass>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: formatMonthLabel(item.month),
  }));

  // Calculate max value for Y axis
  const maxValue = Math.max(
    ...data.map((d) => d.total_installments),
    monthlyBudget || 0,
  );

  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Projecao Mensal de Parcelas
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Total de parcelas previstas por mes
        </p>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
        <BarChart data={chartData}>
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
            domain={[0, maxValue * 1.1]}
          />
          {monthlyBudget && (
            <ReferenceLine
              y={monthlyBudget}
              stroke="var(--color-positive)"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Orcamento",
                position: "right",
                fill: "var(--color-positive)",
                fontSize: isMobile ? 10 : 12,
              }}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as TMonthlyProjection & {
                  label: string;
                };
                return (
                  <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-card-dark-1)] p-3 shadow-[var(--shadow-card)]">
                    <div className="font-medium text-[var(--color-text-primary)] mb-2">
                      {item.label}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[var(--color-text-muted)]">
                          Total
                        </span>
                        <span className="text-[var(--color-primary-start)] font-semibold tabular-nums">
                          {formatCurrency(item.total_installments)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[var(--color-text-muted)]">
                          Parcelas
                        </span>
                        <span className="text-[var(--color-text-primary)] tabular-nums">
                          {item.installment_count}
                        </span>
                      </div>
                      {item.details.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-[var(--glass-border)]">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">
                            Detalhes:
                          </p>
                          {item.details.slice(0, 3).map((detail, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-[var(--color-text-muted)] truncate"
                            >
                              {detail.description.slice(0, 20)}
                              {detail.description.length > 20 ? "..." : ""} -{" "}
                              {formatCurrency(detail.amount)}
                            </div>
                          ))}
                          {item.details.length > 3 && (
                            <div className="text-xs text-[var(--color-text-muted)]">
                              +{item.details.length - 3} mais
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total_installments" radius={[8, 8, 0, 0]}>
            {chartData.map((item, index) => {
              // Color based on whether it's within budget
              const isOverBudget =
                monthlyBudget && item.total_installments > monthlyBudget;
              const color = isOverBudget
                ? "var(--color-negative)"
                : "var(--color-primary-start)";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {monthlyBudget && (
        <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--color-primary-start)]" />
              <span className="text-[var(--color-text-muted)]">
                Dentro do orcamento
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[var(--color-negative)]" />
              <span className="text-[var(--color-text-muted)]">
                Acima do orcamento
              </span>
            </div>
          </div>
        </div>
      )}
    </CardGlass>
  );
}
