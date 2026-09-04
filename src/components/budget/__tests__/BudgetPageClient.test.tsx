import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExpensesForDate } from "@/actions/budget.actions";
import type {
  TBudgetExpense,
  TDailyRecord,
  TTodayBudgetResponse,
  TWeekSummary,
} from "@/db/types";
import { BudgetPageClient } from "../BudgetPageClient";

vi.mock("@/actions/budget.actions", () => ({
  getExpensesForDate: vi.fn(),
  addBudgetExpense: vi.fn(),
  deleteBudgetExpense: vi.fn(),
}));

const mockedFetch = vi.mocked(getExpensesForDate);

const ACCOUNT = "account-1";
const TODAY = "2026-09-02"; // Wednesday
const CYCLE_START = "2026-08-31"; // Monday
const CYCLE_END = "2026-09-06"; // Sunday

const todayBudget: TTodayBudgetResponse = {
  date: TODAY,
  available_budget: 150,
  base_budget: 150,
  adjustment: 0,
  total_spent_today: 0,
  remaining_today: 150,
  actual_from_invoices: 0,
  manual_expenses: 0,
  cycle_info: {
    id: "cycle-1",
    days_remaining: 5,
    accumulated_balance: 0,
    week_start: CYCLE_START,
    week_end: CYCLE_END,
  },
  status: "at_base",
};

function dailyRecord(date: string, spent: number): TDailyRecord {
  return {
    id: `record-${date}`,
    account_id: ACCOUNT,
    cycle_id: "cycle-1",
    record_date: date,
    base_budget: 150,
    available_budget: 150,
    total_spent: spent,
    daily_balance: 150 - spent,
    remaining_days: 5,
    created_at: `${date}T00:00:00.000Z`,
    updated_at: `${date}T00:00:00.000Z`,
  };
}

const weekSummary: TWeekSummary = {
  cycle: {
    id: "cycle-1",
    account_id: ACCOUNT,
    config_id: "config-1",
    start_date: CYCLE_START,
    end_date: CYCLE_END,
    initial_budget: 1050,
    carried_balance: 0,
    accumulated_balance: 60,
    status: "active",
    created_at: `${CYCLE_START}T00:00:00.000Z`,
    updated_at: `${CYCLE_START}T00:00:00.000Z`,
  },
  daily_records: [dailyRecord(CYCLE_START, 120), dailyRecord("2026-09-01", 120)],
  total_budget: 1050,
  total_spent: 240,
  total_saved: 60,
  average_daily_spent: 120,
  days_over_budget: 0,
  days_under_budget: 2,
  comparison_with_actual: {
    manual_total: 240,
    invoice_total: 0,
    difference: 240,
  },
};

function expense(id: string, date: string, amount: number): TBudgetExpense {
  return {
    id,
    account_id: ACCOUNT,
    daily_record_id: `record-${date}`,
    user_id: "user-1",
    amount,
    category: "Alimentacao",
    description: `Gasto ${id}`,
    expense_date: date,
    expense_time: null,
    reconciled_transaction_id: null,
    reconciliation_status: "pending",
    created_at: `${date}T10:00:00.000Z`,
    updated_at: `${date}T10:00:00.000Z`,
  };
}

function renderPage(initialExpenses: TBudgetExpense[] = []) {
  return render(
    <BudgetPageClient
      todayBudget={todayBudget}
      weekSummary={weekSummary}
      initialExpenses={initialExpenses}
      accountId={ACCOUNT}
      todayStr={TODAY}
    />,
  );
}

/** The clickable day buttons on the week strip, in cycle order. */
function dayButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) => /^[DSTQ]$/.test(button.textContent?.trim() ?? ""));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 8, 2, 10, 0, 0));
  mockedFetch.mockResolvedValue({
    success: true,
    data: [],
    error: null,
    // biome-ignore lint/suspicious/noExplicitAny: partial response is enough
  } as any);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the week strip", () => {
  it("should show one button per day of the cycle", () => {
    renderPage();

    expect(dayButtons()).toHaveLength(7);
  });

  it("should disable the days that have not happened yet", () => {
    renderPage();

    const buttons = dayButtons();
    // Monday to Wednesday are past or today, Thursday onwards is not.
    expect(buttons[0]).toBeEnabled();
    expect(buttons[2]).toBeEnabled();
    expect(buttons[3]).toBeDisabled();
    expect(buttons[6]).toBeDisabled();
  });

  it("should start on today", () => {
    renderPage([expense("e0", TODAY, 20)]);

    expect(screen.getByText("Gastos de Hoje")).toBeInTheDocument();
  });

  it("should name the day in the empty state instead of always saying today", async () => {
    renderPage();

    expect(screen.getByText("Nenhum gasto registrado hoje")).toBeInTheDocument();

    fireEvent.click(dayButtons()[0]);

    expect(await screen.findByText(/Nenhum gasto em/)).toBeInTheDocument();
  });
});

describe("looking at another day", () => {
  it("should load the expenses of the day that was clicked", async () => {
    renderPage();

    fireEvent.click(dayButtons()[0]);

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
    expect(mockedFetch).toHaveBeenCalledWith(ACCOUNT, CYCLE_START);
  });

  it("should show the expenses that came back", async () => {
    mockedFetch.mockResolvedValue({
      success: true,
      data: [expense("e1", CYCLE_START, 45)],
      error: null,
      // biome-ignore lint/suspicious/noExplicitAny: partial response is enough
    } as any);

    renderPage();
    fireEvent.click(dayButtons()[0]);

    expect(await screen.findByText("Gasto e1")).toBeInTheDocument();
  });

  it("should say out loud that this is not today", async () => {
    mockedFetch.mockResolvedValue({
      success: true,
      data: [expense("e1", CYCLE_START, 45)],
      error: null,
      // biome-ignore lint/suspicious/noExplicitAny: partial response is enough
    } as any);

    renderPage();
    fireEvent.click(dayButtons()[0]);

    expect(
      await screen.findByText("Visualizando dia anterior"),
    ).toBeInTheDocument();
  });

  it("should not fetch anything for a day that has not happened", () => {
    renderPage();

    fireEvent.click(dayButtons()[5]);

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("should come back to today when today is clicked", async () => {
    mockedFetch.mockResolvedValue({
      success: true,
      data: [expense("e1", TODAY, 45)],
      error: null,
      // biome-ignore lint/suspicious/noExplicitAny: partial response is enough
    } as any);

    renderPage([expense("e0", TODAY, 20)]);

    fireEvent.click(dayButtons()[0]);
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    fireEvent.click(dayButtons()[2]);

    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
    expect(mockedFetch).toHaveBeenLastCalledWith(ACCOUNT, TODAY);
    expect(await screen.findByText("Gastos de Hoje")).toBeInTheDocument();
  });
});

describe("the form follows the selected day", () => {
  it("should offer to log the expense on the day being viewed", async () => {
    renderPage();

    fireEvent.click(dayButtons()[0]);
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("Mais detalhes"));

    expect(screen.getByDisplayValue(CYCLE_START)).toBeInTheDocument();
    expect(screen.getByText(/Lancamento retroativo/)).toBeInTheDocument();
  });
});

describe("the day by day table", () => {
  it("should list every day of the cycle", () => {
    renderPage();

    expect(screen.getByText("Dia")).toBeInTheDocument();
    expect(screen.getByText("Acumulado")).toBeInTheDocument();
  });

  it("should show the accumulated balance of the week", () => {
    renderPage();

    expect(screen.getByText(/Saldo:/)).toBeInTheDocument();
  });
});
