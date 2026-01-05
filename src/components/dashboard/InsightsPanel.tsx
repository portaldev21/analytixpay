"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import type { Insight, InsightType } from "@/lib/analytics/insights";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  insights: Insight[];
}

function getInsightStyles(type: InsightType) {
  switch (type) {
    case "warning":
      return {
        icon: AlertTriangle,
        color: "text-[var(--color-negative)]",
        bg: "bg-[var(--color-negative)]/10",
        border: "border-[var(--color-negative)]/20",
      };
    case "info":
      return {
        icon: Info,
        color: "text-[var(--color-info)]",
        bg: "bg-[var(--color-info)]/10",
        border: "border-[var(--color-info)]/20",
      };
    case "success":
      return {
        icon: CheckCircle,
        color: "text-[var(--color-positive)]",
        bg: "bg-[var(--color-positive)]/10",
        border: "border-[var(--color-positive)]/20",
      };
    case "tip":
      return {
        icon: Lightbulb,
        color: "text-[var(--color-secondary)]",
        bg: "bg-[var(--color-secondary)]/10",
        border: "border-[var(--color-secondary)]/20",
      };
  }
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <CardGlass variant="secondary" size="lg">
        <div className="text-center py-6">
          <div className="inline-flex p-3 rounded-full bg-white/10 mb-4">
            <Sparkles className="size-8 text-white" />
          </div>
          <p className="text-white font-medium">Nenhum insight no momento.</p>
          <p className="text-sm text-white/70 mt-1">
            Continue acompanhando seus gastos para receber dicas personalizadas!
          </p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-[var(--radius-md)] bg-[var(--color-secondary)]/10">
          <Sparkles className="size-4 text-[var(--color-secondary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-title">
          Insights Inteligentes
        </h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, idx) => {
            const styles = getInsightStyles(insight.type);
            const Icon = styles.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-4 rounded-[var(--radius-md)] border transition-colors",
                  styles.bg,
                  styles.border,
                  "hover:brightness-95",
                )}
              >
                <div className="flex gap-3">
                  <div
                    className={cn("flex-shrink-0 p-1.5 rounded-[var(--radius-sm)]", styles.bg)}
                  >
                    <Icon className={cn("size-4", styles.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "mt-2 -ml-2 h-8",
                          styles.color,
                          "hover:bg-transparent hover:brightness-125",
                        )}
                        asChild
                      >
                        <Link href={insight.action.href}>
                          {insight.action.label}
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </CardGlass>
  );
}
