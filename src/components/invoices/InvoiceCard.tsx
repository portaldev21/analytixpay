import { FileText, Calendar, CreditCard, Trash2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { TInvoice } from "@/db/types"

interface InvoiceCardProps {
  invoice: TInvoice & { transaction_count?: number }
  onDelete?: (id: string) => void
}

export function InvoiceCard({ invoice, onDelete }: InvoiceCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{invoice.file_name}</h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.uploaded_at)}
                </div>
                {invoice.period_month && invoice.period_year && (
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {invoice.period_month}/{invoice.period_year}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Badge variant={invoice.status === "processed" ? "default" : "secondary"}>
            {invoice.status === "processed" ? "Processado" : "Pendente"}
          </Badge>
        </div>

        {invoice.card_last_four && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">Cartão: </span>
            <span className="font-medium">**** {invoice.card_last_four}</span>
          </div>
        )}

        {invoice.transaction_count !== undefined && invoice.transaction_count > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            {invoice.transaction_count} transações extraídas
          </div>
        )}
      </CardContent>

      {onDelete && (
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(invoice.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
