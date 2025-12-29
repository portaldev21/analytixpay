/**
 * Core budget calculation functions for Rolling Budget (Orcamento Fluido)
 *
 * These are pure functions for testability.
 * Main formula: Available_Budget = Daily_Base + (Accumulated_Balance / Remaining_Days)
 */

import type { TBudgetStatus, TCarryOverMode } from "@/db/types";

/**
 * Calculates the available budget for today
 *
 * @param dailyBase - The user's configured daily budget base
 * @param accumulatedBalance - Sum of all daily balances in the cycle so far
 * @param remainingDays - Days remaining in the cycle (including today)
 * @returns The calculated available budget for today
 *
 * @example
 * // With positive accumulated balance (savings from previous days)
 * calculateAvailableBudget(100, 20, 5) // Returns 104 (100 + 20/5)
 *
 * // With negative accumulated balance (overspending)
 * calculateAvailableBudget(100, -50, 5) // Returns 90 (100 + -50/5)
 */
export function calculateAvailableBudget(
  dailyBase: number,
  accumulatedBalance: number,
  remainingDays: number,
): number {
  if (remainingDays <= 0) return dailyBase;

  const adjustment = accumulatedBalance / remainingDays;
  return Math.round((dailyBase + adjustment) * 100) / 100;
}

/**
 * Calculates the daily balance (residual) for a day
 *
 * @param availableBudget - The budget available for the day
 * @param totalSpent - Total amount spent on that day
 * @returns The daily balance (positive = savings, negative = overspending)
 *
 * @example
 * calculateDailyBalance(100, 80) // Returns 20 (saved R$20)
 * calculateDailyBalance(100, 120) // Returns -20 (overspent R$20)
 */
export function calculateDailyBalance(
  availableBudget: number,
  totalSpent: number,
): number {
  return Math.round((availableBudget - totalSpent) * 100) / 100;
}

/**
 * Calculates the number of days remaining in the cycle (including today)
 *
 * @param currentDate - The current date
 * @param cycleEndDate - The end date of the cycle
 * @returns Number of days remaining (minimum 1)
 *
 * @example
 * // If today is Wednesday and cycle ends on Sunday
 * calculateRemainingDays(new Date('2024-12-25'), new Date('2024-12-29')) // Returns 5
 */
