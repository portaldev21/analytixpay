"use client";

import { CardGlass } from "@/components/ui/card-glass";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TInstallmentProjection } from "@/db/types";
import { Calendar, AlertCircle } from "lucide-react";

interface InstallmentsTableProps {
  data: TInstallmentProjection[];
}

export function InstallmentsTable({ data }: InstallmentsTableProps) {
  if (data.length === 0) {
    return (
      <CardGlass variant="dark-1" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Parcelas Futuras
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Projecao de parcelas pendentes
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[150px] text-[var(--color-text-muted)]">
          <Calendar className="h-12 w-12 mb-2 opacity-50" />
          <p>Nenhuma parcela futura encontrada</p>
        </div>
      </CardGlass>
    );
  }

  // Calculate totals
  const totalRemaining = data.reduce((sum, i) => sum + i.remaining_amount, 0);
  const totalMonthly = data.reduce((sum, i) => sum + i.amount, 0);

  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Parcelas Futuras
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Projecao de parcelas pendentes
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--color-text-muted)]">
              Total restante
            </div>
            <div className="text-lg font-bold text-[var(--color-primary-start)] tabular-nums">
              {formatCurrency(totalRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary alert */}
      <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-[var(--color-purple-light)]/10 border border-[var(--color-purple-light)]/20">
        <AlertCircle className="h-4 w-4 text-[var(--color-purple-light)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          Voce tem{" "}
          <strong className="text-[var(--color-text-primary)]">
            {data.length}
          </strong>{" "}
          compras parceladas, totalizando{" "}
          <strong className="text-[var(--color-text-primary)]">
            {formatCurrency(totalMonthly)}/mes
          </strong>{" "}
          em parcelas
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--color-card-dark-2)] hover:bg-[var(--color-card-dark-3)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--color-text-primary)] truncate">
                {item.description}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="purple" className="text-xs">
                  {item.current_installment}/{item.total_installments}
                </Badge>
                <span className="text-xs text-[var(--color-text-muted)]">
                  Restam {item.remaining_installments} parcelas
                </span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="font-semibold text-[var(--color-text-primary)] tabular-nums">
                {formatCurrency(item.amount)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Prox: {formatDate(item.next_date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardGlass>
  );
}
