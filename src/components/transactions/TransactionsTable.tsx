"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TTransaction } from "@/db/types";

interface TransactionsTableProps {
  transactions: TTransaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </Card>
    );
  }

  const handleDeleteStart = (id: string) => {
    setDeletingId(id);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {transactions.map((transaction) => (
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
            <Card
              className={`p-4 transition-all ${
                deletingId === transaction.id
                  ? "bg-red-500/10 border-red-500/50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">
                      {transaction.description}
                    </h3>
                    <CategoryBadge category={transaction.category} />
                    {transaction.installment && (
                      <Badge variant="secondary" className="text-xs">
                        {transaction.installment}
                      </Badge>
                    )}
                    {transaction.is_international && (
                      <Badge variant="secondary" className="text-xs">
                        Internacional
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-semibold text-lg">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex flex-col gap-1">
                    <EditTransactionDialog transaction={transaction} />
                    <DeleteTransactionButton
                      transaction={transaction}
                      onDeleteStart={() => handleDeleteStart(transaction.id)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
