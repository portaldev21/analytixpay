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
  Cell,
} from "recharts";
import type { TSpendingByCard } from "@/db/types";
import { CreditCard } from "lucide-react";

interface SpendingByCardChartProps {
  data: TSpendingByCard[];
}

const COLORS = [
  "#42A7A4", // primary-start
  "#AA88F5", // purple-light
  "#32E68A", // positive
  "#5F57B7", // purple-mid
  "#6E88BA", // card-blue-start
  "#FF4F66", // negative
];

export function SpendingByCardChart({ data }: SpendingByCardChartProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (data.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Gastos por Cartao
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Distribuicao de gastos por cartao de credito
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[200px] text-[var(--color-text-muted)]">
          <CreditCard className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhum dado disponivel</p>
        </div>
      </CardGlass>
    );
  }

  // Format card digits for display
  const chartData = data.map((item) => ({
    ...item,
    label:
      item.card_last_digits === "Desconhecido"
        ? "Cartao"
        : `****${item.card_last_digits}`,
  }));

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Gastos por Cartao
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Distribuicao de gastos por cartao de credito
        </p>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
        <BarChart data={chartData} layout="vertical">
          <XAxis
            type="number"
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
            tickFormatter={(value) =>
              isMobile ? `${(value / 1000).toFixed(0)}k` : formatCurrency(value)
            }
          />
          <YAxis
            type="category"
            dataKey="label"
            width={isMobile ? 70 : 100}
            tick={{
              fill: "var(--color-text-muted)",
              fontSize: isMobile ? 10 : 12,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as TSpendingByCard & {
                  label: string;
                };
                return (
                  <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]">
                    <div className="font-medium text-[var(--color-text-primary)]">
                      {data.label}
                    </div>
                    <div className="mt-1 text-sm">
                      <div className="text-[var(--color-primary)] font-semibold tabular-nums">
                        {formatCurrency(data.total)}
                      </div>
                      <div className="text-[var(--color-text-muted)]">
                        {data.count} transacoes
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="total" radius={[0, 8, 8, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardGlass>
  );
}
