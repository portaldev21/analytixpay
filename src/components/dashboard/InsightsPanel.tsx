"use client";

import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  Lightbulb,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Insight, InsightType } from "@/lib/analytics/insights";

interface InsightsPanelProps {
  insights: Insight[];
}

/**
 * Get icon for insight type
 */
function getInsightIcon(type: InsightType) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-600" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "tip":
      return <Lightbulb className="h-5 w-5 text-purple-600" />;
  }
}

/**
 * Smart insights panel component
 */
export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum insight no momento.</p>
          <p className="text-sm mt-1">
            Continue acompanhando seus gastos para receber dicas personalizadas!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Insights Inteligentes</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-1">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                {insight.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="pl-0 mt-2"
                    asChild
                  >
                    <Link href={insight.action.href}>
                      {insight.action.label} →
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
