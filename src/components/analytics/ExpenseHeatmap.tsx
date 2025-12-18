"use client";

import { CardGlass } from "@/components/ui/card-glass";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TDailySpending } from "@/db/types";

interface ExpenseHeatmapProps {
  data: TDailySpending[];
}

interface HeatmapValue {
  date: string;
  total: number;
  count: number;
}

export function ExpenseHeatmap({ data }: ExpenseHeatmapProps) {
  // Calculate color scale based on spending
  const maxSpending = Math.max(...data.map((d) => d.total), 1);

  const getClassForValue = (value: HeatmapValue | undefined) => {
    if (!value || !value.total) return "color-empty";
    const intensity = Math.ceil((value.total / maxSpending) * 4);
    return `color-scale-${Math.min(intensity, 4)}`;
  };

  // Last 365 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);

  // Transform data for heatmap
  const heatmapValues = data.map((d) => ({
    date: d.date,
    total: d.total,
    count: d.count,
  }));

  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Calendario de Gastos
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Visualizacao diaria dos seus gastos no ultimo ano
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[750px]">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={heatmapValues}
            classForValue={getClassForValue as (value: unknown) => string}
            tooltipDataAttrs={
              ((value: HeatmapValue | undefined) => {
                if (!value || !value.date) {
                  return { "data-tip": "Sem gastos" };
                }
                return {
                  "data-tip": `${formatDate(value.date)}: ${formatCurrency(value.total)} (${value.count} transacoes)`,
                };
              }) as (value: unknown) => Record<string, string>
            }
            showWeekdayLabels
            gutterSize={2}
          />
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 text-xs text-[var(--color-text-muted)]">
        <span>Menos</span>
        <div className="w-3 h-3 rounded-sm bg-[var(--color-card-dark-3)]" />
        <div className="w-3 h-3 rounded-sm bg-[var(--color-primary-start)]/25" />
        <div className="w-3 h-3 rounded-sm bg-[var(--color-primary-start)]/50" />
        <div className="w-3 h-3 rounded-sm bg-[var(--color-primary-start)]/75" />
        <div className="w-3 h-3 rounded-sm bg-[var(--color-primary-start)]" />
        <span>Mais</span>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap .color-empty {
          fill: var(--color-card-dark-3);
        }
        .react-calendar-heatmap .color-scale-1 {
          fill: rgba(66, 167, 164, 0.25);
        }
        .react-calendar-heatmap .color-scale-2 {
          fill: rgba(66, 167, 164, 0.5);
        }
        .react-calendar-heatmap .color-scale-3 {
          fill: rgba(66, 167, 164, 0.75);
        }
        .react-calendar-heatmap .color-scale-4 {
          fill: rgb(66, 167, 164);
        }
        .react-calendar-heatmap text {
          fill: var(--color-text-muted);
          font-size: 8px;
        }
      `}</style>
    </CardGlass>
  );
}
