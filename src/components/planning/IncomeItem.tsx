"use client";

import { motion } from "framer-motion";
import { Calendar, Loader2, Repeat, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { TPlanIncomeSource } from "@/db/types";
import { cn, formatCurrency } from "@/lib/utils";

interface IncomeItemProps {
  income: TPlanIncomeSource;
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

export function IncomeItem({ income, onUpdate, onRemove }: IncomeItemProps) {
  const [editingField, setEditingField] = useState<"name" | "amount" | null>(
    null,
  );
  const [nameValue, setNameValue] = useState(income.name);
  const [amountValue, setAmountValue] = useState(String(income.amount));
  const [isDeleting, setIsDeleting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const handleNameBlur = () => {
    setEditingField(null);
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === income.name) {
      setNameValue(income.name);
      return;
    }
    onUpdate(income.id, { name: trimmed });
  };

  const handleAmountBlur = () => {
    setEditingField(null);
    const parsed = Number.parseFloat(amountValue.replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0 || parsed === income.amount) {
      setAmountValue(String(income.amount));
      return;
    }
    onUpdate(income.id, { amount: parsed });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onRemove(income.id);
    setIsDeleting(false);
  };

  const frequencyLabel =
    income.frequency === "monthly"
      ? "mensal"
      : `unico, mes ${income.month_index ?? 0}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-[var(--color-surface-muted)]",
        "border border-[var(--color-border-light)]",
        isDeleting && "opacity-50",
      )}
    >
      {/* Icon */}
      <div className="p-2 rounded-lg bg-[var(--color-positive)]/10 flex-shrink-0">
        {income.frequency === "monthly" ? (
          <Repeat className="size-4 text-[var(--color-positive)]" />
        ) : (
          <Calendar className="size-4 text-[var(--color-positive)]" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editingField === "name" ? (
          <Input
            ref={nameRef}
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameBlur();
              if (e.key === "Escape") {
                setNameValue(income.name);
                setEditingField(null);
              }
            }}
            className="h-7 text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingField("name")}
            className="text-left w-full"
          >
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {income.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {frequencyLabel}
            </p>
          </button>
        )}
      </div>

      {/* Amount */}
      {editingField === "amount" ? (
        <div className="relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
            R$
          </span>
          <Input
            ref={amountRef}
            autoFocus
            value={amountValue}
            onChange={(e) =>
              setAmountValue(e.target.value.replace(/[^\d,.]/g, ""))
            }
            onBlur={handleAmountBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAmountBlur();
              if (e.key === "Escape") {
                setAmountValue(String(income.amount));
                setEditingField(null);
              }
            }}
            className="h-7 pl-7 text-sm tabular-nums w-full"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingField("amount")}
          className="text-sm font-semibold text-[var(--color-positive)] tabular-nums whitespace-nowrap"
        >
          {formatCurrency(income.amount)}
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          "p-2 rounded-lg flex-shrink-0",
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
}
