import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import {
  getReconciliationSuggestions,
  getReconciliationStats,
} from "@/actions/budget.actions";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import {
  MatchSuggestionCard,
  ReconciliationStats,
} from "@/components/budget/reconciliation";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's primary account
  const { data: accountMember } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  const accountId = (accountMember as { account_id: string } | null)
    ?.account_id;

  if (!accountId) {
    return <EmptyDashboard />;
  }

  // Fetch data in parallel
  const [suggestionsResult, statsResult] = await Promise.all([
    getReconciliationSuggestions(accountId),
    getReconciliationStats(accountId),
  ]);

  const suggestions = suggestionsResult.success ? suggestionsResult.data : [];
  const stats = statsResult.success ? statsResult.data : null;

  const pendingSuggestions = suggestions?.filter(
    (s) => s.expense.reconciliation_status === "pending",
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/budget">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Reconciliacao
            </h1>
            <p className="text-[var(--color-text-muted)]">
              Vincule seus gastos manuais com transacoes das faturas
            </p>
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link href="/budget/reconcile">
            <RefreshCw className="size-4 mr-2" />
            Atualizar
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && <ReconciliationStats stats={stats} />}

      {/* Pending Reconciliations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Gastos Pendentes ({pendingSuggestions?.length || 0})
          </h2>
        </div>

        {pendingSuggestions && pendingSuggestions.length > 0 ? (
          <div className="space-y-4">
            {pendingSuggestions.map((suggestion) => (
              <MatchSuggestionCard
                key={suggestion.expense.id}
                expense={suggestion.expense}
                matches={suggestion.matches}
                accountId={accountId}
              />
            ))}
          </div>
        ) : (
          <CardGlass variant="dark-1" size="lg" className="text-center py-12">
            <div className="space-y-3">
              <div className="mx-auto size-12 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center">
                <RefreshCw className="size-6 text-[var(--color-positive)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Tudo reconciliado!
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                Nao ha gastos pendentes de reconciliacao. Adicione novos gastos
                no orcamento e eles aparecerao aqui para serem vinculados com as
                transacoes das faturas.
              </p>
              <Link href="/budget">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="size-4 mr-2" />
                  Voltar ao Orcamento
                </Button>
              </Link>
            </div>
          </CardGlass>
        )}
      </div>

      {/* Help section */}
      <CardGlass variant="dark-1" size="lg">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Como funciona a reconciliacao
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-primary-start)]/10 flex items-center justify-center">
              <span className="text-xl">1</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Registre gastos
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Adicione seus gastos diarios no orcamento fluido com valor, data e
              descricao.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-primary-start)]/10 flex items-center justify-center">
              <span className="text-xl">2</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Sugestoes automaticas
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              O sistema encontra transacoes similares nas suas faturas baseado em
              valor, data e descricao.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-primary-start)]/10 flex items-center justify-center">
              <span className="text-xl">3</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Confirme ou rejeite
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Vincule os gastos corretos ou marque como sem correspondencia para
              manter seu historico organizado.
            </p>
          </div>
        </div>
      </CardGlass>
    </div>
  );
}
