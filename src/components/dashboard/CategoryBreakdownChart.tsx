"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
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

const COLORS = [
  "hsl(210, 100%, 56%)", // blue
  "hsl(280, 100%, 65%)", // purple
  "hsl(340, 100%, 60%)", // pink
  "hsl(30, 100%, 55%)", // orange
  "hsl(150, 60%, 50%)", // green
  "hsl(200, 100%, 45%)", // cyan
  "hsl(50, 100%, 50%)", // yellow
  "hsl(0, 100%, 60%)", // red
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = data.sort((a, b) => b.total - a.total).slice(0, 8); // Top 8 categories

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
          <p className="text-sm text-muted-foreground">
            Distribuição percentual dos gastos
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <PieChartIcon className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Nenhuma transação encontrada</p>
          <p className="text-xs mt-1">Faça upload de uma fatura para começar</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
        <p className="text-sm text-muted-foreground">
          Distribuição percentual dos gastos
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
                fill="#8884d8"
                paddingAngle={2}
                dataKey="total"
                label={({ payload }: { payload?: { percentage: number } }) =>
                  payload ? `${payload.percentage.toFixed(0)}%` : ""
                }
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.category}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <div className="font-medium">{data.category}</div>
                        <div className="mt-1 text-sm">
                          <div className="text-primary font-semibold">
                            {formatCurrency(data.total)}
                          </div>
                          <div className="text-muted-foreground">
                            {data.count} transações
                          </div>
                          <div className="text-muted-foreground">
                            {data.percentage.toFixed(1)}% do total
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
          {chartData.map((item, index) => (
            <div
              key={item.category}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-muted-foreground text-xs">
                  {item.percentage.toFixed(0)}%
                </span>
                <span className="font-medium">
                  {formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
