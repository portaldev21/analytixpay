import { describe, expect, it } from "vitest";
import type {
  TPlanIncomeSource,
  TPlanScenarioItem,
  TPlanScenarioWithItems,
} from "@/db/types";
import {
  calculateMonthlyResult,
  calculateProjection,
  calculateRunway,
} from "../calculations";

const makeIncome = (
  overrides: Partial<TPlanIncomeSource> = {},
): TPlanIncomeSource => ({
  id: "inc-1",
  plan_id: "plan-1",
  name: "Salario",
  amount: 10000,
  frequency: "monthly",
  month_index: null,
  created_at: "",
  ...overrides,
});

const makeItem = (
  overrides: Partial<TPlanScenarioItem> = {},
): TPlanScenarioItem => ({
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
      makeIncome({
        id: "inc-2",
        name: "Bonus",
        amount: 20000,
        frequency: "once",
        month_index: 5,
      }),
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
