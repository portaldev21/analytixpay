"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardGlass } from "@/components/ui/card-glass";
import { recategorizeTransactionsWithAI } from "@/actions/analytics.actions";
import { toast } from "sonner";

interface RecategorizeButtonProps {
  accountId: string;
}

export function RecategorizeButton({ accountId }: RecategorizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    total: number;
  } | null>(null);

  const handleRecategorize = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await recategorizeTransactionsWithAI(accountId);

      if (response.success && response.data) {
        setResult(response.data);
        toast.success(
          `${response.data.updated} de ${response.data.total} transações recategorizadas!`,
        );
      } else {
        toast.error(response.error || "Erro ao recategorizar transações");
      }
    } catch (error) {
      toast.error("Erro ao recategorizar transações");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardGlass variant="default" size="lg">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
          <div className="p-2 rounded-lg bg-[var(--color-purple-light)]/20">
            <Sparkles className="h-5 w-5 text-[var(--color-purple-light)]" />
          </div>
          Recategorizar com IA
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Use inteligencia artificial para recategorizar suas transacoes
          existentes de forma mais precisa
        </p>
      </div>
      <div className="space-y-4">
        <div className="text-sm text-[var(--color-text-muted)]">
          <p>
            Esta funcionalidade analisa todas as suas transacoes e atribui
            categorias mais precisas usando Claude AI.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 p-3 bg-[var(--color-positive)]/10 border border-[var(--color-positive)]/20 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-positive)]" />
            <span className="text-sm text-[var(--color-positive)]">
              {result.updated} de {result.total} transacoes atualizadas
            </span>
          </div>
        )}

        <Button
          onClick={handleRecategorize}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[var(--color-purple-light)] to-[var(--color-purple-mid)] hover:shadow-[var(--shadow-glow-purple)] transition-shadow"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recategorizando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Recategorizar Transacoes
            </>
          )}
        </Button>

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Requer ANTHROPIC_API_KEY configurada no .env.local
        </p>
      </div>
    </CardGlass>
  );
}
