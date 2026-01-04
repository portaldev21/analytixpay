import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { getBudgetForecast } from "@/actions/budget.actions";
import {
  BudgetImpactCard,
  MonthlyProjectionChart,
  InstallmentsCalendar,
  ActiveInstallmentsList,
} from "@/components/budget/forecast";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BudgetForecastPage() {
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

  // Fetch forecast data (6 months ahead)
  const forecastResult = await getBudgetForecast(accountId, 6);

  if (!forecastResult.success || !forecastResult.data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/budget">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Previsao de Orcamento
          </h1>
        </div>
        <CardGlass variant="dark-1" size="lg" className="text-center py-12">
          <p className="text-[var(--color-text-muted)]">
            Erro ao carregar dados da previsao: {forecastResult.error}
          </p>
        </CardGlass>
      </div>
    );
  }

  const forecast = forecastResult.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/budget">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Previsao de Orcamento
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Veja o impacto das parcelas futuras no seu orcamento
          </p>
        </div>
      </div>

      {/* Budget Impact Card - Hero */}
      <BudgetImpactCard forecast={forecast} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Projection Chart */}
        <MonthlyProjectionChart
          data={forecast.monthly_projections}
          monthlyBudget={forecast.budget_config?.monthly_budget}
        />

        {/* Calendar */}
        <InstallmentsCalendar events={forecast.calendar_events} />
      </div>

      {/* Active Installments List */}
      <ActiveInstallmentsList installments={forecast.active_installments} />

      {/* Summary Info */}
      <CardGlass variant="dark-1" size="lg">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Entendendo a Previsao
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-positive)]/10 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Impacto no Orcamento
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Mostra quanto das parcelas comprometem seu orcamento diario, semanal e mensal.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-[var(--color-primary-start)]/10 flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Calendario de Parcelas
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Visualize quando cada parcela sera cobrada nos proximos meses.
            </p>
          </div>
          <div className="space-y-2">
            <div className="size-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <span className="text-xl">💳</span>
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)]">
              Parcelas Ativas
            </h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              Acompanhe o progresso de cada compra parcelada e quanto ainda falta pagar.
            </p>
          </div>
        </div>
      </CardGlass>
    </div>
  );
}
