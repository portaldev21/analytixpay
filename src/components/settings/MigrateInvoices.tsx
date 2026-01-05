"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getInvoicesWithoutBillingDate,
  updateInvoiceBillingDate,
} from "@/actions/analytics.actions";

interface Invoice {
  id: string;
  period: string | null;
  file_name: string | null;
  created_at: string;
}

interface MigrateInvoicesProps {
  accountId: string;
}

export function MigrateInvoices({ accountId }: MigrateInvoicesProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [accountId]);

  async function loadInvoices() {
    setLoading(true);
    setError(null);

    const result = await getInvoicesWithoutBillingDate(accountId);

    if (result.success && result.data) {
      setInvoices(result.data);
    } else {
      setError(result.error || "Erro ao carregar faturas");
    }

    setLoading(false);
  }

  async function handleUpdate(invoiceId: string) {
    const billingDate = dates[invoiceId];
    if (!billingDate) return;

    setUpdatingId(invoiceId);
    setError(null);
    setSuccessMessage(null);

    const result = await updateInvoiceBillingDate(
      accountId,
      invoiceId,
      billingDate,
    );

    if (result.success && result.data) {
      setSuccessMessage(
        `Data de vencimento atualizada! ${result.data.updatedTransactions} transações atualizadas.`,
      );
      // Remove from list
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      // Clear date
      setDates((prev) => {
        const newDates = { ...prev };
        delete newDates[invoiceId];
        return newDates;
      });
      router.refresh();
    } else {
      setError(result.error || "Erro ao atualizar data de vencimento");
    }

    setUpdatingId(null);
  }

  if (loading) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            Atualizar Datas de Vencimento
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
        </div>
      </CardGlass>
    );
  }

  if (invoices.length === 0) {
    return (
      <CardGlass variant="default" size="lg">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            Atualizar Datas de Vencimento
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Adicione datas de vencimento as faturas existentes
          </p>
        </div>
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <CheckCircle className="h-5 w-5 text-[var(--color-positive)]" />
          <span>Todas as faturas possuem data de vencimento!</span>
        </div>
      </CardGlass>
    );
  }

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
          <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
          Atualizar Datas de Vencimento
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {invoices.length} fatura(s) sem data de vencimento encontrada(s).
          Adicione a data para cada fatura para melhor organizacao.
        </p>
      </div>
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-negative)]/10 border border-[var(--color-negative)]/20 text-[var(--color-negative)]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-positive)]/10 border border-[var(--color-positive)]/20 text-[var(--color-positive)]">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border-light)]"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate text-[var(--color-text-primary)]">
                    {invoice.period || invoice.file_name || "Fatura sem nome"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Importada em{" "}
                    {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dates[invoice.id] || ""}
                  onChange={(e) =>
                    setDates((prev) => ({
                      ...prev,
                      [invoice.id]: e.target.value,
                    }))
                  }
                  className="w-[160px]"
                  disabled={updatingId === invoice.id}
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdate(invoice.id)}
                  disabled={!dates[invoice.id] || updatingId === invoice.id}
                  className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                >
                  {updatingId === invoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardGlass>
  );
}
