import { Suspense } from "react"
import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getTransactionStats } from "@/actions/transaction.actions"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Loading } from "@/components/shared/Loading"
import { formatCurrency } from "@/lib/utils"

async function DashboardStats({ accountId }: { accountId: string }) {
  const stats = await getTransactionStats(accountId)

  if (!stats.success || !stats.data) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Erro ao carregar estatísticas
      </div>
    )
  }

  const { totalSpent, averageTransaction, transactionCount, categoryBreakdown } =
    stats.data

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Gasto Total"
        value={formatCurrency(totalSpent)}
        icon={DollarSign}
        description="Total gasto no período"
      />
      <StatsCard
        title="Média por Transação"
        value={formatCurrency(averageTransaction)}
        icon={TrendingUp}
        description="Valor médio das compras"
      />
      <StatsCard
        title="Total de Transações"
        value={transactionCount}
        icon={ShoppingCart}
        description="Compras realizadas"
      />
      <StatsCard
        title="Categorias"
        value={categoryBreakdown.length}
        icon={CreditCard}
        description="Categorias diferentes"
      />
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Pegar a primeira conta do usuário
  const { data: accountMember } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .single()

  const accountId = accountMember?.account_id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos seus gastos e transações
        </p>
      </div>

      {accountId ? (
        <Suspense fallback={<Loading className="py-12" />}>
          <DashboardStats accountId={accountId} />
        </Suspense>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">
            Você ainda não possui uma conta. Vá em Configurações para criar uma.
          </p>
        </div>
      )}
    </div>
  )
}
