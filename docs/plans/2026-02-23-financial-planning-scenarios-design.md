# Financial Planning with Scenarios — Design Document

**Date:** 2026-02-23
**Status:** Approved
**Feature:** Planejamento Financeiro com Cenarios

## Overview

Add a financial planning feature to ControleFatura that lets users project their finances 12 months ahead using 3 scenarios (Current, Optimistic, Pessimistic). The system auto-detects expenses from existing transaction data and allows manual adjustments. Income sources are manually entered and persisted for future planned-vs-actual comparison.

Inspired by the "start from costs, build 3 scenarios, see your runway" methodology.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data source | Hybrid (auto + manual) | Leverage existing recurring detection and category averages, let user adjust |
| Scenarios | 3 fixed (Atual/Otimista/Pessimista) | Simple, matches the methodology. Custom scenarios deferred to backlog |
| Time horizon | 12 months, monthly granularity | Realistic planning window without speculative long-term forecasting |
| Income handling | Manual input, persisted in DB | No income data exists today; persisting enables future planned-vs-actual |
| Navigation | `/planning` (new top-level page) | Separate concern from budget tracking and analytics |
| UI approach | Interactive spreadsheet (Approach A) | Target users are spreadsheet-literate; side-by-side comparison is the core value |

## Data Model

### financial_plans

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| account_id | uuid (FK → accounts) | |
| name | text | "Planejamento 2026" |
| start_month | date | First day of start month |
| months | int | Always 12 (for now) |
| initial_balance | numeric | Starting cash position |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### plan_income_sources

Shared across all scenarios within a plan.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| plan_id | uuid (FK → financial_plans) | |
| name | text | "Salario", "Bonus", "Aluguel" |
| amount | numeric | |
| frequency | text | "monthly" or "once" |
| month_index | int (nullable) | For one-time income: which month (0-11) |
| created_at | timestamptz | |

### plan_scenarios

Always exactly 3 per plan.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| plan_id | uuid (FK → financial_plans) | |
| type | text | "current", "optimistic", "pessimistic" |
| name | text | Display name |
| created_at | timestamptz | |

### plan_scenario_items

Expense line items per scenario.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| scenario_id | uuid (FK → plan_scenarios) | |
| category | text | "Alimentacao", "Casa", etc. |
| expense_type | text | "fixed" or "variable" |
| name | text | "Aluguel", "Netflix" |
| amount | numeric | Monthly cost |
| end_month | int (nullable) | Month index where this expense stops (for installments) |
| auto_detected | boolean | true if populated from real data |
| created_at | timestamptz | |

### RLS

All tables have RLS enabled. Access controlled via join to `financial_plans.account_id` matching the authenticated user's account membership.

### Indexes

- `financial_plans(account_id)`
- `plan_scenarios(plan_id)`
- `plan_scenario_items(scenario_id)`

### Migration

File: `src/db/migrations/008_add_planning_tables.sql`

## Auto-Detection: Data Sources

When creating a new plan, the "Current" scenario is pre-populated from 3 existing sources:

### 1. Recurring Transactions → Fixed Expenses

Source: `detectRecurringTransactions()` from `src/lib/analytics/recurring.ts`

Transactions detected as monthly recurring (60%+ confidence) become fixed expense items with `auto_detected: true`. Examples: Netflix, gym, phone bill.

### 2. Category Averages → Variable Expenses

Source: `calculateTransactionStats()` from `src/lib/analytics/stats.ts`

Categories with irregular spending (restaurants, clothing, leisure) use the 3-month average as the variable expense amount.

### 3. Active Installments → Temporary Fixed Expenses

Source: installment parsing from transaction data (format "N/M").

Active installments become fixed expenses with `end_month` set to when the last installment is paid. Example: "Parcela carro R$1.200 until month 8".

### Flow

```
User clicks "Novo Planejamento"
  → createPlan server action:
    1. Fetch transactions (last 6 months)
    2. detectRecurringTransactions() → fixed expenses
    3. calculateTransactionStats() → variable expenses (3-month avg)
    4. Parse active installments → temporary fixed expenses
    5. Create plan + 3 scenarios
    6. Populate "Current" scenario items
    7. Copy "Current" items to "Optimistic" and "Pessimistic"
    8. Return complete plan
```

## Calculation Logic

New module: `src/lib/planning/calculations.ts`

All functions are **pure** (no side effects, no DB calls). Calculations run client-side for instant feedback.

### Core Functions

