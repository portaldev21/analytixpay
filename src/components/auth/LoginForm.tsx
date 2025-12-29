"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { loginSchema } from "@/lib/validations";
import { login } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardGlass } from "@/components/ui/card-glass";

type LoginFormData = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("[LoginForm] Submit started");
    setIsLoading(true);
    setError(null);

    console.log("[LoginForm] Calling login action...");
    const result = await login(data.email, data.password);
    console.log("[LoginForm] Login result:", result);

    if (result.success) {
      console.log("[LoginForm] Success, redirecting to dashboard...");
      router.push("/dashboard");
      router.refresh();
    } else {
      console.log("[LoginForm] Error:", result.error);
      setError(result.error || "Erro ao fazer login");
      setIsLoading(false);
    }
  };

  return (
    <CardGlass variant="dark-1" size="lg" className="w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Entrar
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Entre com seu email e senha para acessar sua conta
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
        </div>

        <div className="flex flex-col space-y-4 mt-6">
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)] hover:shadow-[var(--shadow-glow-green)] transition-shadow"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <p className="text-sm text-[var(--color-text-muted)] text-center">
            Nao tem uma conta?{" "}
            <Link
              href="/signup"
              className="text-[var(--color-primary-start)] hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </form>
    </CardGlass>
  );
}
