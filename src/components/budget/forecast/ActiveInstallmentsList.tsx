"use client";

import { motion } from "framer-motion";
import { CreditCard, Calendar, ArrowRight } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { cn, formatCurrency } from "@/lib/utils";
import type { TInstallmentProjection } from "@/db/types";

interface ActiveInstallmentsListProps {
  installments: TInstallmentProjection[];
  className?: string;
}

export function ActiveInstallmentsList({
  installments,
  className,
}: ActiveInstallmentsListProps) {
  if (installments.length === 0) {
    return (
      <CardGlass variant="dark-1" size="lg" className={className}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Parcelas Ativas
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Suas compras parceladas em andamento
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[150px] text-[var(--color-text-muted)]">
          <CreditCard className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhuma parcela ativa</p>
          <p className="text-xs mt-1">
            Suas compras parceladas aparecerao aqui
          </p>
        </div>
      </CardGlass>
    );
  }

  // Calculate totals
  const totalRemaining = installments.reduce(
    (sum, inst) => sum + inst.remaining_amount,
    0,
  );
  const totalInstallments = installments.reduce(
    (sum, inst) => sum + inst.remaining_installments,
    0,
  );

  return (
    <CardGlass variant="dark-1" size="lg" className={className}>
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Parcelas Ativas
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {installments.length} compra{installments.length !== 1 && "s"}{" "}
              parcelada{installments.length !== 1 && "s"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">
              Total restante
            </p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {installments.map((inst, index) => {
          const progress =
            (inst.current_installment / inst.total_installments) * 100;

          return (
            <motion.div
              key={inst.description}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-[var(--color-card-dark-2)] border border-[var(--glass-border)]"
            >
              {/* Description and Amount */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {inst.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="size-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Proxima: {new Date(inst.next_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--color-primary-start)] tabular-nums">
                    {formatCurrency(inst.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    /mes
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    Parcela {inst.current_installment}/{inst.total_installments}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    Faltam {inst.remaining_installments}
                  </span>
                </div>
                <div className="h-2 bg-[var(--color-card-dark-3)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-positive)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
              </div>

              {/* Remaining amount */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--glass-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Total restante
                </span>
                <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                  {formatCurrency(inst.remaining_amount)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-muted)]">
              {totalInstallments} parcelas restantes
            </span>
          </div>
          <ArrowRight className="size-4 text-[var(--color-text-muted)]" />
        </div>
      </div>
    </CardGlass>
  );
}
