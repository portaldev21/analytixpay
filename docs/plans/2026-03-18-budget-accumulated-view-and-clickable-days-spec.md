# Budget: Accumulated View & Clickable Days

## Summary

Two enhancements to the Orcamento (Budget) page:

1. **Accumulated day-by-day table** in WeekSummaryCard showing running totals (like the user's spreadsheet)
2. **Clickable day buttons** allowing users to view/edit expenses for any day in the cycle

## Problem

The current budget page shows only today's budget and a high-level weekly summary. Users cannot see:
- Running accumulated spending across the cycle
- Available budget per remaining day (recalculated daily)
- Day-by-day breakdown comparable to their spreadsheet

Additionally, the weekday buttons (D, S, T, Q, Q, S, S) are purely decorative — users cannot click a day to view or edit its expenses.

## Feature 1: Day-by-Day Accumulated Table

### What Changes

The WeekSummaryCard's current 2x2 stats grid (saldo acumulado, media diaria, dias no orcamento, dias acima) is **replaced** by a compact day-by-day table.

### Table Columns

| Column | Source | Description |
|--------|--------|-------------|
| Dia | `daily_record.record_date` | Date (DD-mmm format) |
| Gasto | `daily_record.total_spent` | Total spent that day |
| Disp/dia | Calculated | Remaining budget / remaining days |
| Acumulado | Calculated | Running sum of `total_spent` up to that day |

### Calculation Logic

In `src/lib/budget/calculations.ts`, add:

```typescript
// Running accumulated: sum of total_spent from day 1 to day N
function calculateRunningAccumulated(dailyRecords: TDailyRecord[]): number[] {
  // Sort by date, return prefix sum array of total_spent
}

// Available per day: (total_remaining_budget - accumulated_spent) / remaining_days
function calculateAvailablePerDay(
  totalBudget: number,
  accumulatedSpent: number,
  remainingDays: number
): number {
  return (totalBudget - accumulatedSpent) / remainingDays;
}
```

### Table Footer

Below the table, show summary stats in a compact row:
- **Total gasto:** Sum of all spent
- **Media diaria:** Average daily spent
- **Saldo:** Accumulated balance (positive = savings, negative = overspent)

### Visual Design

- Compact rows with small text (text-xs/text-sm)
- Today's row highlighted with primary background
- Selected day's row highlighted with border
- Future days shown with dashes (—) for Gasto and Acumulado
- Days over budget: Gasto amount in red
- Days under budget: Gasto amount in green
- Scrollable if cycle has many days (unlikely for 7-day cycles)

## Feature 2: Clickable Day Buttons

### State Management

The budget page needs shared state (`selectedDate`) across three components:

```
BudgetPageClient (manages selectedDate state)
├── TodayBudgetCard (read-only, always shows today)
├── WeekSummaryCard (day buttons trigger setSelectedDate, table highlights row)
├── ExpenseForm (pre-fills date with selectedDate)
└── ExpenseList (shows expenses for selectedDate)
```

### Implementation

1. **New wrapper component:** `BudgetPageClient` (client component)
   - Receives initial data from server component page.tsx
   - Manages `selectedDate` state (default: today)
   - Passes selectedDate + setter to children

2. **WeekSummaryCard changes:**
   - Day buttons become clickable (`onClick` → `setSelectedDate`)
   - Visual states for buttons:
     - **Selected:** Blue background + white text
     - **Today (not selected):** Blue ring/outline
     - **Has expenses:** Small dot indicator below letter
     - **Future:** Disabled, grayed out
   - Table row for selected day gets highlighted border

3. **ExpenseList changes:**
   - Receives `selectedDate` prop instead of hardcoded today
   - Shows header: "Gastos de segunda-feira, 16 de mar." (localized)
   - Fetches expenses for the selected date
   - When selectedDate !== today, show subtle badge "Visualizando dia anterior"

4. **ExpenseForm changes:**
   - Date field pre-populated with `selectedDate`
   - When adding expense for past day, recalculates that day's records

### Data Fetching Strategy

- Initial load (server): fetch today's budget + week summary + today's expenses
- On day click (client): call `getExpensesForDate(accountId, selectedDate)` via server action
- Use `useTransition` for loading state during day switches

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/(dashboard)/budget/page.tsx` | Pass data to new BudgetPageClient wrapper |
| `src/components/budget/BudgetPageClient.tsx` | **NEW** - Client wrapper managing selectedDate |
| `src/components/budget/WeekSummaryCard.tsx` | Add table, make days clickable, accept props |
| `src/components/budget/ExpenseList.tsx` | Accept selectedDate, show date-specific header |
| `src/components/budget/ExpenseForm.tsx` | Accept selectedDate as default date |
| `src/lib/budget/calculations.ts` | Add accumulated/available-per-day calculations |
| `src/actions/budget.actions.ts` | Ensure getExpensesForDate works for any date in cycle |

## Out of Scope

- Changing TodayBudgetCard (always shows today's budget)
- Multi-week historical view
- Editing daily_record base budgets
- Changes to forecast or reconciliation pages

---

## Addendum, 2026-09-05: what shipped differs from this spec

The feature described here sat uncommitted from March until September, when it
was recovered, finished and merged in PR #11. Two of the calculations above were
deliberately changed. Recording why, so the difference is not read as a mistake.

### `Disp/dia`

Specified as `(total_budget - accumulated_spent) / remaining_days`.

Shipped as the same formula the day card uses,
`daily_base + accumulated_balance / remaining_days`.

The two agree whenever every past day of the cycle has a daily record. They
diverge when a cycle starts mid-week with no records behind it: the specified
formula still spread the whole weekly budget over the days that remain, so on a
Friday of an untouched week the table offered R$ 350,00 for a day the card above
it called R$ 150,00. Two figures for the same day, on the same screen.

### `Acumulado`

Specified as the running sum of `total_spent`.

Shipped as the running balance, `available - spent` accumulated day by day, and
only for days that are already over.

The running sum of spending duplicated the `Total` already in the footer, and
the column sat next to a footer labelled `Saldo` that showed a different kind of
number. The balance is also what the original spreadsheet tracks: the position
against the goal, not the raw spend.

Counting a day that is still open was a bug in its own right. A fresh day starts
with its whole budget as its balance, so an open day read as a full day of
savings and inflated the days ahead. See PR #12 and the tests in
`src/components/budget/__tests__/WeekSummaryCard.test.tsx`.

If the original reading of either column is preferred, both are one change away.
