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
  const income = incomes.reduce((sum, inc) => {
    if (inc.frequency === "monthly") return sum + inc.amount;
    if (inc.frequency === "once" && inc.month_index === monthIndex)
      return sum + inc.amount;
    return sum;
  }, 0);

  const expenses = items.reduce((sum, item) => {
    if (item.end_month !== null && monthIndex > item.end_month) return sum;
    return sum + item.amount;
  }, 0);

  return { income, expenses, result: income - expenses };
}

/**
 * Calculate full projection for all scenarios over N months
 */
export function calculateProjection(
  initialBalance: number,
  months: number,
  incomes: TPlanIncomeSource[],
  scenarios: TPlanScenarioWithItems[],
): MonthProjection[] {
  const findScenario = (type: string) => scenarios.find((s) => s.type === type);

  const current = findScenario("current");
  const optimistic = findScenario("optimistic");
  const pessimistic = findScenario("pessimistic");

  const projection: MonthProjection[] = [];

  const cash = {
    current: initialBalance,
    optimistic: initialBalance,
    pessimistic: initialBalance,
  };

  for (let i = 0; i < months; i++) {
    const cResult = calculateMonthlyResult(current?.items || [], incomes, i);
    const oResult = calculateMonthlyResult(optimistic?.items || [], incomes, i);
    const pResult = calculateMonthlyResult(
      pessimistic?.items || [],
      incomes,
      i,
    );

    cash.current += cResult.result;
    cash.optimistic += oResult.result;
    cash.pessimistic += pResult.result;

    projection.push({
      monthIndex: i,
      month: "",
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
