import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CreateAccountForm } from "@/components/settings/CreateAccountForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas Contas</CardTitle>
        <CardDescription>Contas às quais você tem acesso</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((item: any) => (
            <div
              key={item.account.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{item.account.name}</p>
                <p className="text-sm text-muted-foreground">
                  Criada em{" "}
                  {new Date(item.account.created_at).toLocaleDateString(
                    "pt-BR",
                  )}
                </p>
              </div>
              <Badge variant={item.role === "owner" ? "default" : "secondary"}>
                {item.role === "owner" ? "Proprietário" : "Membro"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciar contas e preferências
        </p>
      </div>

      <div className="grid gap-6">
        <CreateAccountForm />

        <Suspense fallback={<Loading className="py-12" />}>
          <AccountInfo userId={user.id} />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>Seus dados de usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Email
              </Label>
              <p className="mt-1">{user.email}</p>
            </div>
            {user.user_metadata?.name && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Nome
                </Label>
                <p className="mt-1">{user.user_metadata.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
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
