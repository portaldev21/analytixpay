import { Suspense } from "react"
import { FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getInvoices, deleteInvoice } from "@/actions/invoice.actions"
import { UploadInvoice } from "@/components/invoices/UploadInvoice"
import { InvoiceCard } from "@/components/invoices/InvoiceCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Loading } from "@/components/shared/Loading"
import { Button } from "@/components/ui/button"

async function InvoicesList({ accountId }: { accountId: string }) {
  const result = await getInvoices(accountId)

  if (!result.success || !result.data) {
    return (
      <div className="text-center text-destructive p-8">
        Erro ao carregar faturas
      </div>
    )
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhuma fatura encontrada"
        description="Faça upload da sua primeira fatura de cartão de crédito"
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {result.data.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}

export default async function InvoicesPage() {
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

  const accountId = (accountMember as any)?.account_id

  if (!accountId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar faturas de cartão de crédito
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
        <h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciar faturas de cartão de crédito
        </p>
      </div>

      <UploadInvoice accountId={accountId} />

      <div>
        <h2 className="text-xl font-semibold mb-4">Faturas Enviadas</h2>
        <Suspense fallback={<Loading className="py-12" />}>
          <InvoicesList accountId={accountId} />
        </Suspense>
      </div>
    </div>
  )
}
