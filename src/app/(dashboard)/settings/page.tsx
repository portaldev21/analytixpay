import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CreateAccountForm } from "@/components/settings/CreateAccountForm";
import { RecategorizeButton } from "@/components/settings/RecategorizeButton";
import { MigrateInvoices } from "@/components/settings/MigrateInvoices";
import { CardGlass } from "@/components/ui/card-glass";
import { Loading } from "@/components/shared/Loading";
import { Badge } from "@/components/ui/badge";

async function AccountInfo({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("account_members")
    .select(`
      role,
      account:accounts (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", userId);

  if (!accounts || accounts.length === 0) {
    return null;
  }

  // Get primary account ID for AI features
  const primaryAccountId = (accounts[0] as any)?.account?.id;

  return (
    <>
      <CardGlass variant="dark-1" size="lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Suas Contas
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Contas as quais voce tem acesso
          </p>
        </div>
        <div className="space-y-3">
          {accounts.map((item: any) => (
            <div
              key={item.account.id}
              className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-card-dark-2)] border border-[var(--glass-border)]"
            >
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {item.account.name}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Criada em{" "}
                  {new Date(item.account.created_at).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
              </div>
              <Badge variant={item.role === "owner" ? "default" : "glass"}>
                {item.role === "owner" ? "Proprietario" : "Membro"}
              </Badge>
            </div>
          ))}
        </div>
      </CardGlass>

      {primaryAccountId && <RecategorizeButton accountId={primaryAccountId} />}

      {primaryAccountId && <MigrateInvoices accountId={primaryAccountId} />}
    </>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Configuracoes
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          Gerenciar contas e preferencias
        </p>
      </div>

      <div className="grid gap-6">
        <CreateAccountForm />

        <Suspense fallback={<Loading className="py-12" />}>
          <AccountInfo userId={user.id} />
        </Suspense>

        <CardGlass variant="dark-1" size="lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Informacoes do Perfil
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Seus dados de usuario
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-[var(--color-text-muted)]">
                Email
              </div>
              <p className="mt-1 text-[var(--color-text-primary)]">
                {user.email}
              </p>
            </div>
            {user.user_metadata?.name && (
              <div>
                <div className="text-sm font-medium text-[var(--color-text-muted)]">
                  Nome
                </div>
                <p className="mt-1 text-[var(--color-text-primary)]">
                  {user.user_metadata.name}
                </p>
              </div>
            )}
          </div>
        </CardGlass>
      </div>
    </div>
  );
}

function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
