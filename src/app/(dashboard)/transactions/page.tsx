import { Suspense } from "react"
import { CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getTransactions } from "@/actions/transaction.actions"
import { TransactionsTable } from "@/components/transactions/TransactionsTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { Loading } from "@/components/shared/Loading"

async function TransactionsList({ accountId }: { accountId: string }) {
  const result = await getTransactions(accountId, {})

  if (!result.success || !result.data) {
    return (
      <div className="text-center text-destructive p-8">
        Erro ao carregar transações
      </div>
    )
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Nenhuma transação encontrada"
        description="Faça upload de uma fatura para ver suas transações aqui"
      />
    )
  }

  return <TransactionsTable transactions={result.data} />
}

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: accountMember } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .single()

  const accountId = (accountMember as any)?.account_id

  if (!accountId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Visualizar todas as transações extraídas
          </p>
        </div>

        <div className="text-center p-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Você precisa criar uma conta primeiro. Vá em Configurações.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
        <p className="text-muted-foreground mt-1">
          Visualizar todas as transações extraídas das faturas
        </p>
      </div>

      <Suspense fallback={<Loading className="py-12" />}>
        <TransactionsList accountId={accountId} />
      </Suspense>
    </div>
  )
}
