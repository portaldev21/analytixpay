import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPlanWithDetails } from "@/actions/planning.actions";
import { PlanningEditor } from "@/components/planning/PlanningEditor";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PlanningEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanningEditorPage({
  params,
}: PlanningEditorPageProps) {
  const { id } = await params;

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
    redirect("/settings");
  }

  const result = await getPlanWithDetails(id, accountId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Link href="/planning">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Planejamento Financeiro
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Edite receitas, despesas e cenarios de projecao
          </p>
        </div>
      </div>

      {/* Editor */}
      <PlanningEditor initialPlan={result.data} accountId={accountId} />
    </div>
  );
}
