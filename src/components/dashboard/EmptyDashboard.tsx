import Link from "next/link";
import { FileText, Upload, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state for dashboard when no data exists
 */
export function EmptyDashboard() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <FileText className="h-24 w-24 mx-auto text-muted-foreground/30" />
        </div>

        <h2 className="text-2xl font-bold mb-3">Ainda não há transações</h2>

        <p className="text-muted-foreground mb-8">
          Faça upload da sua primeira fatura de cartão de crédito para começar a
          acompanhar seus gastos e obter insights sobre seus padrões de consumo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/invoices">
              <Upload className="mr-2 h-5 w-5" />
              Enviar Fatura
            </Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-left">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Dicas Rápidas
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>
                Suporta PDFs de todos os principais bancos brasileiros
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Extração automática de transações e categorização</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Acompanhe gastos de múltiplos cartões e contas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Compartilhe contas com membros da família</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
