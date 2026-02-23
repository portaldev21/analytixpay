"use client";

import { motion } from "framer-motion";
import { Calendar, ChevronRight, Clock, Wallet } from "lucide-react";
import Link from "next/link";
import { CardGlass } from "@/components/ui/card-glass";
import type { TFinancialPlan } from "@/db/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface PlanCardProps {
  plan: TFinancialPlan;
}

/**
 * Format a start_month string (YYYY-MM) to a readable Portuguese label.
 * Example: "2026-03" => "Marco 2026"
 */
function formatStartMonth(startMonth: string): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const [yearStr, monthStr] = startMonth.split("-");
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const monthName = months[monthIndex] || monthStr;
  return `${monthName} ${yearStr}`;
}

export function PlanCard({ plan }: PlanCardProps) {
  const periodLabel = formatStartMonth(plan.start_month);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/planning/${plan.id}`}>
        <CardGlass variant="default" size="lg" interactive className="group">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="rounded-xl p-2.5 flex-shrink-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20">
                <Wallet className="size-5 text-[var(--color-primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                  {plan.name}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  {plan.months} meses de projecao
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">Inicio:</span>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {periodLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Wallet className="size-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">
                Saldo inicial:
              </span>
              <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(plan.initial_balance)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-[var(--color-text-muted)]" />
              <span className="text-[var(--color-text-muted)]">Criado:</span>
              <span className="text-[var(--color-text-secondary)]">
                {formatRelativeTime(plan.created_at)}
              </span>
            </div>
          </div>

          {/* Footer link */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)] flex items-center justify-between text-sm text-[var(--color-primary)] group-hover:text-[var(--color-positive)] transition-colors">
            <span>Abrir planejamento</span>
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardGlass>
      </Link>
    </motion.div>
  );
}
