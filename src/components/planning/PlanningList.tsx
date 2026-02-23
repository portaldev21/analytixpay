"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlans } from "@/actions/planning.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loading } from "@/components/shared/Loading";
import type { TFinancialPlan } from "@/db/types";
import { CreatePlanDialog } from "./CreatePlanDialog";
import { PlanCard } from "./PlanCard";

interface PlanningListProps {
  accountId: string;
}

export function PlanningList({ accountId }: PlanningListProps) {
  const [plans, setPlans] = useState<TFinancialPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      const result = await getPlans(accountId);

      if (result.success && result.data) {
        setPlans(result.data);
        setError(null);
      } else {
        setError(result.error || "Erro ao carregar planos");
      }
      setLoading(false);
    }

    fetchPlans();
  }, [accountId]);

  if (loading) {
    return <Loading className="py-12" text="Carregando planos..." />;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-[var(--color-negative)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <CreatePlanDialog accountId={accountId} />
      </div>

      {/* Plans grid or empty state */}
      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum planejamento encontrado"
          description="Crie seu primeiro planejamento financeiro para projetar receitas, despesas e cenarios futuros."
          action={<CreatePlanDialog accountId={accountId} />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
