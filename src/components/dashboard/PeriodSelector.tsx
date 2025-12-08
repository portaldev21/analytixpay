"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Period options for filtering dashboard data
 */
const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Todo o período" },
] as const;

/**
 * Date type options
 */
const DATE_TYPES = [
  { value: "purchase", label: "Data da Compra", icon: CreditCard },
  { value: "billing", label: "Data da Fatura", icon: Calendar },
] as const;

/**
 * Period selector component for dashboard filtering
 */
export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const period = searchParams.get("period") || "30";
  const dateType = searchParams.get("dateType") || "billing"; // Default to billing date

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleDateTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateType", value);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      {/* Loading indicator */}
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {/* Date type toggle */}
      <div className={cn(
        "flex rounded-lg border bg-muted p-1 gap-1 transition-opacity",
        isPending && "opacity-70 pointer-events-none"
      )}>
        {DATE_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => handleDateTypeChange(type.value)}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-all",
              dateType === type.value
                ? "bg-background text-foreground shadow-sm border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <type.icon className="h-3.5 w-3.5" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <Select value={period} onValueChange={handlePeriodChange} disabled={isPending}>
        <SelectTrigger className={cn(
          "w-[160px] transition-opacity",
          isPending && "opacity-70"
        )}>
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
