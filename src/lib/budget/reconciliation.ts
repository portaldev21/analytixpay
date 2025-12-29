/**
 * Budget Expense Reconciliation
 *
 * Matches manual budget expenses with invoice transactions to verify accuracy.
 * Uses fuzzy matching on amount, date, and description.
 */

import type { TBudgetExpense, TTransaction } from "@/db/types";

export type TMatchReason =
  | "exact_amount"
  | "similar_amount"
  | "same_date"
  | "close_date"
  | "similar_description"
  | "same_category";

export type TReconciliationMatch = {
  transaction: TTransaction;
  confidence: number;
  reasons: TMatchReason[];
};

export type TReconciliationResult = {
  expense: TBudgetExpense;
  matches: TReconciliationMatch[];
  best_match: TReconciliationMatch | null;
};

// Match confidence weights
const WEIGHTS = {
  exact_amount: 0.4,
  similar_amount: 0.2,
  same_date: 0.3,
  close_date: 0.15,
  similar_description: 0.2,
  same_category: 0.1,
};

// Thresholds
const AMOUNT_EXACT_THRESHOLD = 0.001; // 0.1% difference
const AMOUNT_SIMILAR_THRESHOLD = 0.05; // 5% difference
const DATE_CLOSE_DAYS = 3;
const DESCRIPTION_SIMILARITY_THRESHOLD = 0.3;

/**
 * Calculate the confidence score for a potential match between expense and transaction
 */
export function calculateMatchConfidence(
  expense: TBudgetExpense,
  transaction: TTransaction,
): { confidence: number; reasons: TMatchReason[] } {
  const reasons: TMatchReason[] = [];
  let confidence = 0;

  // Amount matching
  const amountDiff =
    Math.abs(expense.amount - transaction.amount) / expense.amount;

  if (amountDiff <= AMOUNT_EXACT_THRESHOLD) {
    confidence += WEIGHTS.exact_amount;
    reasons.push("exact_amount");
  } else if (amountDiff <= AMOUNT_SIMILAR_THRESHOLD) {
    confidence += WEIGHTS.similar_amount;
    reasons.push("similar_amount");
  }

  // Date matching
  const expenseDate = new Date(expense.expense_date);
  const transactionDate = new Date(transaction.date);
  const daysDiff = Math.abs(
    Math.floor(
      (expenseDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  if (daysDiff === 0) {
    confidence += WEIGHTS.same_date;
    reasons.push("same_date");
  } else if (daysDiff <= DATE_CLOSE_DAYS) {
    confidence += WEIGHTS.close_date;
    reasons.push("close_date");
  }

  // Description similarity (simple word overlap)
  if (expense.description && transaction.description) {
    const similarity = calculateTextSimilarity(
      expense.description,
      transaction.description,
    );
    if (similarity >= DESCRIPTION_SIMILARITY_THRESHOLD) {
      confidence += WEIGHTS.similar_description;
      reasons.push("similar_description");
    }
  }

  // Category matching
  if (
    expense.category &&
    transaction.category &&
    normalizeCategory(expense.category) === normalizeCategory(transaction.category)
  ) {
    confidence += WEIGHTS.same_category;
    reasons.push("same_category");
  }

  return { confidence: Math.min(confidence, 1), reasons };
}

/**
 * Find potential transaction matches for a budget expense
 */
export function findPotentialMatches(
  expense: TBudgetExpense,
  transactions: TTransaction[],
  minConfidence = 0.3,
): TReconciliationMatch[] {
  const matches: TReconciliationMatch[] = [];

  for (const transaction of transactions) {
    const { confidence, reasons } = calculateMatchConfidence(expense, transaction);

    if (confidence >= minConfidence) {
      matches.push({
        transaction,
        confidence,
        reasons,
      });
    }
  }

  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find reconciliation suggestions for multiple expenses
 */
export function findReconciliationSuggestions(
  expenses: TBudgetExpense[],
  transactions: TTransaction[],
  minConfidence = 0.3,
): TReconciliationResult[] {
  const results: TReconciliationResult[] = [];

  // Filter expenses that need reconciliation
  const pendingExpenses = expenses.filter(
    (e) => e.reconciliation_status === "pending",
  );

  // Filter transactions that haven't been matched yet
  const matchedTransactionIds = new Set(
    expenses
      .filter((e) => e.reconciled_transaction_id)
      .map((e) => e.reconciled_transaction_id),
  );

  const availableTransactions = transactions.filter(
    (t) => !matchedTransactionIds.has(t.id),
  );

  for (const expense of pendingExpenses) {
    // Filter transactions to a reasonable date range for this expense
    const expenseDate = new Date(expense.expense_date);
    const minDate = new Date(expenseDate);
    minDate.setDate(minDate.getDate() - DATE_CLOSE_DAYS);
    const maxDate = new Date(expenseDate);
    maxDate.setDate(maxDate.getDate() + DATE_CLOSE_DAYS);

    const nearbyTransactions = availableTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= minDate && tDate <= maxDate;
    });

    const matches = findPotentialMatches(expense, nearbyTransactions, minConfidence);

    results.push({
      expense,
      matches,
      best_match: matches.length > 0 ? matches[0] : null,
    });
  }

  // Sort by confidence of best match (highest first)
  return results.sort((a, b) => {
    const aConf = a.best_match?.confidence ?? 0;
    const bConf = b.best_match?.confidence ?? 0;
    return bConf - aConf;
  });
}

/**
 * Calculate text similarity using word overlap (Jaccard similarity)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = normalizeText(text1).split(/\s+/).filter(Boolean);
  const words2 = normalizeText(text2).split(/\s+/).filter(Boolean);

  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((word) => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .trim();
}

/**
 * Normalize category for comparison
 */
function normalizeCategory(category: string): string {
  return normalizeText(category);
}

/**
 * Get a human-readable explanation for a match
 */
export function getMatchExplanation(match: TReconciliationMatch): string {
  const explanations: string[] = [];

  for (const reason of match.reasons) {
    switch (reason) {
      case "exact_amount":
        explanations.push("Valor exato");
        break;
      case "similar_amount":
        explanations.push("Valor similar (±5%)");
        break;
      case "same_date":
        explanations.push("Mesma data");
        break;
      case "close_date":
        explanations.push("Data proxima (±3 dias)");
        break;
      case "similar_description":
        explanations.push("Descricao similar");
        break;
      case "same_category":
        explanations.push("Mesma categoria");
        break;
    }
  }

  return explanations.join(", ");
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(
  confidence: number,
): "high" | "medium" | "low" {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
