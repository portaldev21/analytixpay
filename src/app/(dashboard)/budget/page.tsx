import { redirect } from "next/navigation";
import Link from "next/link";
import { Link2, TrendingUp } from "lucide-react";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveBudgetConfig,
  getTodayBudget,
  getWeekSummary,
  getExpensesForDate,
} from "@/actions/budget.actions";
import { formatDateToString, getToday } from "@/lib/budget/calculations";
import {
  TodayBudgetCard,
  WeekSummaryCard,
  ExpenseForm,
  ExpenseList,
  EmptyBudgetState,
} from "@/components/budget";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
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
  const today = getToday();
  const todayStr = formatDateToString(today);

  // Check if budget is configured
  const configResult = await getActiveBudgetConfig(accountId);

  // If no config, show setup screen
  if (!configResult.success || !configResult.data) {
    return (
      <div className="p-6">
        <EmptyBudgetState accountId={accountId} />
      </div>
    );
  }

  // Fetch budget data in parallel
  const [todayBudgetResult, weekSummaryResult, expensesResult] =
    await Promise.all([
      getTodayBudget(accountId),
      getWeekSummary(accountId),
      getExpensesForDate(accountId, todayStr),
    ]);

  const todayBudget = todayBudgetResult.success ? todayBudgetResult.data : null;
  const weekSummary = weekSummaryResult.success ? weekSummaryResult.data : null;
  const expenses = expensesResult.success ? expensesResult.data : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Orcamento Fluido
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Gerencie seu orcamento diario dinamicamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/budget/forecast">
              <TrendingUp className="size-4 mr-2" />
              Previsao
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/budget/reconcile">
              <Link2 className="size-4 mr-2" />
              Reconciliar
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content */}
      {todayBudget ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <TodayBudgetCard data={todayBudget} />
            <ExpenseForm accountId={accountId} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {weekSummary && <WeekSummaryCard data={weekSummary} />}
            <ExpenseList
              expenses={expenses || []}
              accountId={accountId}
            />
          </div>
        </div>
      ) : (
        <CardGlass variant="dark-1" size="lg" className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">
            Erro ao carregar dados do orcamento. Tente novamente.
          </p>
        </CardGlass>
      )}

      {/* Budget info */}
      <CardGlass variant="dark-1" size="lg">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Como funciona o Orcamento Fluido
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-positive)]/10 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Economia e Recompensa
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Gastos abaixo do orcamento geram credito extra para os proximos dias.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-negative)]/10 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Excesso e Compensacao
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Gastos acima do orcamento reduzem o orcamento dos proximos dias.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-primary-start)]/10 flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Ciclo Semanal
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              A cada semana, o ciclo reinicia e o saldo e distribuido.
            </p>
          </div>
        </div>
      </CardGlass>
    </div>
  );
}
