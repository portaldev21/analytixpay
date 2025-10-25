import type { TTransaction } from "@/db/types";

/**
 * Recurring transaction frequency
 */
export type RecurringFrequency = "weekly" | "monthly" | "yearly";

/**
 * Recurring transaction interface
 */
export interface RecurringTransaction {
  description: string;
  category: string;
  averageAmount: number;
  frequency: RecurringFrequency;
  confidence: number; // 0-100%
  nextExpectedDate: string;
  occurrences: Array<{ date: string; amount: number }>;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of transaction descriptions
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Normalize transaction description for grouping
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\d+/g, "") // Remove numbers
    .replace(/[^\w\s]/g, "") // Remove special chars
    .trim();
}

/**
 * Group similar transactions using fuzzy matching
 */
function groupSimilarTransactions(
  transactions: TTransaction[],
): Map<string, TTransaction[]> {
  const groups = new Map<string, TTransaction[]>();
  const processed = new Set<string>();

  for (const transaction of transactions) {
    if (processed.has(transaction.id)) continue;

    const normalized = normalizeDescription(transaction.description);
    let foundGroup = false;

    // Try to find existing similar group
    for (const [groupKey, groupTransactions] of groups.entries()) {
      const similarity = calculateSimilarity(normalized, groupKey);

      // If similarity > 80%, add to this group
      if (similarity > 80) {
        groupTransactions.push(transaction);
        processed.add(transaction.id);
        foundGroup = true;
        break;
      }
    }

    // Create new group if no match found
    if (!foundGroup) {
      groups.set(normalized, [transaction]);
      processed.add(transaction.id);
    }
  }

  return groups;
}

/**
 * Detect recurring transactions from transaction list
 * Uses pattern recognition to identify subscriptions and fixed expenses
 */
export function detectRecurringTransactions(
  transactions: TTransaction[],
): RecurringTransaction[] {
  // Group by similar descriptions
  const groups = groupSimilarTransactions(transactions);
  const recurring: RecurringTransaction[] = [];

  for (const [description, items] of groups) {
    // Need at least 3 occurrences to detect pattern
    if (items.length < 3) continue;

    // Sort by date
    const sorted = items.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate intervals between occurrences
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.floor(
        (new Date(sorted[i].date).getTime() -
          new Date(sorted[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      intervals.push(days);
    }

    // Calculate average interval and variance
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // Determine frequency and confidence
    let frequency: RecurringFrequency;
    let confidence = 0;

    // Weekly pattern (7 days ± 2 days)
    if (Math.abs(avgInterval - 7) < 2) {
      frequency = "weekly";
      confidence = Math.max(0, 100 - (stdDev / avgInterval) * 100);
    }
    // Monthly pattern (30 days ± 5 days)
    else if (Math.abs(avgInterval - 30) < 5) {
      frequency = "monthly";
      confidence = Math.max(0, 100 - (stdDev / avgInterval) * 100);
    }
    // Yearly pattern (365 days ± 15 days)
    else if (Math.abs(avgInterval - 365) < 15) {
      frequency = "yearly";
      confidence = Math.max(0, 100 - (stdDev / avgInterval) * 100);
    } else {
      // Not a clear pattern
      continue;
    }

    // Only include high-confidence patterns (>60%)
    if (confidence < 60) continue;

    // Calculate average amount
    const averageAmount =
      items.reduce((sum, t) => sum + Number(t.amount), 0) / items.length;

    // Predict next occurrence
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextExpectedDate = new Date(lastDate);
    nextExpectedDate.setDate(lastDate.getDate() + Math.round(avgInterval));

    recurring.push({
      description: items[0].description, // Use original description
      category: items[0].category,
      averageAmount,
      frequency,
      confidence: Math.round(confidence),
      nextExpectedDate: nextExpectedDate.toISOString(),
      occurrences: items.map((t) => ({
        date: t.date,
        amount: Number(t.amount),
      })),
    });
  }

  // Sort by average amount (highest first)
  return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
}

/**
 * Calculate total monthly cost of recurring transactions
 */
export function calculateRecurringMonthlyCost(
  recurring: RecurringTransaction[],
): number {
  return recurring.reduce((total, r) => {
    let monthlyCost = 0;

    switch (r.frequency) {
      case "weekly":
        monthlyCost = r.averageAmount * 4.33; // Average weeks per month
        break;
      case "monthly":
        monthlyCost = r.averageAmount;
        break;
      case "yearly":
        monthlyCost = r.averageAmount / 12;
        break;
    }

    return total + monthlyCost;
  }, 0);
}
