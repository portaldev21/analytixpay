import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyDashboard } from "@/components/dashboard/EmptyDashboard";
import { PlanningList } from "@/components/planning/PlanningList";
import { Loading } from "@/components/shared/Loading";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const supabase = await createClient();

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Planejamento Financeiro
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Crie e gerencie seus planos financeiros com cenarios de projecao
        </p>
      </div>

      {/* Content */}
      <Suspense
        fallback={<Loading className="py-12" text="Carregando planos..." />}
      >
        <PlanningList accountId={accountId} />
      </Suspense>
    </div>
  );
}
