"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardGlass } from "@/components/ui/card-glass";
import { Input } from "@/components/ui/input";
import type { TPlanIncomeSource } from "@/db/types";
import { cn } from "@/lib/utils";
import { IncomeItem } from "./IncomeItem";

interface IncomeSectionProps {
  incomes: TPlanIncomeSource[];
  onAdd: (income: {
    name: string;
    amount: number;
    frequency: "monthly" | "once";
    month_index?: number | null;
  }) => Promise<void>;
  onUpdate: (
    incomeId: string,
    updates: {
      name?: string;
      amount?: number;
      frequency?: "monthly" | "once";
      month_index?: number | null;
    },
  ) => Promise<void>;
  onRemove: (incomeId: string) => Promise<void>;
}

export function IncomeSection({
  incomes,
  onAdd,
  onUpdate,
  onRemove,
}: IncomeSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addFrequency, setAddFrequency] = useState<"monthly" | "once">(
    "monthly",
  );
  const [addMonthIndex, setAddMonthIndex] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const trimmedName = addName.trim();
    const parsedAmount = Number.parseFloat(addAmount.replace(",", "."));

    if (!trimmedName || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsAdding(true);
    await onAdd({
      name: trimmedName,
      amount: parsedAmount,
      frequency: addFrequency,
      month_index:
        addFrequency === "once" && addMonthIndex
          ? Number.parseInt(addMonthIndex, 10)
          : null,
    });
    setIsAdding(false);
    setAddName("");
    setAddAmount("");
    setAddFrequency("monthly");
    setAddMonthIndex("");
    setShowAddForm(false);
  };

  return (
    <CardGlass variant="default" size="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--color-positive)]/10">
            <DollarSign className="size-4 text-[var(--color-positive)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Receitas
          </h3>
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">
          {incomes.length} {incomes.length === 1 ? "fonte" : "fontes"}
        </span>
      </div>

      {/* Income list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {incomes.map((income) => (
            <IncomeItem
              key={income.id}
              income={income}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>

        {incomes.length === 0 && !showAddForm && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
            Nenhuma receita adicionada
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
                  placeholder="Nome (ex: Salario)"
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
                <div className="flex rounded-lg border border-[var(--color-border-light)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAddFrequency("monthly")}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium transition-colors",
                      addFrequency === "monthly"
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFrequency("once")}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium transition-colors",
                      addFrequency === "once"
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    Unico
                  </button>
                </div>

                {addFrequency === "once" && (
                  <Input
                    type="number"
                    min="0"
                    placeholder="Mes (0 = primeiro)"
                    value={addMonthIndex}
                    onChange={(e) => setAddMonthIndex(e.target.value)}
                    className="w-40"
                    disabled={isAdding}
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddName("");
                    setAddAmount("");
                    setAddFrequency("monthly");
                    setAddMonthIndex("");
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
          Adicionar Renda
        </button>
      )}
    </CardGlass>
  );
}
