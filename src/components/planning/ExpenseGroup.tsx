"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock, Plus, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardGlass } from "@/components/ui/card-glass";
import { Input } from "@/components/ui/input";
import type { TPlanScenarioItem } from "@/db/types";
import { cn, formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "./ExpenseItem";

interface ExpenseGroupProps {
  title: string;
  expenseType: "fixed" | "variable";
  items: TPlanScenarioItem[];
  onAdd: (item: {
    category: string;
    name: string;
    amount: number;
    end_month?: number | null;
  }) => Promise<void>;
  onUpdate: (
    itemId: string,
    updates: {
      category?: string;
      name?: string;
      amount?: number;
      end_month?: number | null;
    },
  ) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export function ExpenseGroup({
  title,
  expenseType,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: ExpenseGroupProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addCategory, setAddCategory] = useState("Outros");
  const [addEndMonth, setAddEndMonth] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAdd = async () => {
    const trimmedName = addName.trim();
    const parsedAmount = Number.parseFloat(addAmount.replace(",", "."));

    if (!trimmedName || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsAdding(true);
    await onAdd({
      name: trimmedName,
      amount: parsedAmount,
      category: addCategory,
      end_month: addEndMonth ? Number.parseInt(addEndMonth, 10) : null,
    });
    setIsAdding(false);
    setAddName("");
    setAddAmount("");
    setAddCategory("Outros");
    setAddEndMonth("");
    setShowAddForm(false);
  };

  const IconComponent = expenseType === "fixed" ? Lock : Shuffle;

  return (
    <CardGlass variant="default" size="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--color-negative)]/10">
            <IconComponent className="size-4 text-[var(--color-negative)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
        <span className="text-sm font-medium text-[var(--color-text-secondary)] tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ExpenseItem
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && !showAddForm && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            Nenhuma despesa adicionada
          </p>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-light)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nome (ex: Aluguel)"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  disabled={isAdding}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                    R$
                  </span>
                  <Input
                    placeholder="0,00"
                    value={addAmount}
                    onChange={(e) =>
                      setAddAmount(e.target.value.replace(/[^\d,.]/g, ""))
                    }
                    className="pl-9 tabular-nums"
                    disabled={isAdding}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  placeholder="Categoria"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="flex-1"
                  disabled={isAdding}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Ate mes (vazio = sem fim)"
                  value={addEndMonth}
                  onChange={(e) => setAddEndMonth(e.target.value)}
                  className="w-48"
                  disabled={isAdding}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddName("");
                    setAddAmount("");
                    setAddCategory("Outros");
                    setAddEndMonth("");
                  }}
                  disabled={isAdding}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={isAdding || !addName.trim() || !addAmount}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
            "border border-dashed border-[var(--color-border-light)]",
            "text-sm font-medium text-[var(--color-text-muted)]",
            "hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
            "transition-colors",
          )}
        >
          <Plus className="size-4" />
          Adicionar Despesa
        </button>
      )}
    </CardGlass>
  );
}
