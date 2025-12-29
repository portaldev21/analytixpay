import { describe, expect, it } from "vitest";
import {
  calculateAvailableBudget,
  calculateDailyBalance,
  calculateRemainingDays,
  calculateWeekCycleDates,
  getBudgetStatus,
  calculateDerivedBudgets,
  calculateCarryOverBalance,
  validateDailyBase,
  validateExpenseAmount,
  formatDateToString,
  parseDateString,
} from "../calculations";

describe("calculateAvailableBudget", () => {
  it("should return base when remaining days is 0", () => {
    expect(calculateAvailableBudget(100, 50, 0)).toBe(100);
  });

  it("should return base when remaining days is negative", () => {
    expect(calculateAvailableBudget(100, 50, -1)).toBe(100);
  });

  it("should add positive adjustment from savings", () => {
    // R$ 20 savings with 5 days remaining = R$ 4 adjustment per day
    expect(calculateAvailableBudget(100, 20, 5)).toBe(104);
  });

  it("should subtract negative adjustment from overspending", () => {
    // R$ 50 overspent with 5 days remaining = -R$ 10 adjustment per day
    expect(calculateAvailableBudget(100, -50, 5)).toBe(90);
  });

  it("should handle example from spec - balanced week day 2", () => {
    // From spec: Ter = 100 + (20÷6) = 103.33
    expect(calculateAvailableBudget(100, 20, 6)).toBeCloseTo(103.33, 2);
  });

  it("should handle last day of cycle with accumulated savings", () => {
    // From spec: Dom = 100 + (25÷1) = 125
    expect(calculateAvailableBudget(100, 25, 1)).toBe(125);
  });

  it("should handle excessive overspending", () => {
    // From spec: After R$200 spent on first day = 100 + (-100÷6) = 83.33
    expect(calculateAvailableBudget(100, -100, 6)).toBeCloseTo(83.33, 2);
  });
});

describe("calculateDailyBalance", () => {
  it("should return positive balance when under budget", () => {
    expect(calculateDailyBalance(100, 80)).toBe(20);
  });

  it("should return negative balance when over budget", () => {
    expect(calculateDailyBalance(100, 120)).toBe(-20);
  });

  it("should return zero when exactly at budget", () => {
    expect(calculateDailyBalance(100, 100)).toBe(0);
  });

  it("should handle decimal values", () => {
    expect(calculateDailyBalance(103.33, 100)).toBe(3.33);
  });
});

describe("calculateRemainingDays", () => {
  it("should return 1 for same day", () => {
    const today = new Date("2024-12-25");
    const cycleEnd = new Date("2024-12-25");
    expect(calculateRemainingDays(today, cycleEnd)).toBe(1);
  });

  it("should return correct days for mid-week", () => {
    const wednesday = new Date("2024-12-25"); // Wednesday
    const sunday = new Date("2024-12-29"); // Sunday
    expect(calculateRemainingDays(wednesday, sunday)).toBe(5);
  });

  it("should return 7 for first day of week", () => {
    const monday = new Date("2024-12-23"); // Monday
    const sunday = new Date("2024-12-29"); // Sunday
    expect(calculateRemainingDays(monday, sunday)).toBe(7);
  });

  it("should return 1 for last day of week", () => {
    const sunday = new Date("2024-12-29");
    const cycleEnd = new Date("2024-12-29");
    expect(calculateRemainingDays(sunday, cycleEnd)).toBe(1);
  });

  it("should handle timezone edge cases", () => {
    const friday = new Date("2024-12-27T23:59:00");
    const sunday = new Date("2024-12-29T00:00:00");
    expect(calculateRemainingDays(friday, sunday)).toBe(3);
  });
});

describe("calculateWeekCycleDates", () => {
  it("should calculate Monday-Sunday week correctly", () => {
    // December 25, 2024 is a Wednesday
    const wednesday = new Date(2024, 11, 25);
    const { start, end } = calculateWeekCycleDates(wednesday, 1); // 1 = Monday

    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(11); // December
    expect(start.getDate()).toBe(23); // Monday

    expect(end.getDate()).toBe(29); // Sunday
  });

  it("should calculate Sunday-Saturday week correctly", () => {
    // December 25, 2024 is a Wednesday
    const wednesday = new Date(2024, 11, 25);
    const { start, end } = calculateWeekCycleDates(wednesday, 0); // 0 = Sunday

    expect(start.getDate()).toBe(22); // Sunday
    expect(end.getDate()).toBe(28); // Saturday
  });

  it("should handle week start on same day as reference", () => {
    // December 23, 2024 is a Monday
    const monday = new Date(2024, 11, 23);
    const { start, end } = calculateWeekCycleDates(monday, 1); // 1 = Monday

    expect(start.getDate()).toBe(23);
    expect(end.getDate()).toBe(29);
  });

  it("should handle week crossing month boundary", () => {
    // December 30, 2024 is a Monday
    const monday = new Date(2024, 11, 30);
    const { start, end } = calculateWeekCycleDates(monday, 1);

    expect(start.getMonth()).toBe(11); // December
    expect(start.getDate()).toBe(30);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getFullYear()).toBe(2025);
    expect(end.getDate()).toBe(5);
  });
});

