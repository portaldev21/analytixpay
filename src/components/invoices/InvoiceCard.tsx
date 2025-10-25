"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card
        className={`transition-all ${
          isDeleting
            ? "bg-destructive/10 border-destructive/50 shadow-lg shadow-destructive/20"
            : ""
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={`rounded-lg p-2 flex-shrink-0 transition-colors ${
                  isDeleting ? "bg-destructive/20" : "bg-primary/10"
                }`}
              >
                <FileText
                  className={`h-5 w-5 transition-colors ${
                    isDeleting ? "text-destructive" : "text-primary"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className={`font-semibold truncate transition-colors ${
                    isDeleting ? "text-destructive" : ""
                  }`}
                >
                  {invoice.file_name}
                </h3>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(invoice.created_at)}
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
                    ? "default"
                    : invoice.status === "error"
                      ? "destructive"
                      : "secondary"
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
              <span className="text-muted-foreground">Cartão: </span>
              <span className="font-medium">
                **** {invoice.card_last_digits}
              </span>
            </div>
          )}

          {invoice.total_amount && (
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-lg">
                {formatCurrency(Number(invoice.total_amount))}
              </span>
            </div>
          )}

          {invoice.transaction_count !== undefined &&
            invoice.transaction_count > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {invoice.transaction_count}{" "}
                {invoice.transaction_count === 1
                  ? "transação extraída"
                  : "transações extraídas"}
              </div>
            )}

          {isDeleting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-destructive/20"
            >
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <span className="animate-pulse">🗑️</span>
                Deletando fatura...
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
