"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  period: string | null;
  billing_date: string | null;
}

interface TransactionFiltersProps {
  invoices: Invoice[];
  categories: string[];
}

const INSTALLMENT_OPTIONS = [
  { value: "all", label: "Todas as Parcelas" },
  { value: "current", label: "Parcelas Novas (1/X)" },
  { value: "past", label: "Parcelas Anteriores (2+/X)" },
  { value: "none", label: "Compras à Vista" },
];

export function TransactionFilters({
  invoices,
  categories,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentInvoice = searchParams.get("invoiceId") || "";
  const currentInstallment = searchParams.get("installment") || "";
  const currentCategory = searchParams.get("category") || "";

  const hasActiveFilters =
    currentInvoice || currentInstallment || currentCategory;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/transactions?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/transactions");
  };

  const formatInvoiceLabel = (invoice: Invoice) => {
    const period = invoice.period || "Sem período";
    const date = invoice.billing_date
      ? new Date(invoice.billing_date).toLocaleDateString("pt-BR")
      : "";
    return date ? `${period} - Venc. ${date}` : period;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Filtros
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-negative)]"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Invoice Filter */}
        <Select
          value={currentInvoice || "all"}
          onValueChange={(value) => updateFilter("invoiceId", value)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecionar fatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as faturas</SelectItem>
            {invoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                {formatInvoiceLabel(invoice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Installment Filter */}
        <Select
          value={currentInstallment || "all"}
          onValueChange={(value) => updateFilter("installment", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de parcela" />
          </SelectTrigger>
          <SelectContent>
            {INSTALLMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={currentCategory || "all"}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentInvoice && (
            <Badge variant="glass" className="gap-1 pr-1">
              <span className="text-[var(--color-text-muted)]">Fatura:</span>{" "}
              {invoices.find((i) => i.id === currentInvoice)?.period ||
                "Selecionada"}
              <button
                onClick={() => updateFilter("invoiceId", "")}
                className="ml-1 p-0.5 rounded hover:bg-[var(--color-negative)]/20 hover:text-[var(--color-negative)] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentInstallment && (
            <Badge variant="glass" className="gap-1 pr-1">
              {
                INSTALLMENT_OPTIONS.find((o) => o.value === currentInstallment)
                  ?.label
              }
              <button
                onClick={() => updateFilter("installment", "")}
                className="ml-1 p-0.5 rounded hover:bg-[var(--color-negative)]/20 hover:text-[var(--color-negative)] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentCategory && (
            <Badge variant="glass" className="gap-1 pr-1">
              {currentCategory}
              <button
                onClick={() => updateFilter("category", "")}
                className="ml-1 p-0.5 rounded hover:bg-[var(--color-negative)]/20 hover:text-[var(--color-negative)] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
