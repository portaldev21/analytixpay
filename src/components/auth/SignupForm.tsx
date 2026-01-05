"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { signupSchema } from "@/lib/validations";
import { signup } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardGlass } from "@/components/ui/card-glass";

type SignupFormData = {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signup(
      data.email,
      data.password,
      data.confirmPassword,
      data.fullName,
    );

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Erro ao criar conta");
      setIsLoading(false);
    }
  };

  return (
    <CardGlass variant="default" size="lg" className="w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Criar Conta
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Preencha os dados abaixo para criar sua conta
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl bg-[var(--color-negative)]/10 border border-[var(--color-negative)]/20 p-3 text-sm text-[var(--color-negative)]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Seu nome completo"
              {...register("fullName")}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-[var(--color-negative)]">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-[var(--color-negative)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-[var(--color-negative)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-[var(--color-negative)]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-6">
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:shadow-[var(--shadow-md)] transition-shadow"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>

          <p className="text-sm text-[var(--color-text-muted)] text-center">
            Ja tem uma conta?{" "}
            <Link
              href="/login"
              className="text-[var(--color-primary)] hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </CardGlass>
  );
}
