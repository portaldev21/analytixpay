# Financial Planning with Scenarios — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/planning` feature that projects finances 12 months ahead with 3 scenarios (Current/Optimistic/Pessimistic), auto-detecting expenses from real data.

**Architecture:** New route group under `(dashboard)/planning/` with server actions in `planning.actions.ts`, pure calculation logic in `src/lib/planning/calculations.ts`, and 4 new database tables with RLS. Client-side projection recalculation for instant feedback.

**Tech Stack:** Next.js 15 App Router, Supabase (DB + RLS), Recharts (chart), React Hook Form + Zod (forms), Framer Motion (animations)

**Design doc:** `docs/plans/2026-02-23-financial-planning-scenarios-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `src/db/migrations/008_add_planning_tables.sql`

**Step 1: Write the migration**

```sql
-- Migration: Add financial planning tables
-- Version: 008
-- Date: 2026-02-23
-- Description: Creates tables for financial planning with scenarios feature

-- =============================================================================
-- FINANCIAL_PLANS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS financial_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_month date NOT NULL,
  months integer NOT NULL DEFAULT 12 CHECK (months >= 1 AND months <= 24),
  initial_balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_INCOME_SOURCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_income_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid REFERENCES financial_plans(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'once')),
  month_index integer CHECK (month_index >= 0 AND month_index <= 23),
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_SCENARIOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_scenarios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid REFERENCES financial_plans(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('current', 'optimistic', 'pessimistic')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_SCENARIO_ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_scenario_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id uuid REFERENCES plan_scenarios(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('fixed', 'variable')),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  end_month integer CHECK (end_month >= 0 AND end_month <= 23),
  auto_detected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_plans_account ON financial_plans(account_id);
CREATE INDEX IF NOT EXISTS idx_plan_income_sources_plan ON plan_income_sources(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_scenarios_plan ON plan_scenarios(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_scenarios_type ON plan_scenarios(plan_id, type);
CREATE INDEX IF NOT EXISTS idx_plan_scenario_items_scenario ON plan_scenario_items(scenario_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_scenario_items ENABLE ROW LEVEL SECURITY;

-- financial_plans policies
CREATE POLICY "Members can view account plans"
  ON financial_plans FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert plans"
  ON financial_plans FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update plans"
  ON financial_plans FOR UPDATE
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Owners can delete plans"
  ON financial_plans FOR DELETE
  USING (account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid()));

-- plan_income_sources policies (via plan_id → financial_plans → account_id)
CREATE POLICY "Members can view plan incomes"
  ON plan_income_sources FOR SELECT
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can insert plan incomes"
  ON plan_income_sources FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can update plan incomes"
  ON plan_income_sources FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can delete plan incomes"
  ON plan_income_sources FOR DELETE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

-- plan_scenarios policies
CREATE POLICY "Members can view plan scenarios"
  ON plan_scenarios FOR SELECT
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can insert plan scenarios"
  ON plan_scenarios FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can update plan scenarios"
  ON plan_scenarios FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

-- plan_scenario_items policies
CREATE POLICY "Members can view scenario items"
  ON plan_scenario_items FOR SELECT
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can insert scenario items"
  ON plan_scenario_items FOR INSERT
  WITH CHECK (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can update scenario items"
  ON plan_scenario_items FOR UPDATE
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can delete scenario items"
  ON plan_scenario_items FOR DELETE
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE TRIGGER update_financial_plans_updated_at
  BEFORE UPDATE ON financial_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE financial_plans IS 'Financial planning projections with 12-month horizon';
COMMENT ON TABLE plan_income_sources IS 'Income sources for a financial plan (shared across scenarios)';
COMMENT ON TABLE plan_scenarios IS 'Three scenarios per plan: current, optimistic, pessimistic';
COMMENT ON TABLE plan_scenario_items IS 'Expense items per scenario (fixed or variable)';
COMMENT ON COLUMN plan_scenario_items.end_month IS 'Month index (0-based) where expense ends. NULL = continues for all months';
COMMENT ON COLUMN plan_scenario_items.auto_detected IS 'True if item was auto-populated from real transaction data';
COMMENT ON COLUMN plan_income_sources.month_index IS 'For one-time income: which month (0-based). NULL for monthly income';
```

**Step 2: Commit**

```bash
git add src/db/migrations/008_add_planning_tables.sql
git commit -m "feat(planning): add database migration for planning tables"
```

> **Note:** The migration must be run manually in the Supabase SQL Editor. Do NOT run it automatically.

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/db/types.ts` (add planning types at end of file, before the API response types section)

**Step 1: Add the types**

Add these types to `src/db/types.ts`:

```typescript
// =====================================================
// PLANNING TYPES
// =====================================================

export type TFinancialPlan = {
  id: string;
  account_id: string;
  name: string;
  start_month: string;
  months: number;
  initial_balance: number;
  created_at: string;
  updated_at: string;
};

export type TPlanIncomeSource = {
  id: string;
  plan_id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "once";
  month_index: number | null;
  created_at: string;
};

export type TPlanScenario = {
  id: string;
  plan_id: string;
  type: "current" | "optimistic" | "pessimistic";
  name: string;
  created_at: string;
};

export type TPlanScenarioItem = {
  id: string;
  scenario_id: string;
  category: string;
  expense_type: "fixed" | "variable";
  name: string;
  amount: number;
  end_month: number | null;
  auto_detected: boolean;
  created_at: string;
};

export type TPlanScenarioWithItems = TPlanScenario & {
  items: TPlanScenarioItem[];
};

export type TFinancialPlanWithDetails = TFinancialPlan & {
  incomes: TPlanIncomeSource[];
  scenarios: TPlanScenarioWithItems[];
};

export type TPlanSummary = {
  id: string;
  name: string;
  start_month: string;
  months: number;
  initial_balance: number;
  monthly_result: number;
  final_balance: number;
  created_at: string;
};
```

**Step 2: Commit**

```bash
git add src/db/types.ts
git commit -m "feat(planning): add TypeScript types for planning feature"
```

---

## Task 3: Pure Calculation Logic

**Files:**
- Create: `src/lib/planning/calculations.ts`
- Create: `src/lib/planning/__tests__/calculations.test.ts`

**Step 1: Write tests first**

Create `src/lib/planning/__tests__/calculations.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  calculateMonthlyResult,
  calculateProjection,
  calculateRunway,
} from "../calculations";
import type {
  TPlanIncomeSource,
  TPlanScenarioItem,
  TPlanScenarioWithItems,
} from "@/db/types";

const makeIncome = (overrides: Partial<TPlanIncomeSource> = {}): TPlanIncomeSource => ({
  id: "inc-1",
  plan_id: "plan-1",
  name: "Salario",
  amount: 10000,
  frequency: "monthly",
  month_index: null,
  created_at: "",
  ...overrides,
});

const makeItem = (overrides: Partial<TPlanScenarioItem> = {}): TPlanScenarioItem => ({
  id: "item-1",
  scenario_id: "scen-1",
  category: "Casa",
  expense_type: "fixed",
  name: "Aluguel",
  amount: 2500,
  end_month: null,
  auto_detected: false,
  created_at: "",
  ...overrides,
});

describe("calculateMonthlyResult", () => {
  it("calculates income minus expenses for a month", () => {
    const incomes = [makeIncome({ amount: 10000 })];
    const items = [
      makeItem({ amount: 2500 }),
      makeItem({ id: "item-2", name: "Internet", amount: 100 }),
    ];
    const result = calculateMonthlyResult(items, incomes, 0);
    expect(result.income).toBe(10000);
    expect(result.expenses).toBe(2600);
    expect(result.result).toBe(7400);
  });

  it("includes one-time income only in its month", () => {
    const incomes = [
      makeIncome({ amount: 10000 }),
      makeIncome({ id: "inc-2", name: "Bonus", amount: 20000, frequency: "once", month_index: 5 }),
    ];
    const items = [makeItem({ amount: 5000 })];

    const month0 = calculateMonthlyResult(items, incomes, 0);
    expect(month0.income).toBe(10000);

    const month5 = calculateMonthlyResult(items, incomes, 5);
    expect(month5.income).toBe(30000);
  });

  it("excludes expenses past their end_month", () => {
    const incomes = [makeIncome({ amount: 10000 })];
    const items = [
      makeItem({ amount: 1200, end_month: 3 }),
      makeItem({ id: "item-2", amount: 500, end_month: null }),
    ];

    const month2 = calculateMonthlyResult(items, incomes, 2);
    expect(month2.expenses).toBe(1700);

    const month5 = calculateMonthlyResult(items, incomes, 5);
    expect(month5.expenses).toBe(500);
  });
});

describe("calculateProjection", () => {
  it("accumulates cash over 12 months", () => {
    const incomes = [makeIncome({ amount: 10000 })];
    const scenario: TPlanScenarioWithItems = {
      id: "scen-1",
      plan_id: "plan-1",
      type: "current",
      name: "Atual",
      created_at: "",
      items: [makeItem({ amount: 7000 })],
    };

    const projection = calculateProjection(5000, 12, incomes, [scenario]);
    // Month 0: 5000 + (10000 - 7000) = 8000
    expect(projection[0].current.cash).toBe(8000);
    // Month 11: 5000 + 3000 * 12 = 41000
    expect(projection[11].current.cash).toBe(41000);
  });

  it("handles negative cash correctly", () => {
    const incomes = [makeIncome({ amount: 5000 })];
    const scenario: TPlanScenarioWithItems = {
      id: "scen-1",
      plan_id: "plan-1",
      type: "current",
      name: "Atual",
      created_at: "",
      items: [makeItem({ amount: 8000 })],
    };

    const projection = calculateProjection(0, 3, incomes, [scenario]);
    expect(projection[0].current.cash).toBe(-3000);
    expect(projection[1].current.cash).toBe(-6000);
    expect(projection[2].current.cash).toBe(-9000);
  });
});

describe("calculateRunway", () => {
  it("calculates months of survival", () => {
    expect(calculateRunway(30000, 10000)).toBe(3);
  });

  it("returns Infinity if no expenses", () => {
    expect(calculateRunway(30000, 0)).toBe(Infinity);
  });

  it("returns 0 if no cash", () => {
    expect(calculateRunway(0, 5000)).toBe(0);
  });

  it("returns 0 if negative cash", () => {
    expect(calculateRunway(-5000, 5000)).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest src/lib/planning/__tests__/calculations.test.ts
```

Expected: FAIL (module not found)

**Step 3: Write the implementation**

Create `src/lib/planning/calculations.ts`:

```typescript
import type {
  TPlanIncomeSource,
  TPlanScenarioItem,
  TPlanScenarioWithItems,
} from "@/db/types";

export type MonthlyResult = {
  income: number;
  expenses: number;
  result: number;
};

export type MonthProjection = {
  monthIndex: number;
  month: string;
  current: MonthlyResult & { cash: number };
  optimistic: MonthlyResult & { cash: number };
  pessimistic: MonthlyResult & { cash: number };
};

/**
 * Calculate income minus expenses for a single month
 */
export function calculateMonthlyResult(
  items: TPlanScenarioItem[],
  incomes: TPlanIncomeSource[],
  monthIndex: number,
): MonthlyResult {
  // Sum monthly incomes + one-time incomes for this month
  const income = incomes.reduce((sum, inc) => {
    if (inc.frequency === "monthly") return sum + inc.amount;
    if (inc.frequency === "once" && inc.month_index === monthIndex)
      return sum + inc.amount;
    return sum;
  }, 0);

  // Sum expenses that are still active in this month
  const expenses = items.reduce((sum, item) => {
    if (item.end_month !== null && monthIndex > item.end_month) return sum;
    return sum + item.amount;
  }, 0);

  return { income, expenses, result: income - expenses };
}

/**
 * Calculate full 12-month projection for all scenarios
 */
export function calculateProjection(
  initialBalance: number,
  months: number,
  incomes: TPlanIncomeSource[],
  scenarios: TPlanScenarioWithItems[],
): MonthProjection[] {
  const findScenario = (type: string) =>
    scenarios.find((s) => s.type === type);

  const current = findScenario("current");
  const optimistic = findScenario("optimistic");
  const pessimistic = findScenario("pessimistic");

  const projection: MonthProjection[] = [];

  const cash = { current: initialBalance, optimistic: initialBalance, pessimistic: initialBalance };

  for (let i = 0; i < months; i++) {
    const cResult = calculateMonthlyResult(current?.items || [], incomes, i);
    const oResult = calculateMonthlyResult(optimistic?.items || [], incomes, i);
    const pResult = calculateMonthlyResult(pessimistic?.items || [], incomes, i);

    cash.current += cResult.result;
    cash.optimistic += oResult.result;
    cash.pessimistic += pResult.result;

    projection.push({
      monthIndex: i,
      month: "", // Filled by caller with actual month label
      current: { ...cResult, cash: cash.current },
      optimistic: { ...oResult, cash: cash.optimistic },
      pessimistic: { ...pResult, cash: cash.pessimistic },
    });
  }

  return projection;
}

/**
 * Calculate runway: months of survival without income
 */
export function calculateRunway(
  currentCash: number,
  monthlyExpenses: number,
): number {
  if (currentCash <= 0) return 0;
  if (monthlyExpenses <= 0) return Infinity;
  return Math.floor(currentCash / monthlyExpenses);
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest src/lib/planning/__tests__/calculations.test.ts
```

Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/lib/planning/
git commit -m "feat(planning): add pure calculation logic with tests"
```

---

## Task 4: Auto-Detection Logic

**Files:**
- Create: `src/lib/planning/auto-detect.ts`

This module builds the initial "Current" scenario from real transaction data.

**Step 1: Write the implementation**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TTransaction, TPlanScenarioItem } from "@/db/types";
import { detectRecurringTransactions } from "@/lib/analytics/recurring";
import { calculateTransactionStats } from "@/lib/analytics/stats";
import { logger } from "@/lib/logger";

/**
 * Build initial scenario items from real transaction data
 */
export async function buildInitialScenarioItems(
  supabase: SupabaseClient,
  accountId: string,
): Promise<Omit<TPlanScenarioItem, "id" | "scenario_id" | "created_at">[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDate = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch recent transactions
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .gte("date", startDate)
    .order("date", { ascending: true });

  if (error || !transactions?.length) {
    logger.warn("No transactions found for auto-detection", { accountId });
    return [];
  }

  const typedTransactions = transactions as TTransaction[];
  const items: Omit<TPlanScenarioItem, "id" | "scenario_id" | "created_at">[] = [];

  // 1. Recurring transactions → fixed expenses
  const recurring = detectRecurringTransactions(typedTransactions);
  for (const r of recurring) {
    if (r.frequency === "monthly" && r.confidence >= 0.6) {
      items.push({
        category: r.category || "Outros",
        expense_type: "fixed",
        name: r.description,
        amount: Math.round(r.averageAmount * 100) / 100,
        end_month: null,
        auto_detected: true,
      });
    }
  }

  // 2. Category averages (last 3 months) → variable expenses
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentTransactions = typedTransactions.filter(
    (t) => new Date(t.date) >= threeMonthsAgo,
  );
  const stats = calculateTransactionStats(recentTransactions);

  // Categories already covered by recurring detection
  const recurringNames = new Set(recurring.map((r) => r.description.toLowerCase()));

  for (const cat of stats.categoryBreakdown) {
    // Skip if already covered by fixed recurring items
    const hasRecurring = items.some(
      (item) => item.category === cat.category && item.expense_type === "fixed",
    );
    // Variable = average per month (total / 3 months minus recurring amounts)
    const recurringTotal = items
      .filter((i) => i.category === cat.category)
      .reduce((sum, i) => sum + i.amount, 0);
    const monthlyAvg = Math.round((cat.total / 3) * 100) / 100;
    const variableAmount = Math.max(0, monthlyAvg - recurringTotal);

    if (variableAmount > 50) {
      items.push({
        category: cat.category,
        expense_type: "variable",
        name: `${cat.category} (media)`,
        amount: variableAmount,
        end_month: null,
        auto_detected: true,
      });
    }
  }

  // 3. Active installments → temporary fixed expenses
  for (const t of typedTransactions) {
    if (!t.installment) continue;
    const match = t.installment.match(/(\d+)\/(\d+)/);
    if (!match) continue;

    const current = Number.parseInt(match[1], 10);
    const total = Number.parseInt(match[2], 10);
    if (current >= total) continue;

    const remaining = total - current;
    // Avoid duplicates for same description
    const key = t.description.toLowerCase().trim();
    if (items.some((i) => i.name.toLowerCase() === key)) continue;

    items.push({
      category: t.category,
      expense_type: "fixed",
      name: t.description,
      amount: t.amount,
      end_month: remaining - 1, // 0-indexed
      auto_detected: true,
    });
  }

  logger.info("Auto-detection complete", {
    accountId,
    fixedCount: items.filter((i) => i.expense_type === "fixed").length,
    variableCount: items.filter((i) => i.expense_type === "variable").length,
  });

  return items;
}
```

**Step 2: Commit**

```bash
git add src/lib/planning/auto-detect.ts
git commit -m "feat(planning): add auto-detection logic from real transaction data"
```

---

## Task 5: Server Actions

**Files:**
- Create: `src/actions/planning.actions.ts`

**Step 1: Write the server actions**

Create `src/actions/planning.actions.ts` following the exact pattern from `budget.actions.ts`:

- `createPlan(accountId, name, startMonth, initialBalance)` — creates plan, runs auto-detection, creates 3 scenarios with items
- `getPlans(accountId)` — lists all plans for account
- `getPlanWithDetails(planId, accountId)` — full plan with incomes + scenarios + items
- `updatePlan(planId, accountId, updates)` — update plan name/initial_balance
- `deletePlan(planId, accountId)` — delete plan
- `addIncome(planId, accountId, income)` — add income source
- `updateIncome(incomeId, accountId, updates)` — edit income
- `removeIncome(incomeId, accountId)` — delete income
- `addScenarioItem(scenarioId, accountId, item)` — add expense
- `updateScenarioItem(itemId, accountId, updates)` — edit expense
- `removeScenarioItem(itemId, accountId)` — delete expense

All actions: `"use server"`, `requireAccountAccess(accountId)`, `TApiResponse<T>`, `logger`, `revalidatePath("/planning")`.

**Key implementation detail for `createPlan`:**

```typescript
export async function createPlan(
  accountId: string,
  name: string,
  startMonth: string,
  initialBalance: number,
): Promise<TApiResponse<TFinancialPlanWithDetails>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);

    // 1. Create the plan
    const { data: plan, error: planError } = await (supabase.from("financial_plans") as any)
      .insert({ account_id: accountId, name, start_month: startMonth, initial_balance: initialBalance })
      .select().single();

    if (planError) return { data: null, error: planError.message, success: false };

    // 2. Create 3 scenarios
    const scenarioTypes = [
      { type: "current", name: "Realidade Atual" },
      { type: "optimistic", name: "Cenario Otimista" },
      { type: "pessimistic", name: "Cenario Pessimista" },
    ];

    const { data: scenarios, error: scenError } = await (supabase.from("plan_scenarios") as any)
      .insert(scenarioTypes.map((s) => ({ plan_id: plan.id, ...s })))
      .select();

    if (scenError) { /* rollback plan, return error */ }

    // 3. Auto-detect items for "current" scenario
    const autoItems = await buildInitialScenarioItems(supabase, accountId);
    const currentScenario = scenarios.find((s: any) => s.type === "current");

    if (autoItems.length > 0 && currentScenario) {
      // Insert items for current scenario
      await (supabase.from("plan_scenario_items") as any)
        .insert(autoItems.map((item) => ({ ...item, scenario_id: currentScenario.id })));

      // Copy same items to optimistic and pessimistic
      for (const scen of scenarios.filter((s: any) => s.type !== "current")) {
        await (supabase.from("plan_scenario_items") as any)
          .insert(autoItems.map((item) => ({ ...item, scenario_id: scen.id })));
      }
    }

    // 4. Return full plan
    revalidatePath("/planning");
    return getPlanWithDetails(plan.id, accountId);
  } catch (error) { /* standard error handling */ }
}
```

**Step 2: Commit**

```bash
git add src/actions/planning.actions.ts
git commit -m "feat(planning): add server actions for planning CRUD"
```

---

## Task 6: Middleware Update

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

**Step 1: Add `/planning` to protected routes**

In the `isDashboardPage` variable, add `request.nextUrl.pathname.startsWith("/planning")`:

```typescript
const isDashboardPage =
  request.nextUrl.pathname.startsWith("/dashboard") ||
  request.nextUrl.pathname.startsWith("/invoices") ||
  request.nextUrl.pathname.startsWith("/transactions") ||
  request.nextUrl.pathname.startsWith("/settings") ||
  request.nextUrl.pathname.startsWith("/budget") ||
  request.nextUrl.pathname.startsWith("/analytics") ||
  request.nextUrl.pathname.startsWith("/planning"); // ← ADD THIS
```

**Step 2: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat(planning): add /planning to protected routes"
```

---

## Task 7: Sidebar Navigation

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`

**Step 1: Add Planning to navigation array**

Import `TrendingUp` (or `Calculator`) from `lucide-react` and add to the `navigation` array:

```typescript
import { ..., TrendingUp } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orcamento", href: "/budget", icon: Wallet },
  { name: "Planejamento", href: "/planning", icon: TrendingUp }, // ← ADD THIS
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Faturas", href: "/invoices", icon: FileText },
  { name: "Transacoes", href: "/transactions", icon: CreditCard },
  { name: "Configuracoes", href: "/settings", icon: Settings },
];
```

**Step 2: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx
git commit -m "feat(planning): add Planejamento to sidebar navigation"
```

---

## Task 8: Planning List Page

**Files:**
- Create: `src/app/(dashboard)/planning/page.tsx`
- Create: `src/components/planning/PlanningList.tsx`
- Create: `src/components/planning/PlanCard.tsx`
- Create: `src/components/planning/CreatePlanDialog.tsx`

This is the `/planning` route showing all plans with a "New Plan" button.

**Components:**
- `PlanningList` — server component that fetches plans and renders grid
- `PlanCard` — displays plan summary (name, period, monthly result, final cash)
- `CreatePlanDialog` — dialog with form: name, start month, initial balance

**Page pattern:** Same as `/invoices/page.tsx` — Suspense wrapper, fetch account, render list.

**Step 1: Implement all 4 files**

Follow patterns from: `src/app/(dashboard)/invoices/page.tsx` (page), `src/components/invoices/InvoiceCard.tsx` (card), `src/components/transactions/EditTransactionDialog.tsx` (dialog).

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/planning/ src/components/planning/
git commit -m "feat(planning): add planning list page with create dialog"
```

---

## Task 9: Planning Editor Page

**Files:**
- Create: `src/app/(dashboard)/planning/[id]/page.tsx`
- Create: `src/components/planning/PlanningEditor.tsx`
- Create: `src/components/planning/IncomeSection.tsx`
- Create: `src/components/planning/IncomeItem.tsx`
- Create: `src/components/planning/ScenarioTabs.tsx`
- Create: `src/components/planning/ExpenseGroup.tsx`
- Create: `src/components/planning/ExpenseItem.tsx`
- Create: `src/components/planning/MonthlyResultCard.tsx`

This is the core editor at `/planning/[id]`. The page fetches the full plan; `PlanningEditor` is a client component managing state and calling server actions for persistence.

**Key architecture:**
- `PlanningEditor` holds all plan state in React state (incomes, scenarios, items)
- Edits update local state immediately (optimistic UI)
- Server actions called on blur/submit for persistence
- Projection recalculated from local state via `calculateProjection()` (instant)

**Step 1: Implement page + editor components**

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/planning/\[id\]/ src/components/planning/
git commit -m "feat(planning): add planning editor with income and scenario sections"
```

---

## Task 10: Projection Table and Chart

**Files:**
- Create: `src/components/planning/ProjectionTable.tsx`
- Create: `src/components/planning/ProjectionChart.tsx`
- Create: `src/components/planning/RunwayCard.tsx`

**ProjectionTable:** 12-row table with columns: Month | Atual (result/cash) | Otimista (result/cash) | Pessimista (result/cash). Negative values in red. Uses `calculateProjection()`.

**ProjectionChart:** Recharts `LineChart` with 3 lines (one per scenario). X-axis = month, Y-axis = cumulative cash. Reference line at y=0. Follow pattern from existing Recharts usage in `src/components/analytics/`.

**RunwayCard:** Simple card showing `calculateRunway()` result. "X meses de sobrevivencia sem renda".

**Step 1: Implement 3 components**

**Step 2: Wire into PlanningEditor**

Add ProjectionTable, ProjectionChart, and RunwayCard below the scenario tabs in PlanningEditor.

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Run all tests**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/components/planning/
git commit -m "feat(planning): add projection table, chart, and runway card"
```

---

## Task 11: Final Integration and Polish

**Files:**
- Verify all files build cleanly
- Verify all tests pass

**Step 1: Full build verification**

```bash
npm run build
npm test
npm run lint
```

**Step 2: Fix any lint/type errors**

**Step 3: Final commit**

```bash
git commit -m "feat(planning): final polish and lint fixes"
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Database migration | — |
| 2 | TypeScript types | — |
| 3 | Calculation logic + tests | 2 |
| 4 | Auto-detection logic | 2 |
| 5 | Server actions | 2, 4 |
| 6 | Middleware update | — |
| 7 | Sidebar navigation | — |
| 8 | Planning list page | 2, 5 |
| 9 | Planning editor page | 2, 3, 5 |
| 10 | Projection table/chart | 3, 9 |
| 11 | Final integration | All |

**Parallelizable:** Tasks 1, 2, 6, 7 can all run in parallel. Tasks 3 and 4 can run in parallel after 2.
