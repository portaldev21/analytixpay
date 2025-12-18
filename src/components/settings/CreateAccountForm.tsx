"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { createAccount } from "@/actions/account.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardGlass } from "@/components/ui/card-glass";

const createAccountSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
});

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export function CreateAccountForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
  });

  const onSubmit = async (data: CreateAccountFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await createAccount(data.name);

    if (result.success) {
      setSuccess(true);
      reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Erro ao criar conta");
    }

    setIsLoading(false);
  };

  return (
    <CardGlass variant="dark-1" size="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Criar Nova Conta
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Contas permitem que voce compartilhe faturas com familia ou amigos
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl bg-[var(--color-negative)]/10 border border-[var(--color-negative)]/20 p-3 text-sm text-[var(--color-negative)]">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-[var(--color-positive)]/10 border border-[var(--color-positive)]/20 p-3 text-sm text-[var(--color-positive)] font-medium">
              Conta criada com sucesso!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              placeholder="Ex: Familia Silva"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-[var(--color-negative)]">
                {errors.name.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)] hover:shadow-[var(--shadow-glow-green)] transition-shadow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>
        </div>
      </form>
    </CardGlass>
  );
}
