"use client";

import { Clock, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { calculateRunway } from "@/lib/planning/calculations";
import { cn, formatCurrency } from "@/lib/utils";

interface RunwayCardProps {
  currentCash: number;
  monthlyExpenses: number;
}

function getRunwayStatus(months: number): {
  color: string;
  bgColor: string;
  label: string;
  Icon: typeof ShieldCheck;
} {
  if (months === Number.POSITIVE_INFINITY || months > 6) {
    return {
      color: "text-[var(--color-positive)]",
      bgColor: "bg-[var(--color-positive)]",
      label: "Saudavel",
      Icon: ShieldCheck,
    };
  }
  if (months >= 3) {
    return {
      color: "text-[var(--color-warning)]",
      bgColor: "bg-[var(--color-warning)]",
      label: "Atencao",
      Icon: Shield,
    };
  }
  return {
    color: "text-[var(--color-negative)]",
    bgColor: "bg-[var(--color-negative)]",
    label: "Critico",
    Icon: ShieldAlert,
  };
}

export function RunwayCard({ currentCash, monthlyExpenses }: RunwayCardProps) {
  const runway = calculateRunway(currentCash, monthlyExpenses);
  const isInfinite = runway === Number.POSITIVE_INFINITY;
  const displayValue = isInfinite ? "\u221E" : String(runway);
  const { color, bgColor, label, Icon } = getRunwayStatus(runway);

  // Progress bar: cap at 12 months for visual representation
  const progressPercent = isInfinite ? 100 : Math.min((runway / 12) * 100, 100);

  return (
    <CardGlass variant="default" size="lg">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "rounded-xl p-2.5 flex-shrink-0",
            "bg-gradient-to-br",
            runway > 6
              ? "from-[var(--color-positive)]/20 to-[var(--color-positive)]/5"
              : runway >= 3
                ? "from-[var(--color-warning)]/20 to-[var(--color-warning)]/5"
                : "from-[var(--color-negative)]/20 to-[var(--color-negative)]/5",
          )}
        >
          <Icon className={cn("size-5", color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Pista de Sobrevivencia
            </h3>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                bgColor,
                "text-white",
              )}
            >
              {label}
            </span>
          </div>

          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Tempo estimado sem receita
          </p>

          {/* Main value */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className={cn("text-4xl font-bold tabular-nums", color)}>
              {displayValue}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              {isInfinite
                ? "meses (sem despesas)"
                : runway === 1
                  ? "mes de sobrevivencia sem renda"
                  : "meses de sobrevivencia sem renda"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Runway
              </span>
              <span className="tabular-nums">
                {isInfinite ? "12+" : `${runway} / 12`} meses
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  bgColor,
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <div>
              <span>Saldo: </span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(currentCash)}
              </span>
            </div>
            <div>
              <span>Despesas/mes: </span>
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardGlass>
  );
}
