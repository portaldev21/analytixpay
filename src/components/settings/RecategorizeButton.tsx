"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          `${response.data.updated} de ${response.data.total} transações recategorizadas!`
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Recategorizar com IA
        </CardTitle>
        <CardDescription>
          Use inteligência artificial para recategorizar suas transações
          existentes de forma mais precisa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Esta funcionalidade analisa todas as suas transações e atribui
            categorias mais precisas usando GPT-4o-mini.
          </p>
          <p className="mt-2">
            <strong>Custo estimado:</strong> ~$0.001 - $0.005 (menos de 1 centavo de dólar)
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm">
              {result.updated} de {result.total} transações atualizadas
            </span>
          </div>
        )}

        <Button
          onClick={handleRecategorize}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recategorizando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Recategorizar Transações
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Requer OPENAI_API_KEY configurada no .env.local
        </p>
      </CardContent>
    </Card>
  );
}
