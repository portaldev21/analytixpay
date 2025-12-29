"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Loader2,
  ShoppingCart,
  Utensils,
  Car,
  Heart,
  Gamepad2,
  Home,
  Shirt,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import { deleteBudgetExpense } from "@/actions/budget.actions";
import type { TBudgetExpense } from "@/db/types";

const categoryIcons: Record<string, LucideIcon> = {
  Alimentacao: Utensils,
  Transporte: Car,
  Saude: Heart,
  Lazer: Gamepad2,
  Moradia: Home,
  Vestuario: Shirt,
  Compras: ShoppingCart,
  Outros: MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  Alimentacao: "text-green-400 bg-green-400/10",
  Transporte: "text-cyan-400 bg-cyan-400/10",
  Saude: "text-red-400 bg-red-400/10",
  Lazer: "text-purple-400 bg-purple-400/10",
  Moradia: "text-yellow-400 bg-yellow-400/10",
  Vestuario: "text-pink-400 bg-pink-400/10",
  Compras: "text-blue-400 bg-blue-400/10",
  Outros: "text-gray-400 bg-gray-400/10",
};

interface ExpenseListProps {
  expenses: TBudgetExpense[];
  accountId: string;
  onDelete?: () => void;
  className?: string;
}

export function ExpenseList({
  expenses,
  accountId,
  onDelete,
  className,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (expenseId: string) => {
    setDeletingId(expenseId);
    startTransition(async () => {
      const result = await deleteBudgetExpense(accountId, expenseId);
      if (result.success) {
        onDelete?.();
      }
      setDeletingId(null);
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  if (expenses.length === 0) {
    return (
      <CardGlass variant="dark-1" size="lg" className={className}>
        <div className="text-center py-8">
          <ShoppingCart className="size-12 mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)]">
            Nenhum gasto registrado hoje
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Adicione seu primeiro gasto acima
          </p>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="dark-1" size="lg" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Gastos de Hoje
        </h3>
        <span className="text-sm text-[var(--color-text-muted)]">
          {expenses.length} {expenses.length === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {expenses.map((expense) => {
            const Icon = categoryIcons[expense.category] || MoreHorizontal;
            const colorClass = categoryColors[expense.category] || categoryColors.Outros;
            const isDeleting = deletingId === expense.id;

            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  "bg-[var(--color-card-dark-3)]",
                  "border border-[var(--glass-border)]",
                  isDeleting && "opacity-50",
                )}
              >
                <div className={cn("p-2 rounded-lg", colorClass.split(" ")[1])}>
                  <Icon className={cn("size-4", colorClass.split(" ")[0])} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {expense.description || expense.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span>{expense.category}</span>
                    {expense.expense_time && (
                      <>
                        <span>•</span>
                        <span>{formatTime(expense.expense_time)}</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
                  {formatCurrency(expense.amount)}
                </p>

                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  disabled={isPending}
                  className={cn(
                    "p-2 rounded-lg",
                    "text-[var(--color-text-muted)] hover:text-[var(--color-negative)]",
                    "hover:bg-[var(--color-negative)]/10",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">Total</span>
          <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
          </span>
        </div>
      </div>
    </CardGlass>
  );
}