describe("getBudgetStatus", () => {
  it("should return 'above_base' when over 100%", () => {
    expect(getBudgetStatus(120, 100)).toBe("above_base");
  });

  it("should return 'at_base' when exactly 100%", () => {
    expect(getBudgetStatus(100, 100)).toBe("at_base");
  });

  it("should return 'below_base' when between 50% and 100%", () => {
    expect(getBudgetStatus(80, 100)).toBe("below_base");
    expect(getBudgetStatus(50, 100)).toBe("below_base");
  });

  it("should return 'critical' when below 50%", () => {
    expect(getBudgetStatus(49, 100)).toBe("critical");
    expect(getBudgetStatus(25, 100)).toBe("critical");
    expect(getBudgetStatus(0, 100)).toBe("critical");
  });

  it("should handle edge case of zero base", () => {
    expect(getBudgetStatus(100, 0)).toBe("at_base");
  });
});

describe("calculateDerivedBudgets", () => {
  it("should calculate correct weekly budget", () => {
    const result = calculateDerivedBudgets(100);
    expect(result.weekly).toBe(700);
  });

  it("should calculate correct default monthly budget (30 days)", () => {
    const result = calculateDerivedBudgets(100);
    expect(result.monthly).toBe(3000);
  });

  it("should calculate correct yearly budget", () => {
    const result = calculateDerivedBudgets(100);
    expect(result.yearly).toBe(36500);
  });

  it("should calculate correct monthly for specific month (31 days)", () => {
    const result = calculateDerivedBudgets(100, 0, 2024); // January 2024
    expect(result.monthly).toBe(3100);
  });

  it("should calculate correct monthly for February (leap year)", () => {
    const result = calculateDerivedBudgets(100, 1, 2024); // February 2024
    expect(result.monthly).toBe(2900); // 29 days
  });

  it("should calculate correct monthly for February (non-leap year)", () => {
    const result = calculateDerivedBudgets(100, 1, 2023); // February 2023
    expect(result.monthly).toBe(2800); // 28 days
  });

  it("should calculate correct yearly for leap year", () => {
    const result = calculateDerivedBudgets(100, 0, 2024);
    expect(result.yearly).toBe(36600); // 366 days
  });
});

describe("calculateCarryOverBalance", () => {
  describe("reset mode", () => {
    it("should return 0 for positive balance", () => {
      expect(calculateCarryOverBalance(50, "reset")).toBe(0);
    });

    it("should return 0 for negative balance", () => {
      expect(calculateCarryOverBalance(-30, "reset")).toBe(0);
    });
  });

  describe("carry_all mode", () => {
    it("should carry positive balance", () => {
      expect(calculateCarryOverBalance(50, "carry_all")).toBe(50);
    });

    it("should carry negative balance", () => {
      expect(calculateCarryOverBalance(-30, "carry_all")).toBe(-30);
    });
  });

  describe("carry_deficit mode (default for user)", () => {
    it("should not carry positive balance", () => {
      expect(calculateCarryOverBalance(50, "carry_deficit")).toBe(0);
    });

    it("should carry negative balance", () => {
      expect(calculateCarryOverBalance(-30, "carry_deficit")).toBe(-30);
    });

    it("should return 0 for zero balance", () => {
      expect(calculateCarryOverBalance(0, "carry_deficit")).toBe(0);
    });
  });

  describe("carry_credit mode", () => {
    it("should carry positive balance", () => {
      expect(calculateCarryOverBalance(50, "carry_credit")).toBe(50);
    });

    it("should not carry negative balance", () => {
      expect(calculateCarryOverBalance(-30, "carry_credit")).toBe(0);
    });
  });
});

