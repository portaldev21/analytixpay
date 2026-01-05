"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteInvoiceButton } from "./DeleteInvoiceButton";
import type { TInvoice } from "@/db/types";

interface InvoiceCardProps {
  invoice: TInvoice & { transaction_count?: number };
  accountId: string;
  showDelete?: boolean;
}

export function InvoiceCard({
  invoice,
  accountId,
  showDelete = true,
}: InvoiceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDeleting ? 0.5 : 1,
        scale: isDeleting ? 0.95 : 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
        x: -50,
        transition: { duration: 0.2, ease: "easeInOut" },
      }}
      transition={{ duration: 0.2 }}
    >
      <CardGlass
        variant="muted"
        size="lg"
        interactive
        
        className={
          isDeleting
            ? "!bg-[var(--color-negative)]/10 !border-[var(--color-negative)]/50"
            : ""
        }
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`rounded-xl p-2.5 flex-shrink-0 transition-colors ${
                isDeleting
                  ? "bg-[var(--color-negative)]/20"
                  : "bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20"
              }`}
            >
              <FileText
                className={`h-5 w-5 transition-colors ${
                  isDeleting
                    ? "text-[var(--color-negative)]"
                    : "text-[var(--color-primary)]"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={`font-semibold text-[var(--color-text-primary)] truncate transition-colors ${
                  isDeleting ? "text-[var(--color-negative)]" : ""
                }`}
              >
                {invoice.file_name}
              </h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {invoice.billing_date ? (
                    <span>
                      {formatDate(invoice.billing_date)}{" "}
                      <span className="text-xs opacity-70">(Vencimento)</span>
                    </span>
                  ) : (
                    formatDate(invoice.created_at)
                  )}
                </div>
                {invoice.period && (
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {invoice.period}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={
                invoice.status === "completed"
                  ? "success"
                  : invoice.status === "error"
                    ? "destructive"
                    : "info"
              }
            >
              {invoice.status === "completed"
                ? "Processado"
                : invoice.status === "error"
                  ? "Erro"
                  : "Processando"}
            </Badge>
            {showDelete && (
              <DeleteInvoiceButton
                invoiceId={invoice.id}
                accountId={accountId}
                invoiceName={invoice.period || invoice.file_name}
                transactionCount={invoice.transaction_count}
                onDeleteStart={() => setIsDeleting(true)}
              />
            )}
          </div>
        </div>

        {invoice.card_last_digits && (
          <div className="mt-4 text-sm">
            <span className="text-[var(--color-text-muted)]">Cartão: </span>
            <span className="font-medium text-[var(--color-text-secondary)]">
              **** {invoice.card_last_digits}
            </span>
          </div>
        )}

        {invoice.total_amount && (
          <div className="mt-2 text-sm">
            <span className="text-[var(--color-text-muted)]">Total: </span>
            <span className="font-semibold text-lg text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(Number(invoice.total_amount))}
            </span>
          </div>
        )}

        {invoice.transaction_count !== undefined &&
          invoice.transaction_count > 0 && (
            <div className="mt-2 text-sm text-[var(--color-text-muted)]">
              {invoice.transaction_count}{" "}
              {invoice.transaction_count === 1
                ? "transação extraída"
                : "transações extraídas"}
            </div>
          )}

        {!isDeleting && invoice.status === "completed" && (
          <Link
            href={`/invoices/${invoice.id}?accountId=${accountId}`}
            className="mt-4 pt-4 border-t border-[var(--color-border-light)] flex items-center justify-between text-sm text-[var(--color-primary)] hover:text-[var(--color-positive)] transition-colors group"
          >
            <span>Ver detalhes da fatura</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {isDeleting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-[var(--color-negative)]/20"
          >
            <p className="text-sm text-[var(--color-negative)] font-medium flex items-center gap-2">
              <span className="animate-pulse">🗑️</span>
              Deletando fatura...
            </p>
          </motion.div>
        )}
      </CardGlass>
    </motion.div>
  );
}
