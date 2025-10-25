import { describe, it, expect } from "vitest";
import {
  calculateTransactionStats,
  calculateMonthlyComparison,
  getTopTransactions,
} from "../stats";
import type { TTransaction } from "@/db/types";

describe("calculateTransactionStats", () => {
  it("should calculate total spent correctly", () => {
    const transactions: Partial<TTransaction>[] = [
      { amount: 100, category: "Alimentação", date: "2025-01-01" },
      { amount: 50, category: "Transporte", date: "2025-01-02" },
      { amount: 75, category: "Alimentação", date: "2025-01-03" },
    ];

    const result = calculateTransactionStats(transactions as TTransaction[]);

    expect(result.totalSpent).toBe(225);
    expect(result.averageTransaction).toBe(75);
    expect(result.transactionCount).toBe(3);
  });

  it("should group by category correctly", () => {
    const transactions: Partial<TTransaction>[] = [
      { amount: 100, category: "Alimentação", date: "2025-01-01" },
      { amount: 50, category: "Transporte", date: "2025-01-02" },
      { amount: 75, category: "Alimentação", date: "2025-01-03" },
    ];

    const result = calculateTransactionStats(transactions as TTransaction[]);

    const alimentacao = result.categoryBreakdown.find(
      (c) => c.category === "Alimentação",
    );
    const transporte = result.categoryBreakdown.find(
      (c) => c.category === "Transporte",
    );

    expect(alimentacao?.total).toBe(175);
    expect(alimentacao?.count).toBe(2);
    expect(transporte?.total).toBe(50);
    expect(transporte?.count).toBe(1);
  });

  it("should calculate percentages correctly", () => {
    const transactions: Partial<TTransaction>[] = [
      { amount: 75, category: "Alimentação", date: "2025-01-01" },
      { amount: 25, category: "Transporte", date: "2025-01-02" },
    ];

    const result = calculateTransactionStats(transactions as TTransaction[]);

    const alimentacao = result.categoryBreakdown.find(
      (c) => c.category === "Alimentação",
    );

    expect(alimentacao?.percentage).toBe(75);
  });

  it("should handle empty array", () => {
    const result = calculateTransactionStats([]);

    expect(result.totalSpent).toBe(0);
    expect(result.averageTransaction).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.categoryBreakdown).toEqual([]);
  });

  it("should sort categories by total descending", () => {
    const transactions: Partial<TTransaction>[] = [
      { amount: 50, category: "Transporte", date: "2025-01-01" },
      { amount: 100, category: "Alimentação", date: "2025-01-02" },
      { amount: 25, category: "Lazer", date: "2025-01-03" },
    ];

    const result = calculateTransactionStats(transactions as TTransaction[]);

    expect(result.categoryBreakdown[0].category).toBe("Alimentação");
    expect(result.categoryBreakdown[1].category).toBe("Transporte");
    expect(result.categoryBreakdown[2].category).toBe("Lazer");
  });
});

describe("getTopTransactions", () => {
  it("should return top N transactions by amount", () => {
    const transactions: Partial<TTransaction>[] = [
      { id: "1", amount: 100, category: "A", date: "2025-01-01" },
      { id: "2", amount: 200, category: "B", date: "2025-01-02" },
      { id: "3", amount: 50, category: "C", date: "2025-01-03" },
      { id: "4", amount: 150, category: "D", date: "2025-01-04" },
    ];

    const result = getTopTransactions(transactions as TTransaction[], 2);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("4");
  });
});

describe("calculateMonthlyComparison", () => {
  it("should calculate percentage change correctly", () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const transactions: Partial<TTransaction>[] = [
      {
        amount: 100,
        category: "A",
        date: new Date(currentYear, currentMonth, 1).toISOString(),
      },
      {
        amount: 50,
        category: "B",
        date: new Date(lastMonthYear, lastMonth, 1).toISOString(),
      },
    ];

    const result = calculateMonthlyComparison(transactions as TTransaction[]);

    expect(result.currentMonth).toBe(100);
    expect(result.lastMonth).toBe(50);
    expect(result.percentageChange).toBe(100); // 100% increase
  });
});