describe("validateDailyBase", () => {
  it("should accept valid positive values", () => {
    expect(() => validateDailyBase(100)).not.toThrow();
    expect(() => validateDailyBase(1)).not.toThrow();
    expect(() => validateDailyBase(99999)).not.toThrow();
  });

  it("should reject zero", () => {
    expect(() => validateDailyBase(0)).toThrow("deve ser positiva");
  });

  it("should reject negative values", () => {
    expect(() => validateDailyBase(-50)).toThrow("deve ser positiva");
  });

  it("should reject values over 100000", () => {
    expect(() => validateDailyBase(100001)).toThrow("muito alta");
  });

  it("should reject non-finite values", () => {
    expect(() => validateDailyBase(Number.POSITIVE_INFINITY)).toThrow("numero valido");
    expect(() => validateDailyBase(Number.NaN)).toThrow("numero valido");
  });
});

describe("validateExpenseAmount", () => {
  it("should accept valid positive values", () => {
    expect(() => validateExpenseAmount(50)).not.toThrow();
    expect(() => validateExpenseAmount(0.01)).not.toThrow();
    expect(() => validateExpenseAmount(999999)).not.toThrow();
  });

  it("should reject zero", () => {
    expect(() => validateExpenseAmount(0)).toThrow("deve ser positivo");
  });

  it("should reject negative values", () => {
    expect(() => validateExpenseAmount(-10)).toThrow("deve ser positivo");
  });

  it("should reject values over 1000000", () => {
    expect(() => validateExpenseAmount(1000001)).toThrow("muito alto");
  });
});

describe("formatDateToString", () => {
  it("should format date correctly", () => {
    const date = new Date(2024, 11, 25); // December 25, 2024
    expect(formatDateToString(date)).toBe("2024-12-25");
  });

  it("should pad single digit months and days", () => {
    const date = new Date(2024, 0, 5); // January 5, 2024
    expect(formatDateToString(date)).toBe("2024-01-05");
  });
});

describe("parseDateString", () => {
  it("should parse date string correctly", () => {
    const date = parseDateString("2024-12-25");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(11); // December
    expect(date.getDate()).toBe(25);
  });

  it("should roundtrip with formatDateToString", () => {
    const original = "2024-06-15";
    const parsed = parseDateString(original);
    const formatted = formatDateToString(parsed);
    expect(formatted).toBe(original);
  });
});

// Integration test: Simulate a week from the spec
describe("Week Simulation from Spec", () => {
  it("should simulate balanced week correctly", () => {
    const dailyBase = 100;
    let accumulatedBalance = 0;
    const weekData = [
      { day: "Seg", spent: 80 },
      { day: "Ter", spent: 100 },
      { day: "Qua", spent: 110 },
      { day: "Qui", spent: 100 },
      { day: "Sex", spent: 120 },
      { day: "Sab", spent: 90 },
      { day: "Dom", spent: 125 },
    ];

    const results = weekData.map((dayData, index) => {
      const remainingDays = 7 - index;
      const availableBudget = calculateAvailableBudget(
        dailyBase,
        accumulatedBalance,
        remainingDays,
      );
      const dailyBalance = calculateDailyBalance(
        availableBudget,
        dayData.spent,
      );
      accumulatedBalance += dailyBalance;

      return {
        day: dayData.day,
        available: availableBudget,
        spent: dayData.spent,
        balance: dailyBalance,
        accumulated: accumulatedBalance,
      };
    });

    // Check first day
    expect(results[0].available).toBe(100);
    expect(results[0].balance).toBe(20); // 100 - 80

    // Check second day (should have adjustment)
    expect(results[1].available).toBeCloseTo(103.33, 2); // 100 + (20/6)

    // Last day balance should be 0 (spent exactly what was available)
    expect(results[6].balance).toBe(0);

    // Last day available budget should be 125 (100 + 25/1)
    expect(results[6].available).toBe(125);
  });

  it("should simulate economic week with savings accumulation", () => {
    const dailyBase = 100;
    let accumulatedBalance = 0;
    const economicWeek = [
      { spent: 50 },
      { spent: 60 },
      { spent: 70 },
      { spent: 80 },
      { spent: 100 },
      { spent: 150 },
      { spent: 300 },
    ];

    let lastAvailable = 0;
    economicWeek.forEach((dayData, index) => {
      const remainingDays = 7 - index;
      const availableBudget = calculateAvailableBudget(
        dailyBase,
        accumulatedBalance,
        remainingDays,
      );
      const dailyBalance = calculateDailyBalance(
        availableBudget,
        dayData.spent,
      );
      accumulatedBalance += dailyBalance;
      lastAvailable = availableBudget;
    });

    // Last day should have much higher available budget due to savings
    expect(lastAvailable).toBeGreaterThan(400); // Spec shows R$ 460

    // Should end with significant positive balance
    expect(accumulatedBalance).toBeGreaterThan(500);
  });
});
