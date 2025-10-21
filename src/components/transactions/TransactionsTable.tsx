import { formatCurrency, formatDate } from "@/lib/utils"
import { CategoryBadge } from "./CategoryBadge"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TTransaction } from "@/db/types"

interface TransactionsTableProps {
  transactions: TTransaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{transaction.description}</h3>
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
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-lg">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
