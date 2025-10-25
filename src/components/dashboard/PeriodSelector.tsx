"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Period options for filtering dashboard data
 */
const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
] as const;

/**
 * Period selector component for dashboard filtering
 */
export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={period} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