export function calculateRemainingDays(
  currentDate: Date,
  cycleEndDate: Date,
): number {
  // Normalize both dates to start of day (midnight) to avoid timezone issues
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(cycleEndDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // +1 because we include today
  return Math.max(1, diffDays + 1);
}

/**
 * Calculates the start and end dates for a week cycle
 *
 * @param referenceDate - A date within the desired week
 * @param weekStartDay - Day the week starts (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Object with start and end dates of the week
 *
 * @example
 * // Get week cycle for Monday-Sunday week containing Dec 25, 2024
 * calculateWeekCycleDates(new Date(2024, 11, 25), 1)
 * // Returns { start: '2024-12-23', end: '2024-12-29' }
 */
export function calculateWeekCycleDates(
  referenceDate: Date,
  weekStartDay: number,
): { start: Date; end: Date } {
  // Create a new date to avoid mutating the input
  // Use year, month, day to avoid timezone issues
  const current = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12, // Use noon to avoid DST edge cases
    0,
    0,
    0,
  );
  const currentDay = current.getDay();

  // Calculate how many days to subtract to get to the start of the week
  let daysToSubtract = currentDay - weekStartDay;
  if (daysToSubtract < 0) daysToSubtract += 7;

  // Calculate start date
  const start = new Date(current);
  start.setDate(current.getDate() - daysToSubtract);
  start.setHours(0, 0, 0, 0);

  // Calculate end date (6 days after start)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Determines the budget status based on available budget vs daily base
 *
 * @param availableBudget - Current available budget
 * @param dailyBase - The configured daily base
 * @returns The budget status
 *
 * @example
 * getBudgetStatus(120, 100) // Returns 'above_base' (has credit)
 * getBudgetStatus(100, 100) // Returns 'at_base' (balanced)
 * getBudgetStatus(80, 100)  // Returns 'below_base' (has debt)
 * getBudgetStatus(40, 100)  // Returns 'critical' (< 50% of base)
 */
export function getBudgetStatus(
  availableBudget: number,
  dailyBase: number,
): TBudgetStatus {
  if (dailyBase <= 0) return "at_base";

  const ratio = availableBudget / dailyBase;

  if (ratio < 0.5) return "critical";
  if (ratio < 1) return "below_base";
  if (ratio > 1) return "above_base";
  return "at_base";
}

/**
 * Calculates derived budgets (weekly, monthly, yearly) from daily base
 *
 * @param dailyBase - The user's configured daily budget base
 * @param month - Optional month (0-11) for accurate monthly calculation
 * @param year - Optional year for accurate monthly calculation
 * @returns Object with daily, weekly, monthly, and yearly budgets
 *
 * @example
 * calculateDerivedBudgets(100)
 * // Returns { daily: 100, weekly: 700, monthly: 3000, yearly: 36500 }
 *
 * calculateDerivedBudgets(100, 1, 2024) // February 2024 (29 days)
 * // Returns { daily: 100, weekly: 700, monthly: 2900, yearly: 36600 }
 */
export function calculateDerivedBudgets(
  dailyBase: number,
  month?: number,
  year?: number,
): { daily: number; weekly: number; monthly: number; yearly: number } {
  const weekly = dailyBase * 7;

  let monthly = dailyBase * 30; // Default to 30 days
  let yearly = dailyBase * 365;

  if (month !== undefined && year !== undefined) {
    // Get actual days in the specified month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    monthly = dailyBase * daysInMonth;

    // Check if leap year for yearly calculation
    const isLeapYear =
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    yearly = dailyBase * (isLeapYear ? 366 : 365);
  }

  return {
    daily: dailyBase,
    weekly: Math.round(weekly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    yearly: Math.round(yearly * 100) / 100,
  };
}

/**
 * Calculates the carry-over balance for the next cycle based on mode
 *
 * @param accumulatedBalance - The accumulated balance at end of cycle
 * @param mode - The carry-over mode
 * @returns The balance to carry to the next cycle
 *
 * @example
 * // Positive balance scenarios
 * calculateCarryOverBalance(50, 'reset')        // Returns 0
 * calculateCarryOverBalance(50, 'carry_all')    // Returns 50
 * calculateCarryOverBalance(50, 'carry_deficit') // Returns 0 (only negative carries)
 * calculateCarryOverBalance(50, 'carry_credit')  // Returns 50
 *
 * // Negative balance scenarios
 * calculateCarryOverBalance(-30, 'reset')        // Returns 0
 * calculateCarryOverBalance(-30, 'carry_all')    // Returns -30
 * calculateCarryOverBalance(-30, 'carry_deficit') // Returns -30
 * calculateCarryOverBalance(-30, 'carry_credit')  // Returns 0 (only positive carries)
 */
export function calculateCarryOverBalance(
  accumulatedBalance: number,
  mode: TCarryOverMode,
): number {
  switch (mode) {
    case "carry_all":
      return accumulatedBalance;
    case "carry_deficit":
      return Math.min(0, accumulatedBalance);
    case "carry_credit":
      return Math.max(0, accumulatedBalance);
    case "reset":
    default:
      return 0;
  }
}

/**
 * Validates a daily base value
 *
 * @param dailyBase - The value to validate
 * @throws Error if value is invalid
 */
export function validateDailyBase(dailyBase: number): void {
  if (typeof dailyBase !== "number" || !Number.isFinite(dailyBase)) {
    throw new Error("Base diaria deve ser um numero valido");
  }
  if (dailyBase <= 0) {
    throw new Error("Base diaria deve ser positiva");
  }
  if (dailyBase > 100000) {
    throw new Error("Base diaria muito alta (maximo R$ 100.000)");
  }
}

/**
 * Validates an expense amount
 *
 * @param amount - The amount to validate
 * @throws Error if amount is invalid
 */
export function validateExpenseAmount(amount: number): void {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Valor do gasto deve ser um numero valido");
  }
  if (amount <= 0) {
    throw new Error("Valor do gasto deve ser positivo");
  }
  if (amount > 1000000) {
    throw new Error("Valor do gasto muito alto (maximo R$ 1.000.000)");
  }
}

/**
 * Validates an expense date is within a cycle
 *
 * @param date - The expense date
 * @param cycleStart - The cycle start date
 * @param cycleEnd - The cycle end date
 * @throws Error if date is outside the cycle
 */
export function validateExpenseDate(
  date: Date,
  cycleStart: Date,
  cycleEnd: Date,
): void {
  const expenseDate = new Date(date);
  expenseDate.setHours(0, 0, 0, 0);

  const start = new Date(cycleStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(cycleEnd);
  end.setHours(23, 59, 59, 999);

  if (expenseDate < start || expenseDate > end) {
    throw new Error("Data do gasto fora do ciclo atual");
  }
}

/**
 * Formats a date to YYYY-MM-DD string
 *
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string to Date object
 *
 * @param dateString - The date string to parse
 * @returns Date object
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Gets today's date at midnight (start of day)
 *
 * @returns Today's date at 00:00:00.000
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
