"use client";

import { Lightbulb, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { CardGlass } from "@/components/ui/card-glass";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getHealthScoreColor,
  getHealthScoreDescription,
  type HealthScore,
} from "@/lib/analytics/health-score";

interface HealthScoreCardProps {
  data: HealthScore | null;
}

const FACTOR_NAMES: Record<string, string> = {
  budgetAdherence: "Controle do Orcamento",
  savingsRate: "Taxa de Economia",
  spendingTrend: "Tendencia de Gastos",
  diversification: "Diversificacao",
};

// Map grade colors to design system
function getGradeStyles(grade: string) {
  switch (grade) {
    case "A":
      return {
        color: "text-[var(--color-positive)]",
        bg: "bg-[var(--color-positive)]/10",
        glow: "shadow-[0_0_20px_rgba(50,230,138,0.3)]",
      };
    case "B":
      return {
        color: "text-[var(--color-primary)]",
        bg: "bg-[var(--color-primary)]/10",
        glow: "shadow-[0_0_20px_rgba(66,167,164,0.3)]",
      };
    case "C":
      return {
        color: "text-[var(--color-purple-light)]",
        bg: "bg-[var(--color-purple-light)]/10",
        glow: "shadow-[0_0_20px_rgba(170,136,245,0.3)]",
      };
    case "D":
    case "F":
      return {
        color: "text-[var(--color-negative)]",
        bg: "bg-[var(--color-negative)]/10",
        glow: "shadow-[0_0_20px_rgba(255,79,102,0.3)]",
      };
    default:
      return {
        color: "text-[var(--color-text-muted)]",
        bg: "bg-[var(--color-surface-muted)]",
        glow: "",
      };
  }
}

export function HealthScoreCard({ data }: HealthScoreCardProps) {
  // Empty state
  if (!data) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="size-5 text-[var(--color-negative)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Saude Financeira
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 rounded-full bg-[var(--color-surface-muted)]">
            <Heart className="size-8 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            Sem dados suficientes
          </p>
          <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">
            Faca upload de faturas para calcular
          </p>
        </div>
      </CardGlass>
    );
  }

  const gradeStyles = getGradeStyles(data.grade);
  const description = getHealthScoreDescription(data.grade);

  return (
    <CardGlass variant="default" size="lg">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="size-5 text-[var(--color-negative)]" />
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Saude Financeira
        </h3>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-6 mb-6">
        <motion.div
          className={cn(
            "flex items-center justify-center size-20 rounded-2xl",
            gradeStyles.bg,
            gradeStyles.glow,
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className={cn("text-4xl font-bold", gradeStyles.color)}>
            {data.grade}
          </span>
        </motion.div>

        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {data.score}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">/100</span>
          </div>
          <Progress
            value={data.score}
            className="h-2 bg-[var(--color-surface-muted)]"
          />
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {description}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">
          Detalhes da Pontuacao
        </h4>
        {Object.entries(data.factors).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-text-muted)]">
              {FACTOR_NAMES[key] || key}
            </span>
            <div className="flex items-center gap-3">
              <Progress
                value={(value / 25) * 100}
                className="h-1.5 w-20 bg-[var(--color-surface-muted)]"
              />
              <span className="font-medium text-[var(--color-text-primary)] tabular-nums w-10 text-right">
                {value}/25
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="pt-4 border-t border-[var(--color-border-light)]">
          <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Recomendacoes
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex gap-2 text-sm p-2 rounded-lg bg-[var(--color-purple-light)]/5"
              >
                <Lightbulb className="size-4 text-[var(--color-purple-light)] flex-shrink-0 mt-0.5" />
                <span className="text-[var(--color-text-muted)]">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardGlass>
  );
}
