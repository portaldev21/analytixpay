"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn } from "@/lib/utils";
import { upsertBudgetConfig } from "@/actions/budget.actions";
import { useRouter } from "next/navigation";

interface EmptyBudgetStateProps {
  accountId: string;
  className?: string;
}

export function EmptyBudgetState({ accountId, className }: EmptyBudgetStateProps) {
  const [dailyBase, setDailyBase] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericValue = Number.parseFloat(dailyBase.replace(",", "."));

    if (Number.isNaN(numericValue) || numericValue <= 0) {
      setError("Digite um valor valido");
      return;
    }

    startTransition(async () => {
      const result = await upsertBudgetConfig(accountId, {
        daily_base: numericValue,
      });

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Erro ao salvar configuracao");
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,\.]/g, "");
    setDailyBase(value);
  };

  // Calculate preview
  const numericValue = Number.parseFloat(dailyBase.replace(",", ".")) || 0;
  const weeklyBudget = numericValue * 7;
  const monthlyBudget = numericValue * 30;

  return (
    <div className={cn("max-w-md mx-auto", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardGlass variant="dark-1" size="xl" className="text-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-[var(--color-primary-start)]/20 to-[var(--color-primary-end)]/20 w-fit mx-auto mb-6">
            <Wallet className="size-10 text-[var(--color-primary-start)]" />
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Configure seu Orcamento Fluido
          </h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            Defina quanto voce quer gastar por dia. O sistema ajustara automaticamente
            seu orcamento baseado nos seus gastos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Daily base input */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 text-left">
                Base diaria
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--color-text-muted)]">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={dailyBase}
                  onChange={handleAmountChange}
                  placeholder="100,00"
                  className={cn(
                    "w-full h-14 pl-12 pr-4 rounded-xl text-2xl font-bold tabular-nums",
                    "bg-[var(--color-card-dark-3)] border border-[var(--glass-border)]",
                    "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
                    "focus:outline-none focus:border-[var(--color-primary-start)]",
                    "transition-colors text-center",
                  )}
                />
              </div>
            </div>

            {/* Preview */}
            {numericValue > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 p-4 rounded-xl bg-[var(--color-card-dark-3)]"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Semanal</span>
                  <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                    R$ {weeklyBudget.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Mensal (30 dias)</span>
                  <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                    R$ {monthlyBudget.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-[var(--color-negative)]">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !dailyBase}
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
                  Salvando...
                </>
              ) : (
                <>
                  Comecar
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <p className="text-xs text-[var(--color-text-muted)] mt-6">
            Voce pode alterar este valor a qualquer momento nas configuracoes.
          </p>
        </CardGlass>
      </motion.div>
    </div>
  );
}
