"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpendingTrendsChartProps {
  data: {
    month: string;
    total: number;
    count: number;
  }[];
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export function SpendingTrendsChart({ data }: SpendingTrendsChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Tendencia de Gastos
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Evolucao dos gastos ao longo do tempo
        </p>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-primary)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-light)"
            vertical={false}
          />
          <XAxis
            dataKey="monthLabel"
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 60 : 30}
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
            axisLine={{ stroke: "var(--color-border-light)" }}
            tickLine={false}
          />
          <YAxis
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
            tickFormatter={(value) =>
              isMobile ? `${(value / 1000).toFixed(0)}k` : formatCurrency(value)
            }
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-card p-3">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {payload[0].payload.monthLabel}
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="text-lg font-bold text-[var(--color-primary)]">
                        {formatCurrency(Number(payload[0].value))}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {payload[0].payload.count} transacoes
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#colorTotal)"
            dot={{
              fill: "var(--color-surface)",
              stroke: "var(--color-primary)",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: "var(--color-primary)",
              stroke: "var(--color-surface)",
              strokeWidth: 2,
              r: 6,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardGlass>
  );
}
