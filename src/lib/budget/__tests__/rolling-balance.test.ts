import { describe, expect, it } from "vitest";
import {
  calculateAvailableBudget,
  calculateCarryOverBalance,
  calculateDailyBalance,
  calculateRemainingDays,
  DEFAULT_CARRY_OVER_MODE,
  parseDateString,
} from "../calculations";

/**
 * These tests describe the rule the whole budget exists for: the balance does
 * not reset at midnight. Saving today raises tomorrow, overspending today eats
 * into it, and both halves matter equally.
 */

const DAILY_BASE = 150;
const CYCLE_START = "2026-08-31"; // Monday
const CYCLE_END = "2026-09-06"; // Sunday

/** Walks a cycle day by day, spending the given amounts in order. */
function runCycle(spending: number[], startingBalance = 0) {
  const end = parseDateString(CYCLE_END);
  const days: {
    date: string;
    available: number;
    spent: number;
    balance: number;
  }[] = [];

  let accumulated = startingBalance;
  const cursor = parseDateString(CYCLE_START);

  for (const spent of spending) {
    const remainingDays = calculateRemainingDays(cursor, end);
    const available = calculateAvailableBudget(
      DAILY_BASE,
      accumulated,
      remainingDays,
    );
    const balance = calculateDailyBalance(available, spent);

    accumulated = Math.round((accumulated + balance) * 100) / 100;
    days.push({
      date: `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`,
      available,
      spent,
      balance,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return { days, accumulated };
}

describe("saving today raises tomorrow", () => {
  it("should give more tomorrow after an economical day", () => {
    const { days } = runCycle([100, 0]);

    expect(days[0].available).toBe(150);
    expect(days[0].balance).toBe(50);
    // 50 saved, spread across the 6 days that are left.
    expect(days[1].available).toBeGreaterThan(150);
  });

  it("should never let a surplus evaporate overnight", () => {
    const { days } = runCycle([0, 0]);

    expect(days[1].available).toBeGreaterThan(days[0].available);
  });

  it("should spread the surplus instead of handing it over at once", () => {
    const { days } = runCycle([50, 0]);

    // 100 saved on day one. Handing it over whole would give 250 on day two.
    expect(days[1].available).toBeLessThan(250);
    expect(days[1].available).toBeGreaterThan(150);
  });
});

describe("overspending today eats into tomorrow", () => {
  it("should give less tomorrow after an expensive day", () => {
    const { days } = runCycle([300, 0]);

    expect(days[0].balance).toBe(-150);
    expect(days[1].available).toBeLessThan(150);
  });

  it("should keep the deficit visible until the cycle absorbs it", () => {
    const { accumulated } = runCycle([300]);

    expect(accumulated).toBeLessThan(0);
  });
});

describe("the two halves are symmetric", () => {
  it("should mirror an equal saving and an equal overspend", () => {
    const saved = runCycle([100, 0]);
    const overspent = runCycle([200, 0]);

    const gain = saved.days[1].available - DAILY_BASE;
    const loss = DAILY_BASE - overspent.days[1].available;

    expect(gain).toBeCloseTo(loss, 2);
  });
});

describe("carry over at the end of the week", () => {
  it("should carry a surplus into the next cycle with carry_all", () => {
    const { accumulated } = runCycle([100, 100, 100, 100, 100, 100, 100]);

    expect(accumulated).toBeGreaterThan(0);
    expect(
      calculateCarryOverBalance(accumulated, DEFAULT_CARRY_OVER_MODE),
    ).toBe(accumulated);
  });

  it("should carry a deficit into the next cycle with carry_all", () => {
    const { accumulated } = runCycle([200, 200, 200, 200, 200, 200, 200]);

    expect(accumulated).toBeLessThan(0);
    expect(
      calculateCarryOverBalance(accumulated, DEFAULT_CARRY_OVER_MODE),
    ).toBe(accumulated);
  });

  it("should throw the surplus away under carry_deficit, which is the wrong mode", () => {
    // Kept as a contrast: this is what the old default did, and why the
    // configured mode has to be carry_all.
    const { accumulated } = runCycle([100, 100, 100, 100, 100, 100, 100]);

    expect(calculateCarryOverBalance(accumulated, "carry_deficit")).toBe(0);
    expect(
      calculateCarryOverBalance(accumulated, DEFAULT_CARRY_OVER_MODE),
    ).toBe(accumulated);
  });

  it("should start the next cycle richer after a frugal week", () => {
    const frugal = runCycle([100, 100, 100, 100, 100, 100, 100]);
    const carried = calculateCarryOverBalance(
      frugal.accumulated,
      DEFAULT_CARRY_OVER_MODE,
    );

    const nextWeek = runCycle([0], carried);

    expect(nextWeek.days[0].available).toBeGreaterThan(DAILY_BASE);
  });
});

describe("a week of R$ 150 per day", () => {
  it("should budget 1050 across the week when nothing is spent", () => {
    const { days } = runCycle([0, 0, 0, 0, 0, 0, 0]);
    const firstDay = days[0].available;

    expect(firstDay).toBe(150);
    expect(days).toHaveLength(7);
  });

  it("should end the week even when every day lands exactly on target", () => {
    const { accumulated } = runCycle([150, 150, 150, 150, 150, 150, 150]);

    expect(accumulated).toBe(0);
  });

  it("should count seven days on the first day of the cycle", () => {
    const remaining = calculateRemainingDays(
      parseDateString(CYCLE_START),
      parseDateString(CYCLE_END),
    );

    expect(remaining).toBe(7);
  });

  it("should count one day on the last day of the cycle", () => {
    const remaining = calculateRemainingDays(
      parseDateString(CYCLE_END),
      parseDateString(CYCLE_END),
    );

    expect(remaining).toBe(1);
  });
});