```typescript
calculateMonthlyResult(scenarioItems, incomes, monthIndex)
  // For a given month:
  // totalIncome = sum of monthly incomes + one-time incomes for this month
  // totalExpenses = sum of items where end_month is null OR end_month >= monthIndex
  // result = totalIncome - totalExpenses
  // Returns { income, expenses, result }

calculateProjection(plan, scenarios)
  // For each of 12 months, for each scenario:
  // cashFlow[0] = initialBalance + result[0]
  // cashFlow[n] = cashFlow[n-1] + result[n]
  // Returns: { month, current: {...}, optimistic: {...}, pessimistic: {...} }[]

calculateRunway(currentCash, monthlyExpenses)
  // Returns: currentCash / monthlyExpenses (months of survival without income)

buildInitialScenario(transactions, recurringData)
  // Combines the 3 data sources into a pre-populated scenario
  // Returns: PlanScenarioItem[]
```

### Key Rules

- Installments have `end_month` — they stop appearing when paid off
- One-time income only applies to its specific `month_index`
- Cash accumulates: `cash[n] = cash[n-1] + result[n]`
- Projection recalculates in real-time on client (React state), no server round-trip per edit

## UI Architecture

### Pages

- `/planning` — List of plans with summary cards
- `/planning/[id]` — Plan editor (main feature)

### Components

```
src/components/planning/
├── PlanningList.tsx          — Grid of plan cards + "New Plan" button
├── PlanCard.tsx              — Summary card (name, period, current result)
├── PlanningEditor.tsx        — Main editor layout
├── IncomeSection.tsx         — Income sources (shared, inline editable)
├── IncomeItem.tsx            — Single income row
├── ScenarioTabs.tsx          — Tab switcher (Atual/Otimista/Pessimista)
├── ExpenseGroup.tsx          — Group of expenses (fixed or variable)
├── ExpenseItem.tsx           — Single expense row with "auto" badge
├── MonthlyResultCard.tsx     — Summary: income - expenses = result
├── ProjectionTable.tsx       — 12-month table, 3 scenarios side by side
├── ProjectionChart.tsx       — Recharts line chart (3 lines)
├── RunwayCard.tsx            — Months of survival calculation
└── CreatePlanDialog.tsx      — Dialog for new plan (name, start month, initial balance)
```

### Layout (Desktop)

```
┌─────────────────────────────────────────────────┐
│  Plan Header (name, period, initial balance)     │
├─────────────────────────────────────────────────┤
│  Income Section (shared across scenarios)        │
├─────────────────────────────────────────────────┤
│  [Atual] [Otimista] [Pessimista]  ← ScenarioTabs│
│  ┌─────────────────────────────────────────┐    │
│  │ Fixed Expenses (ExpenseGroup)           │    │
│  │ Variable Expenses (ExpenseGroup)        │    │
│  │ Monthly Result (MonthlyResultCard)      │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│  Projection Table (12 months × 3 scenarios)     │
│  Projection Chart (line chart)                  │
│  Runway Card                                    │
└─────────────────────────────────────────────────┘
```

### Mobile Adaptations

- Scenario tabs become swipeable
- Projection table scrolls horizontally
- Expense items stack vertically with compact layout

## Server Actions

File: `src/actions/planning.actions.ts`

| Action | Description |
|--------|-------------|
| `createPlan(accountId, name, startMonth, initialBalance)` | Creates plan, fetches real data, populates 3 scenarios |
| `getPlans(accountId)` | List all plans for account |
| `getPlanWithDetails(planId)` | Full plan with incomes, scenarios, items |
| `updatePlan(planId, updates)` | Update name, initial_balance |
| `deletePlan(planId)` | Delete plan and all related data |
| `addIncome(planId, income)` | Add income source |
| `updateIncome(incomeId, updates)` | Edit income |
| `removeIncome(incomeId)` | Delete income |
| `addScenarioItem(scenarioId, item)` | Add expense to scenario |
| `updateScenarioItem(itemId, updates)` | Edit expense |
| `removeScenarioItem(itemId)` | Delete expense |

All follow existing patterns: `requireAccountAccess()`, `TApiResponse<T>`, `logger`, `revalidatePath("/planning")`.

## Middleware Update

Add `/planning` to protected routes in `src/lib/supabase/middleware.ts`:

```typescript
const isDashboardPage =
  request.nextUrl.pathname.startsWith("/dashboard") ||
  request.nextUrl.pathname.startsWith("/planning") ||
  // ... existing routes
```

## Future Backlog

| Item | Description |
|------|-------------|
| Wizard step-by-step | Guided flow for first-time users (Approach B from brainstorming) |
| Planned vs Actual | Compare plan projections against real transaction data |
| Export PDF/Excel | Download planning as formatted document |
| ControleIA integration | AI chat agent can answer questions about the plan |
| Custom scenarios | User-created scenarios beyond the 3 fixed ones |
| Shared plans | Multiple users in same account can view/edit plans |
