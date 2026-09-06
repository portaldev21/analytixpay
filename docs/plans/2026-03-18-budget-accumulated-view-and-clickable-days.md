# Budget Accumulated View & Clickable Days Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a day-by-day accumulated table to WeekSummaryCard and make weekday buttons clickable to view/edit expenses for any day in the cycle.

**Architecture:** Create a BudgetPageClient wrapper component that manages `selectedDate` state shared between WeekSummaryCard, ExpenseForm, and ExpenseList. Add calculation helpers for running accumulated totals. Replace the 2x2 stats grid in WeekSummaryCard with a compact day-by-day table.

**Tech Stack:** React (client components), Next.js Server Actions, existing Supabase budget tables, Framer Motion, Tailwind CSS

---

### Task 1: Add accumulated calculation helpers

**Files:**
- Modify: `src/lib/budget/calculations.ts`
- Test: `src/lib/analytics/__tests__/` (or co-located test)

- [ ] **Step 1: Add `calculateRunningAccumulated` function**

Add to `src/lib/budget/calculations.ts`:

```typescript
/**
 * Calculates running accumulated spending across daily records.
 * Records must be sorted by date ascending.
 *
 * @param dailyRecords - Array of daily records sorted by date
 * @returns Array of cumulative spent totals, one per record
 */
export function calculateRunningAccumulated(
  dailyRecords: { total_spent: number }[],
): number[] {
  const result: number[] = [];
  let sum = 0;
  for (const record of dailyRecords) {
    sum += record.total_spent;
    result.push(Math.round(sum * 100) / 100);
  }
  return result;
}

/**
 * Calculates available budget per remaining day from a given point.
 *
 * @param totalBudget - Total cycle budget
 * @param accumulatedSpent - Total spent up to this point
 * @param remainingDays - Days remaining from this point (including this day)
 * @returns Available per day
 */
export function calculateAvailablePerDay(
  totalBudget: number,
  accumulatedSpent: number,
  remainingDays: number,
): number {
  if (remainingDays <= 0) return 0;
  return Math.round(((totalBudget - accumulatedSpent) / remainingDays) * 100) / 100;
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/budget/calculations.ts
git commit -m "feat(budget): add accumulated and available-per-day calculation helpers"
```

---

### Task 2: Create BudgetPageClient wrapper component

**Files:**
- Create: `src/components/budget/BudgetPageClient.tsx`
- Modify: `src/components/budget/index.ts`

- [ ] **Step 1: Create BudgetPageClient**

Create `src/components/budget/BudgetPageClient.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { getExpensesForDate } from "@/actions/budget.actions";
import type { TBudgetExpense, TTodayBudgetResponse, TWeekSummary } from "@/db/types";
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
    // Reload expenses for selected date
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
```

- [ ] **Step 2: Export from index**

Add to `src/components/budget/index.ts`:

```typescript
export { BudgetPageClient } from "./BudgetPageClient";
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Errors about new props on WeekSummaryCard/ExpenseForm/ExpenseList — expected, will be fixed in next tasks.

- [ ] **Step 4: Commit**

```bash
git add src/components/budget/BudgetPageClient.tsx src/components/budget/index.ts
git commit -m "feat(budget): create BudgetPageClient wrapper with selectedDate state"
```

---

### Task 3: Update WeekSummaryCard with clickable days and accumulated table

**Files:**
- Modify: `src/components/budget/WeekSummaryCard.tsx`

- [ ] **Step 1: Update WeekSummaryCard props and add accumulated table**

Replace the full content of `src/components/budget/WeekSummaryCard.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { CardGlass } from "@/components/ui/card-glass";
import type { TWeekSummary } from "@/db/types";
import {
  calculateAvailablePerDay,
  calculateRunningAccumulated,
  formatDateToString,
  parseDateString,
} from "@/lib/budget/calculations";
import { cn, formatCurrency } from "@/lib/utils";

interface WeekSummaryCardProps {
  data: TWeekSummary;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
}

