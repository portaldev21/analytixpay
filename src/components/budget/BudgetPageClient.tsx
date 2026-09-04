"use client";

import { useState, useTransition } from "react";
import { getExpensesForDate } from "@/actions/budget.actions";
import type {
  TBudgetExpense,
  TTodayBudgetResponse,
  TWeekSummary,
} from "@/db/types";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { TodayBudgetCard } from "./TodayBudgetCard";
import { WeekSummaryCard } from "./WeekSummaryCard";

interface BudgetPageClientProps {
  todayBudget: TTodayBudgetResponse;
  weekSummary: TWeekSummary | null;
  initialExpenses: TBudgetExpense[];
  accountId: string;
  todayStr: string;
}

export function BudgetPageClient({
  todayBudget,
  weekSummary,
  initialExpenses,
  accountId,
  todayStr,
}: BudgetPageClientProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [expenses, setExpenses] = useState<TBudgetExpense[]>(initialExpenses);
  const [isLoadingExpenses, startTransition] = useTransition();

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    startTransition(async () => {
      const result = await getExpensesForDate(accountId, date);
      if (result.success && result.data) {
        setExpenses(result.data);
      }
    });
  };

  const handleExpenseChange = () => {
    startTransition(async () => {
      const result = await getExpensesForDate(accountId, selectedDate);
      if (result.success && result.data) {
        setExpenses(result.data);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column */}
      <div className="space-y-6">
        <TodayBudgetCard data={todayBudget} />
        <ExpenseForm
          accountId={accountId}
          selectedDate={selectedDate}
          onSuccess={handleExpenseChange}
        />
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {weekSummary && (
          <WeekSummaryCard
            data={weekSummary}
            selectedDate={selectedDate}
            onSelectDate={handleDateChange}
          />
        )}
        <ExpenseList
          expenses={expenses}
          accountId={accountId}
          selectedDate={selectedDate}
          isLoading={isLoadingExpenses}
          onDelete={handleExpenseChange}
        />
      </div>
    </div>
  );
}
