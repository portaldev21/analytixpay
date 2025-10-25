"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  LineChart,
  Line,
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
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Tendência de Gastos</h3>
        <p className="text-sm text-muted-foreground">
          Evolução dos gastos ao longo do tempo
        </p>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="monthLabel"
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 60 : 30}
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: isMobile ? 10 : 12,
            }}
          />
          <YAxis
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: isMobile ? 10 : 12,
            }}
            tickFormatter={(value) =>
              isMobile ? `${(value / 1000).toFixed(0)}k` : formatCurrency(value)
            }
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="font-medium">
                      {payload[0].payload.monthLabel}
                    </div>
                    <div className="mt-1 text-sm">
                      <div className="text-primary font-semibold">
                        {formatCurrency(Number(payload[0].value))}
                      </div>
                      <div className="text-muted-foreground">
                        {payload[0].payload.count} transações
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
