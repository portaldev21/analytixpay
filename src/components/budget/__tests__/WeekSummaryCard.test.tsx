import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TDailyRecord, TWeekSummary } from "@/db/types";
import { WeekSummaryCard } from "../WeekSummaryCard";

const ACCOUNT = "account-1";
const CYCLE_START = "2026-08-31"; // Monday
const CYCLE_END = "2026-09-06"; // Sunday
const DAILY_BASE = 150;

function dailyRecord(
  date: string,
  spent: number,
  available = DAILY_BASE,
): TDailyRecord {
  return {
    id: `record-${date}`,
    account_id: ACCOUNT,
    cycle_id: "cycle-1",
    record_date: date,
    base_budget: DAILY_BASE,
    available_budget: available,
    total_spent: spent,
    daily_balance: Math.round((available - spent) * 100) / 100,
    remaining_days: 1,
    created_at: `${date}T00:00:00.000Z`,
    updated_at: `${date}T00:00:00.000Z`,
  };
}

function summary(
  records: TDailyRecord[],
  accumulatedBalance: number,
): TWeekSummary {
  const totalSpent = records.reduce((sum, r) => sum + r.total_spent, 0);

  return {
    cycle: {
      id: "cycle-1",
      account_id: ACCOUNT,
      config_id: "config-1",
      start_date: CYCLE_START,
      end_date: CYCLE_END,
      initial_budget: DAILY_BASE * 7,
      carried_balance: 0,
      accumulated_balance: accumulatedBalance,
      status: "active",
      created_at: `${CYCLE_START}T00:00:00.000Z`,
      updated_at: `${CYCLE_START}T00:00:00.000Z`,
    },
    daily_records: records,
    total_budget: DAILY_BASE * 7,
    total_spent: totalSpent,
    total_saved: 0,
    average_daily_spent: records.length ? totalSpent / records.length : 0,
    days_over_budget: 0,
    days_under_budget: 0,
    comparison_with_actual: {
      manual_total: totalSpent,
      invoice_total: 0,
      difference: totalSpent,
    },
  };
}

/** Reads the cells of the table row for a given day label. */
function row(label: string) {
  const cell = screen.getByText(label);
  const tr = cell.closest("tr");
  if (!tr) throw new Error(`no row for ${label}`);

  const cells = within(tr)
    .getAllByRole("cell")
    .map((td) => (td.textContent ?? "").replace(/\u00a0/g, " ").trim());

  return {
    dia: cells[0],
    gasto: cells[1],
    disponivel: cells[2],
    acumulado: cells[3],
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // Friday, the 5th day of a Monday-to-Sunday cycle.
  vi.setSystemTime(new Date(2026, 8, 4, 10, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the available column agrees with the day budget", () => {
  it("should show the daily base today when nothing was carried over", () => {
    // The card above this table says R$ 150,00. The table has to say the same.
    render(<WeekSummaryCard data={summary([], 0)} />);

    expect(row("04 de set.").disponivel).toBe("R$ 150,00");
  });

  it("should not spread the whole weekly budget over the days that are left", () => {
    render(<WeekSummaryCard data={summary([], 0)} />);

    // 1050 divided by the 3 remaining days would be 350.
    expect(row("04 de set.").disponivel).not.toBe("R$ 350,00");
    expect(row("05 de set.").disponivel).not.toBe("R$ 525,00");
    expect(row("06 de set.").disponivel).not.toBe("R$ 1.050,00");
  });

  it("should raise the daily figure when a surplus was carried", () => {
    // 60 saved, 3 days left: 150 + 60/3.
    render(<WeekSummaryCard data={summary([], 60)} />);

    expect(row("04 de set.").disponivel).toBe("R$ 170,00");
  });

  it("should lower the daily figure when a deficit was carried", () => {
    render(<WeekSummaryCard data={summary([], -60)} />);

    expect(row("04 de set.").disponivel).toBe("R$ 130,00");
  });

  it("should show what a past day actually had available", () => {
    const records = [dailyRecord("2026-09-03", 120, 140)];

    render(<WeekSummaryCard data={summary(records, 20)} />);

    expect(row("03 de set.").disponivel).toBe("R$ 140,00");
  });
});

describe("the accumulated column is the balance, not the spending", () => {
  it("should show the running balance day by day", () => {
    const records = [
      dailyRecord(CYCLE_START, 100), // saved 50
      dailyRecord("2026-09-01", 200), // overspent 50
    ];

    render(<WeekSummaryCard data={summary(records, 0)} />);

    expect(row("31 de ago.").acumulado).toBe("R$ 50,00");
    expect(row("01 de set.").acumulado).toBe("R$ 0,00");
  });

  it("should agree with the balance shown in the footer", () => {
    const records = [dailyRecord(CYCLE_START, 100)];

    render(<WeekSummaryCard data={summary(records, 50)} />);

    expect(row("31 de ago.").acumulado).toBe("R$ 50,00");
    expect(screen.getByText(/Saldo:/)).toHaveTextContent("R$ 50,00");
  });

  it("should go negative after an expensive day", () => {
    const records = [dailyRecord(CYCLE_START, 250)];

    render(<WeekSummaryCard data={summary(records, -100)} />);

    expect(row("31 de ago.").acumulado).toContain("100,00");
  });
});

describe("a day still in progress does not count as saved", () => {
  it("should not show today's untouched budget as an accumulated surplus", () => {
    // A fresh day starts with daily_balance equal to the whole available
    // budget, because nothing has been spent yet. Counting that as saved
    // claimed a surplus of a full day before the day had even happened, and
    // contradicted the balance in the footer.
    const today = dailyRecord("2026-09-04", 0, 150);

    render(<WeekSummaryCard data={summary([today], 0)} />);

    expect(row("04 de set.").acumulado).toBe("—");
    expect(screen.getByText(/Saldo:/)).toHaveTextContent("R$ 0,00");
  });

  it("should still show what was spent today", () => {
    const today = dailyRecord("2026-09-04", 40, 150);

    render(<WeekSummaryCard data={summary([today], 0)} />);

    expect(row("04 de set.").gasto).toBe("R$ 40,00");
    expect(row("04 de set.").acumulado).toBe("—");
  });

  it("should carry the balance of the days that are finished", () => {
    const records = [
      dailyRecord(CYCLE_START, 100), // saved 50
      dailyRecord("2026-09-04", 0, 150), // today, still open
    ];

    render(<WeekSummaryCard data={summary(records, 50)} />);

    expect(row("31 de ago.").acumulado).toBe("R$ 50,00");
    expect(row("04 de set.").acumulado).toBe("—");
  });
});

describe("the spending column", () => {
  it("should show a dash for a day with no record", () => {
    render(<WeekSummaryCard data={summary([], 0)} />);

    expect(row("31 de ago.").gasto).toBe("—");
  });

  it("should show what was spent on a day that has one", () => {
    render(
      <WeekSummaryCard data={summary([dailyRecord(CYCLE_START, 90)], 60)} />,
    );

    expect(row("31 de ago.").gasto).toBe("R$ 90,00");
  });
});
