"use client";

import { motion } from "framer-motion";
import { Bot, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { TPlanScenarioItem } from "@/db/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ExpenseItemProps {
  item: TPlanScenarioItem;
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

export function ExpenseItem({ item, onUpdate, onRemove }: ExpenseItemProps) {
  const [editingField, setEditingField] = useState<"name" | "amount" | null>(
    null,
  );
  const [nameValue, setNameValue] = useState(item.name);
  const [amountValue, setAmountValue] = useState(String(item.amount));
  const [isDeleting, setIsDeleting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const handleNameBlur = () => {
    setEditingField(null);
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === item.name) {
      setNameValue(item.name);
      return;
    }
    onUpdate(item.id, { name: trimmed });
  };

  const handleAmountBlur = () => {
    setEditingField(null);
    const parsed = Number.parseFloat(amountValue.replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0 || parsed === item.amount) {
      setAmountValue(String(item.amount));
      return;
    }
    onUpdate(item.id, { amount: parsed });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onRemove(item.id);
    setIsDeleting(false);
  };

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
      {/* Name + category */}
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
                setNameValue(item.name);
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
              {item.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)]/60 px-1.5 py-0.5 rounded">
                {item.category}
              </span>
              {item.end_month !== null && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  ate mes {item.end_month}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Auto-detected badge */}
      {item.auto_detected && (
        <span title="Detectado automaticamente" className="flex-shrink-0">
          <Bot className="size-4 text-[var(--color-secondary)]" />
        </span>
      )}

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
                setAmountValue(String(item.amount));
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
          className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums whitespace-nowrap"
        >
          {formatCurrency(item.amount)}
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
