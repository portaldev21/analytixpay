"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  ShoppingCart,
  Utensils,
  Car,
  Heart,
  Gamepad2,
  Home,
  Shirt,
  MoreHorizontal,
} from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import { addBudgetExpense } from "@/actions/budget.actions";

const categories = [
  { name: "Alimentacao", icon: Utensils, color: "text-green-400" },
  { name: "Transporte", icon: Car, color: "text-cyan-400" },
  { name: "Saude", icon: Heart, color: "text-red-400" },
  { name: "Lazer", icon: Gamepad2, color: "text-purple-400" },
  { name: "Moradia", icon: Home, color: "text-yellow-400" },
  { name: "Vestuario", icon: Shirt, color: "text-pink-400" },
  { name: "Compras", icon: ShoppingCart, color: "text-blue-400" },
  { name: "Outros", icon: MoreHorizontal, color: "text-gray-400" },
];

interface ExpenseFormProps {
  accountId: string;
  onSuccess?: () => void;
  className?: string;
}

export function ExpenseForm({ accountId, onSuccess, className }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Outros");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numericAmount = Number.parseFloat(amount.replace(",", "."));

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Digite um valor valido");
      return;
    }

    startTransition(async () => {
      const result = await addBudgetExpense(accountId, {
        amount: numericAmount,
        category: selectedCategory,
        description: description || undefined,
      });

      if (result.success) {
        setAmount("");
        setDescription("");
        setSelectedCategory("Outros");
        setShowDetails(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        onSuccess?.();
      } else {
        setError(result.error || "Erro ao adicionar gasto");
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,\.]/g, "");
    setAmount(value);
  };

  return (
    <CardGlass variant="dark-1" size="lg" className={className}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Adicionar Gasto
          </h3>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[var(--color-primary-start)] hover:underline"
          >
            {showDetails ? "Ocultar detalhes" : "Mais detalhes"}
          </button>
        </div>

        {/* Amount input */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--color-text-muted)]">
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0,00"
            className={cn(
              "w-full h-14 pl-12 pr-4 rounded-xl text-2xl font-bold tabular-nums",
              "bg-[var(--color-card-dark-3)] border border-[var(--glass-border)]",
              "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
              "focus:outline-none focus:border-[var(--color-primary-start)]",
              "transition-colors",
            )}
          />
        </div>

        {/* Category selector */}
        <div className="mb-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Categoria</p>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    isSelected
                      ? "bg-[var(--color-card-dark-2)] border-2 border-[var(--color-primary-start)]"
                      : "bg-[var(--color-card-dark-3)] border-2 border-transparent hover:border-[var(--glass-border)]",
                  )}
                >
                  <Icon className={cn("size-5", isSelected ? cat.color : "text-[var(--color-text-muted)]")} />
                  <span
                    className={cn(
                      "text-[10px] font-medium truncate w-full text-center",
                      isSelected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]",
                    )}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description (toggle) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  Descricao (opcional)
                </p>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Almoco no restaurante"
                  maxLength={200}
                  className={cn(
                    "w-full h-10 px-4 rounded-lg text-sm",
                    "bg-[var(--color-card-dark-3)] border border-[var(--glass-border)]",
                    "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
                    "focus:outline-none focus:border-[var(--color-primary-start)]",
                    "transition-colors",
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-[var(--color-negative)] mb-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-[var(--color-positive)] mb-4"
            >
              Gasto adicionado com sucesso!
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isPending || !amount}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-white",
            "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)]",
            "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
            "transition-opacity",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <Plus className="size-5" />
              Adicionar Gasto
            </>
          )}
        </button>
      </form>
    </CardGlass>
  );
}
