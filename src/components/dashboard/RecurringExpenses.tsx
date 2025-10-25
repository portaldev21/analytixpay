"use client";

import { Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecurringTransaction } from "@/lib/analytics/recurring";

interface RecurringExpensesProps {
  data: RecurringTransaction[];
}

/**
 * Get frequency badge label
 */
function getFrequencyLabel(
  frequency: RecurringTransaction["frequency"],
): string {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
  }
}

/**
 * Get confidence color
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-green-600";
  if (confidence >= 60) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Recurring expenses component
 */
export function RecurringExpenses({ data }: RecurringExpensesProps) {
  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          No recurring transactions detected
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Recurring patterns will appear after you have more transaction history
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Recurring Expenses</h3>
          <p className="text-sm text-muted-foreground">
            Subscriptions and fixed costs detected
          </p>
        </div>
        <Badge variant="secondary">{data.length} found</Badge>
      </div>

      <div className="space-y-3">
        {data.map((recurring, idx) => (
          <div
            key={idx}
            className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {recurring.description}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {getFrequencyLabel(recurring.frequency)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {recurring.occurrences.length} occurrences
                  </span>
                  <span
                    className={`text-xs ${getConfidenceColor(recurring.confidence)}`}
                  >
                    {recurring.confidence}% confidence
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="font-semibold">
                  {formatCurrency(recurring.averageAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  avg/
                  {recurring.frequency === "monthly"
                    ? "month"
                    : recurring.frequency === "weekly"
                      ? "week"
                      : "year"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Next expected: {formatDate(recurring.nextExpectedDate)}
            </div>

            {recurring.confidence < 80 && (
              <div className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                <span>⚠️</span>
                <span>Low confidence pattern ({recurring.confidence}%)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Estimated monthly cost:</span>{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(
                data.reduce((total, r) => {
                  const monthlyCost =
                    r.frequency === "monthly"
                      ? r.averageAmount
                      : r.frequency === "weekly"
                        ? r.averageAmount * 4.33
                        : r.averageAmount / 12;
                  return total + monthlyCost;
                }, 0),
              )}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
