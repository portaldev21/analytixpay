import type { SupabaseClient } from "@supabase/supabase-js";
import type { TTransaction, TPlanScenarioItem } from "@/db/types";
import { detectRecurringTransactions } from "@/lib/analytics/recurring";
import { calculateTransactionStats } from "@/lib/analytics/stats";
import { logger } from "@/lib/logger";

/**
 * Build initial scenario items from real transaction data.
 *
 * Uses 3 sources:
 *  1. Recurring transactions (monthly, confidence >= 60%) -> fixed expenses
 *  2. Category spending averages (last 3 months) -> variable expenses
 *  3. Active installments (parcelas) -> temporary fixed expenses with end_month
 */
export async function buildInitialScenarioItems(
  supabase: SupabaseClient,
  accountId: string,
): Promise<Omit<TPlanScenarioItem, "id" | "scenario_id" | "created_at">[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDate = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch recent transactions (last 6 months)
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("account_id", accountId)
    .gte("date", startDate)
    .order("date", { ascending: true });

  if (error || !transactions?.length) {
    logger.warn("No transactions found for auto-detection", { accountId });
    return [];
  }

  const typedTransactions = transactions as TTransaction[];
  const items: Omit<TPlanScenarioItem, "id" | "scenario_id" | "created_at">[] =
    [];

  // -------------------------------------------------------
  // 1. Recurring transactions -> fixed expenses
  // -------------------------------------------------------
  const recurring = detectRecurringTransactions(typedTransactions);
  for (const r of recurring) {
    // RecurringTransaction.confidence is 0-100 (percentage)
    if (r.frequency === "monthly" && r.confidence >= 60) {
      items.push({
        category: r.category || "Outros",
        expense_type: "fixed",
        name: r.description,
        amount: Math.round(r.averageAmount * 100) / 100,
        end_month: null,
        auto_detected: true,
      });
    }
  }

  // -------------------------------------------------------
  // 2. Category averages (last 3 months) -> variable expenses
  // -------------------------------------------------------
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentTransactions = typedTransactions.filter(
    (t) => new Date(t.date) >= threeMonthsAgo,
  );
  const stats = calculateTransactionStats(recentTransactions);

  for (const cat of stats.categoryBreakdown) {
    // Subtract recurring total already accounted for in this category
    const recurringTotal = items
      .filter((i) => i.category === cat.category)
      .reduce((sum, i) => sum + i.amount, 0);
    const monthlyAvg = Math.round((cat.total / 3) * 100) / 100;
    const variableAmount = Math.max(0, monthlyAvg - recurringTotal);

    // Only include categories with meaningful variable spending (> R$50)
    if (variableAmount > 50) {
      items.push({
        category: cat.category,
        expense_type: "variable",
        name: `${cat.category} (media)`,
        amount: variableAmount,
        end_month: null,
        auto_detected: true,
      });
    }
  }

  // -------------------------------------------------------
  // 3. Active installments -> temporary fixed expenses
  // -------------------------------------------------------
  for (const t of typedTransactions) {
    if (!t.installment) continue;
    const match = t.installment.match(/(\d+)\/(\d+)/);
    if (!match) continue;

    const current = Number.parseInt(match[1], 10);
    const total = Number.parseInt(match[2], 10);
    if (current >= total) continue;

    const remaining = total - current;
    const key = t.description.toLowerCase().trim();
    if (items.some((i) => i.name.toLowerCase() === key)) continue;

    items.push({
      category: t.category,
      expense_type: "fixed",
      name: t.description,
      amount: t.amount,
      end_month: remaining - 1,
      auto_detected: true,
    });
  }

  logger.info("Auto-detection complete", {
    accountId,
    fixedCount: items.filter((i) => i.expense_type === "fixed").length,
    variableCount: items.filter((i) => i.expense_type === "variable").length,
  });

  return items;
}
