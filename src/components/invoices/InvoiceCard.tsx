import { FileText, Calendar, CreditCard } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DeleteInvoiceButton } from "./DeleteInvoiceButton"
import type { TInvoice } from "@/db/types"

interface InvoiceCardProps {
  invoice: TInvoice & { transaction_count?: number }
  accountId: string
  showDelete?: boolean
}

export function InvoiceCard({ invoice, accountId, showDelete = true }: InvoiceCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{invoice.file_name}</h3>
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
            <Badge variant={invoice.status === "completed" ? "default" : invoice.status === "error" ? "destructive" : "secondary"}>
              {invoice.status === "completed" ? "Processado" : invoice.status === "error" ? "Erro" : "Processando"}
            </Badge>
            {showDelete && (
              <DeleteInvoiceButton
                invoiceId={invoice.id}
                accountId={accountId}
                invoiceName={invoice.period || invoice.file_name}
                transactionCount={invoice.transaction_count}
              />
            )}
          </div>
        </div>

        {invoice.card_last_digits && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">Cartão: </span>
            <span className="font-medium">**** {invoice.card_last_digits}</span>
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

        {invoice.transaction_count !== undefined && invoice.transaction_count > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {invoice.transaction_count} {invoice.transaction_count === 1 ? "transação extraída" : "transações extraídas"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
