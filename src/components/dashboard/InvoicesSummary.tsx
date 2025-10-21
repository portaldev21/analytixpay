"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText } from "lucide-react";

interface InvoicesSummaryProps {
  data: {
    invoiceId: string;
    period: string;
    cardLastDigits: string | null;
    totalAmount: number;
    transactionCount: number;
  }[];
}

export function InvoicesSummary({ data }: InvoicesSummaryProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          Nenhuma fatura encontrada
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Faturas Recentes</h3>
        <p className="text-sm text-muted-foreground">
          Resumo das últimas faturas processadas
        </p>
      </div>

      <div className="space-y-3">
        {data.slice(0, 5).map((invoice) => (
          <div
            key={invoice.invoiceId}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-full bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{invoice.period}</div>
                <div className="text-sm text-muted-foreground">
                  {invoice.transactionCount} transações
                  {invoice.cardLastDigits && (
                    <span className="ml-2">
                      •••• {invoice.cardLastDigits}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-semibold">
                {formatCurrency(invoice.totalAmount)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <div className="mt-4 text-center">
          <Badge variant="secondary" className="text-xs">
            +{data.length - 5} faturas anteriores
          </Badge>
        </div>
      )}
    </Card>
  );
}
