"use client";

import { useState } from "react";
import { Check, X, Link2, Calendar, DollarSign, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  approveReconciliation,
  markExpenseUnmatched,
} from "@/actions/budget.actions";
import {
  getMatchExplanation,
  getConfidenceLabel,
  formatConfidence,
  type TReconciliationMatch,
} from "@/lib/budget/reconciliation";
import type { TBudgetExpense } from "@/db/types";

interface MatchSuggestionCardProps {
  expense: TBudgetExpense;
  matches: TReconciliationMatch[];
  accountId: string;
  onResolved?: () => void;
}

export function MatchSuggestionCard({
  expense,
  matches,
  accountId,
  onResolved,
}: MatchSuggestionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(
    matches[0]?.transaction.id || null,
  );
  const [isResolved, setIsResolved] = useState(false);

  const handleApprove = async () => {
    if (!selectedMatch) return;
    setIsProcessing(true);

    try {
      const result = await approveReconciliation(
        accountId,
        expense.id,
        selectedMatch,
      );
      if (result.success) {
        setIsResolved(true);
        onResolved?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);

    try {
      const result = await markExpenseUnmatched(accountId, expense.id);
      if (result.success) {
        setIsResolved(true);
        onResolved?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateStr));

  if (isResolved) {
    return null;
  }

  const bestMatch = matches[0];
  const hasMatches = matches.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
      >
        <CardGlass variant="muted" size="lg" className="space-y-4">
          {/* Expense Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {formatCurrency(expense.amount)}
                </span>
                {expense.category && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                    {expense.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatDate(expense.expense_date)}
                </span>
                {expense.description && (
                  <span className="truncate max-w-[200px]">
                    {expense.description}
                  </span>
                )}
              </div>
            </div>

            {/* Confidence Badge */}
            {bestMatch && (
              <div
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium",
                  getConfidenceLabel(bestMatch.confidence) === "high" &&
                    "bg-[var(--color-positive)]/10 text-[var(--color-positive)]",
                  getConfidenceLabel(bestMatch.confidence) === "medium" &&
                    "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
                  getConfidenceLabel(bestMatch.confidence) === "low" &&
                    "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]",
                )}
              >
                {formatConfidence(bestMatch.confidence)} match
              </div>
            )}
          </div>

          {/* Match Suggestions */}
          {hasMatches ? (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                {matches.length === 1
                  ? "1 transacao encontrada:"
                  : `${matches.length} transacoes encontradas:`}
              </p>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {matches.slice(0, 3).map((match) => (
                  <div
                    key={match.transaction.id}
                    onClick={() => setSelectedMatch(match.transaction.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all",
                      selectedMatch === match.transaction.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-[var(--color-border-light)] hover:border-[var(--color-text-muted)]/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {formatCurrency(match.transaction.amount)}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {formatDate(match.transaction.date)}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] truncate max-w-[300px]">
                          {match.transaction.description}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {getMatchExplanation(match)}
                        </p>
                      </div>

                      {selectedMatch === match.transaction.id && (
                        <div className="size-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                          <Check className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Nenhuma transacao correspondente encontrada
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-light)]">
            {hasMatches && (
              <Button
                onClick={handleApprove}
                disabled={isProcessing || !selectedMatch}
                className="flex-1 bg-[var(--color-positive)] hover:bg-[var(--color-positive)]/90"
              >
                <Link2 className="size-4 mr-2" />
                Vincular
              </Button>
            )}
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="outline"
              className={cn(
                "border-[var(--color-negative)]/30 text-[var(--color-negative)] hover:bg-[var(--color-negative)]/10",
                !hasMatches && "flex-1",
              )}
            >
              <X className="size-4 mr-2" />
              Nao corresponde
            </Button>
          </div>
        </CardGlass>
      </motion.div>
    </AnimatePresence>
  );
}
