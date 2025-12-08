"use client";

import { Lightbulb, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * Factor name translations
 */
const FACTOR_NAMES: Record<string, string> = {
  budgetAdherence: "Controle do Orçamento",
  savingsRate: "Taxa de Economia",
  spendingTrend: "Tendência de Gastos",
  diversification: "Diversificação",
};

/**
 * Financial health score card component
 */
export function HealthScoreCard({ data }: HealthScoreCardProps) {
  // Empty state
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saúde Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Sem dados suficientes</p>
            <p className="text-xs mt-1">Faça upload de faturas para calcular</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const gradeColor = getHealthScoreColor(data.grade);
  const description = getHealthScoreDescription(data.grade);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde Financeira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score display */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn("text-6xl font-bold", gradeColor)}>
              {data.grade}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {description}
            </div>
          </div>

          <div className="flex-1">
            <div className="text-3xl font-bold mb-2">{data.score}/100</div>
            <Progress value={data.score} className="h-3" />
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Detalhes da Pontuação</h4>
          {Object.entries(data.factors).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-muted-foreground">
                {FACTOR_NAMES[key] || key}
              </span>
              <div className="flex items-center gap-2">
                <Progress value={(value / 25) * 100} className="h-2 w-24" />
                <span className="font-medium w-12 text-right">{value}/25</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recomendações</h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
