"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Receipt, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { CardGlass } from "@/components/ui/card-glass";
import { Badge } from "@/components/ui/badge";
import type { TTransaction } from "@/db/types";

interface TransactionsTableProps {
  transactions: TTransaction[];
  showInvoiceLink?: boolean;
}

export function TransactionsTable({
  transactions,
  showInvoiceLink = true,
}: TransactionsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <CardGlass variant="dark-1" size="lg" className="text-center">
        <p className="text-[var(--color-text-muted)]">
          Nenhuma transação encontrada
        </p>
      </CardGlass>
    );
  }

  const handleDeleteStart = (id: string) => {
    setDeletingId(id);
  };

  // Helper to determine installment type
  const getInstallmentInfo = (installment: string | null) => {
    if (!installment) return null;
    const [current, total] = installment.split("/").map(Number);
    const isFirst = current === 1;
    const isLast = current === total;
    return { current, total, isFirst, isLast, text: installment };
  };

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {transactions.map((transaction) => {
          const installmentInfo = getInstallmentInfo(transaction.installment);

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                x: -50,
                scale: 0.95,
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              transition={{ duration: 0.2 }}
            >
              <CardGlass
                variant="dark-2"
                size="md"
                interactive
                className={
                  deletingId === transaction.id
                    ? "!bg-[var(--color-negative)]/10 !border-[var(--color-negative)]/50"
                    : ""
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Description and badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                        {transaction.description}
                      </h3>
                      <CategoryBadge category={transaction.category} />
                      {installmentInfo && (
                        <Badge
                          variant={
                            installmentInfo.isFirst
                              ? "positive"
                              : installmentInfo.isLast
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {installmentInfo.isFirst && "Nova: "}
                          {installmentInfo.text}
                          {installmentInfo.isLast && " (última)"}
                        </Badge>
                      )}
                      {transaction.is_international && (
                        <Badge variant="info" className="text-xs">
                          Internacional
                        </Badge>
                      )}
                    </div>

                    {/* Dates info */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Compra: {formatDate(transaction.date)}</span>
                      </div>
                      {transaction.billing_date && (
                        <div className="flex items-center gap-1">
                          <Receipt className="h-3.5 w-3.5" />
                          <span>
                            Vencimento: {formatDate(transaction.billing_date)}
                          </span>
                        </div>
                      )}
                      {showInvoiceLink && transaction.invoice_id && (
                        <Link
                          href={`/invoices/${transaction.invoice_id}`}
                          className="flex items-center gap-1 text-[var(--color-primary-start)] hover:text-[var(--color-positive)] transition-colors hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Ver fatura</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Amount and actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-semibold text-lg text-[var(--color-text-primary)] tabular-nums">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex gap-1">
                      <EditTransactionDialog transaction={transaction} />
                      <DeleteTransactionButton
                        transaction={transaction}
                        onDeleteStart={() => handleDeleteStart(transaction.id)}
                      />
                    </div>
                  </div>
                </div>
              </CardGlass>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