export function WeekSummaryCard({
  data,
  selectedDate,
  onSelectDate,
  className,
}: WeekSummaryCardProps) {
  const progressPercent = (data.total_spent / data.total_budget) * 100;
  const todayStr = formatDateToString(new Date());

  // Build array of all days in the cycle
  const cycleStart = parseDateString(data.cycle.start_date);
  const cycleEnd = parseDateString(data.cycle.end_date);
  const cycleDays: string[] = [];
  const current = new Date(cycleStart);
  while (current <= cycleEnd) {
    cycleDays.push(formatDateToString(current));
    current.setDate(current.getDate() + 1);
  }

  // Map daily records by date for quick lookup
  const recordsByDate = new Map(
    data.daily_records.map((r) => [r.record_date, r]),
  );

  // Sort records by date for accumulated calculation
  const sortedRecords = [...data.daily_records].sort(
    (a, b) => a.record_date.localeCompare(b.record_date),
  );

  // Calculate running accumulated
  const accumulatedValues = calculateRunningAccumulated(sortedRecords);
  const accumulatedByDate = new Map(
    sortedRecords.map((r, i) => [r.record_date, accumulatedValues[i]]),
  );

  // Day abbreviations in Portuguese (Sunday=0 to Saturday=6)
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Format dates for header
  const formatHeaderDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <CardGlass variant="default" size="lg" interactive className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
            Resumo da Semana
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatHeaderDate(cycleStart)} - {formatHeaderDate(cycleEnd)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-surface-muted)]">
          <Calendar className="size-5 text-[var(--color-text-muted)]" />
        </div>
      </div>

      {/* Clickable week day buttons */}
      <div className="flex gap-1 mb-4">
        {cycleDays.map((dateStr) => {
          const dayOfWeek = parseDateString(dateStr).getDay();
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasRecord = recordsByDate.has(dateStr);
          const isFuture = dateStr > todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDate?.(dateStr)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors relative",
                isSelected
                  ? "bg-[var(--color-primary)] text-white"
                  : isToday
                    ? "bg-[var(--color-surface-muted)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                    : hasRecord
                      ? "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]/80"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
                isFuture && "opacity-50 cursor-not-allowed",
                !isFuture && !isSelected && "cursor-pointer",
              )}
            >
              <span className="text-xs font-medium">{dayLabels[dayOfWeek]}</span>
              {/* Dot indicator for days with expenses */}
              {hasRecord && !isSelected && (
                <span className="size-1 rounded-full bg-[var(--color-positive)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Budget progress bar */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-muted)]">
            Orcamento semanal
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.total_budget)}
          </span>
        </div>

        <div className="h-2 bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              progressPercent > 100
                ? "bg-gradient-to-r from-[var(--color-negative)] to-red-400"
                : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-positive)]",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--color-text-muted)]">Gasto ate agora</span>
          <span className="font-medium text-[var(--color-text-primary)] tabular-nums">
            {formatCurrency(data.total_spent)}
          </span>
        </div>
      </div>

      {/* Day-by-day accumulated table */}
      <div className="border-t border-[var(--color-border-light)] pt-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-muted)]">
              <th className="text-left font-medium pb-2">Dia</th>
              <th className="text-right font-medium pb-2">Gasto</th>
              <th className="text-right font-medium pb-2">Disp/dia</th>
              <th className="text-right font-medium pb-2">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {cycleDays.map((dateStr) => {
              const record = recordsByDate.get(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isFuture = dateStr > todayStr;
              const accumulated = accumulatedByDate.get(dateStr);

              // Calculate available per day from this point
              const totalAccumulated = accumulated ?? (accumulatedByDate.size > 0
                ? [...accumulatedByDate.values()].pop() ?? 0
                : 0);
              const daysLeft = cycleDays.filter((d) => d >= dateStr).length;
              const availPerDay = record
                ? calculateAvailablePerDay(data.total_budget, totalAccumulated, daysLeft)
                : isFuture
                  ? calculateAvailablePerDay(
                      data.total_budget,
                      // For future days use last known accumulated
                      [...accumulatedByDate.values()].pop() ?? 0,
                      daysLeft,
                    )
                  : null;

              const dayDate = parseDateString(dateStr);
              const dayLabel = dayDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              });

              return (
                <tr
                  key={dateStr}
                  onClick={() => !isFuture && onSelectDate?.(dateStr)}
                  className={cn(
                    "border-b border-[var(--color-border-light)]/50 last:border-0",
                    isSelected && "bg-[var(--color-primary)]/10",
                    isToday && !isSelected && "bg-[var(--color-surface-muted)]",
                    !isFuture && "cursor-pointer hover:bg-[var(--color-surface-muted)]/50",
                    isFuture && "opacity-50",
                  )}
                >
                  <td className={cn(
                    "py-1.5 text-left",
                    isToday && "font-semibold text-[var(--color-primary)]",
                  )}>
                    {dayLabel}
                  </td>
                  <td className={cn(
                    "py-1.5 text-right tabular-nums",
                    record && record.total_spent > record.available_budget
                      ? "text-[var(--color-negative)]"
                      : record && record.total_spent > 0
                        ? "text-[var(--color-positive)]"
                        : "",
                  )}>
                    {record && record.total_spent > 0
                      ? formatCurrency(record.total_spent)
                      : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {availPerDay != null ? formatCurrency(availPerDay) : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {accumulated != null ? formatCurrency(accumulated) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary row */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--color-border-light)] text-xs">
          <span className="text-[var(--color-text-muted)]">
            Total: {formatCurrency(data.total_spent)} | Media: {formatCurrency(data.average_daily_spent)}
          </span>
          <span className={cn(
            "font-semibold",
            data.cycle.accumulated_balance >= 0
              ? "text-[var(--color-positive)]"
              : "text-[var(--color-negative)]",
          )}>
            Saldo: {data.cycle.accumulated_balance >= 0 ? "+" : ""}
            {formatCurrency(data.cycle.accumulated_balance)}
          </span>
        </div>
      </div>
    </CardGlass>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/WeekSummaryCard.tsx
git commit -m "feat(budget): add day-by-day accumulated table and clickable day buttons to WeekSummaryCard"
```

---

### Task 4: Update ExpenseList to support selectedDate

**Files:**
- Modify: `src/components/budget/ExpenseList.tsx`

- [ ] **Step 1: Update ExpenseList props and header**

Changes to `src/components/budget/ExpenseList.tsx`:

1. Add `selectedDate` and `isLoading` props to interface:

```typescript
interface ExpenseListProps {
  expenses: TBudgetExpense[];
  accountId: string;
  selectedDate?: string;
  isLoading?: boolean;
  onDelete?: () => void;
  className?: string;
}
```

2. Update the component to accept and use new props:

```typescript
export function ExpenseList({
  expenses,
  accountId,
  selectedDate,
  isLoading,
  onDelete,
  className,
}: ExpenseListProps) {
```

3. Replace the static title "Gastos de Hoje" with dynamic title based on selectedDate:

```typescript
// Before the return, add:
const today = new Date().toISOString().split("T")[0];
const isViewingToday = !selectedDate || selectedDate === today;
const displayDate = selectedDate
  ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    })
  : "Hoje";
```

Update the header section (line 105-111):
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
      {isViewingToday ? "Gastos de Hoje" : `Gastos de ${displayDate}`}
    </h3>
    {!isViewingToday && (
      <p className="text-xs text-[var(--color-warning)] mt-0.5">
        Visualizando dia anterior
      </p>
    )}
  </div>
  <span className="text-sm text-[var(--color-text-muted)]">
    {expenses.length} {expenses.length === 1 ? "item" : "itens"}
  </span>
</div>
```

4. Update empty state message:
```tsx
<p className="text-[var(--color-text-muted)]">
  {isViewingToday
    ? "Nenhum gasto registrado hoje"
    : `Nenhum gasto em ${displayDate}`}
</p>
```

5. Add loading overlay when `isLoading` is true — wrap the expenses list in a div with opacity transition:
```tsx
<div className={cn(isLoading && "opacity-50 pointer-events-none transition-opacity")}>
  {/* existing expense items */}
</div>
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/ExpenseList.tsx
git commit -m "feat(budget): update ExpenseList to show expenses for selected date"
```

---

### Task 5: Update ExpenseForm to accept selectedDate

**Files:**
- Modify: `src/components/budget/ExpenseForm.tsx`

- [ ] **Step 1: Add selectedDate prop**

Update the interface:

```typescript
interface ExpenseFormProps {
  accountId: string;
  selectedDate?: string;
  onSuccess?: () => void;
  className?: string;
}
```

Update the component signature to receive `selectedDate`:

```typescript
export function ExpenseForm({
  accountId,
  selectedDate,
  onSuccess,
  className,
}: ExpenseFormProps) {
```

Update the initial `expenseDate` state to use `selectedDate`:

```typescript
const [expenseDate, setExpenseDate] = useState(
  () => selectedDate || new Date().toISOString().split("T")[0],
);
```

Add a `useEffect` to sync when `selectedDate` changes from parent:

```typescript
import { useEffect, useState, useTransition } from "react";

// Inside the component, after state declarations:
useEffect(() => {
  if (selectedDate) {
    setExpenseDate(selectedDate);
  }
}, [selectedDate]);
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/ExpenseForm.tsx
git commit -m "feat(budget): sync ExpenseForm date with selectedDate from day buttons"
```

---

### Task 6: Wire BudgetPageClient into the server page

**Files:**
- Modify: `src/app/(dashboard)/budget/page.tsx`

- [ ] **Step 1: Update page.tsx to use BudgetPageClient**

Replace the grid layout (lines 107-118) with the new client wrapper:

```tsx
import {
  BudgetPageClient,
  EmptyBudgetState,
} from "@/components/budget";
```

Remove the individual component imports (ExpenseForm, ExpenseList, TodayBudgetCard, WeekSummaryCard) from the import and replace the grid section:

```tsx
{todayBudget ? (
  <BudgetPageClient
    todayBudget={todayBudget}
    weekSummary={weekSummary}
    initialExpenses={expenses || []}
    accountId={accountId}
    todayStr={todayStr}
  />
) : (
  // ... error card unchanged
)}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/budget/page.tsx
git commit -m "feat(budget): wire BudgetPageClient into budget page for interactive day selection"
```

---

### Task 7: Manual testing and polish

- [ ] **Step 1: Ask user to start dev server and test**

Test checklist:
1. Navigate to /budget
2. Verify day-by-day table shows in WeekSummaryCard with correct values
3. Click a past day button — ExpenseList should update to show that day's expenses
4. Click today — should return to today's expenses
5. Add an expense on a past day (click past day, then add expense)
6. Verify accumulated column recalculates after adding expense
7. Future days should be disabled/grayed out
8. Delete an expense and verify list updates

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Final commit with all fixes**
