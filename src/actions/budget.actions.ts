"use server";

import { revalidatePath } from "next/cache";
import {
  createClient,
  requireAccountAccess,
  requireAccountOwnership,
  hasAccessToAccount,
} from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to get untyped supabase client for new tables
// This is needed because the Database type hasn't been regenerated from Supabase
// biome-ignore lint/suspicious/noExplicitAny: Temporary until types are regenerated
function getUntypedClient(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<any>;
}
import {
  calculateAvailableBudget,
  calculateDailyBalance,
  calculateRemainingDays,
  getBudgetStatus,
  formatDateToString,
  getToday,
  validateDailyBase,
  validateExpenseAmount,
} from "@/lib/budget/calculations";
import {
  ensureActiveCycle,
  getOrCreateDailyRecord,
  updateDailyRecordSpent,
  recalculateCycleAccumulatedBalance,
  getDailyRecordsForCycle,
  getTotalExpensesForRecord,
} from "@/lib/budget/cycle";
import type {
  TApiResponse,
  TBudgetConfig,
  TBudgetConfigInsert,
  TBudgetExpense,
  TBudgetExpenseInsert,
  TDailyRecord,
  TTodayBudgetResponse,
  TWeekCycle,
  TWeekSummary,
  TCarryOverMode,
} from "@/db/types";

// =============================================================================
// CONFIGURATION ACTIONS
// =============================================================================

/**
 * Create or update budget configuration (owner only)
 */
export async function upsertBudgetConfig(
  accountId: string,
  data: {
    daily_base: number;
    week_start_day?: number;
    carry_over_mode?: TCarryOverMode;
  },
): Promise<TApiResponse<TBudgetConfig>> {
  try {
    const { supabase } = await requireAccountOwnership(accountId);
    const db = getUntypedClient(supabase);

    // Validate input
    validateDailyBase(data.daily_base);

    // Check if there's an existing active config
    const { data: existingConfig } = await db
      .from("budget_configs")
      .select("id")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    let result: TBudgetConfig;

    if (existingConfig) {
      // Update existing config
      const updateData = {
        daily_base: data.daily_base,
        week_start_day: data.week_start_day ?? 1,
        carry_over_mode: data.carry_over_mode ?? "carry_deficit",
      };

      const { data: updated, error } = await db
        .from("budget_configs")
        .update(updateData)
        .eq("id", existingConfig.id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating budget config", error);
        return { data: null, error: error.message, success: false };
      }

      result = updated as TBudgetConfig;
      logger.info("Budget config updated", { accountId, configId: result.id });
    } else {
      // Create new config
      const configData: TBudgetConfigInsert = {
        account_id: accountId,
        daily_base: data.daily_base,
        week_start_day: data.week_start_day ?? 1,
        carry_over_mode: data.carry_over_mode ?? "carry_deficit",
        is_active: true,
      };

      const { data: created, error } = await db
        .from("budget_configs")
        .insert(configData)
        .select()
        .single();

      if (error) {
        logger.error("Error creating budget config", error);
        return { data: null, error: error.message, success: false };
      }

      result = created as TBudgetConfig;
      logger.info("Budget config created", { accountId, configId: result.id });
    }

    revalidatePath("/budget");
    revalidatePath("/settings");

    return { data: result, error: null, success: true };
  } catch (error) {
    logger.error("Error in upsertBudgetConfig", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar configuracao de orcamento",
      success: false,
    };
  }
}

/**
 * Get active budget config for account
 */
export async function getActiveBudgetConfig(
  accountId: string,
): Promise<TApiResponse<TBudgetConfig | null>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data, error } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    if (error) {
      // No config found is not an error
      if (error.code === "PGRST116") {
        return { data: null, error: null, success: true };
      }
      return { data: null, error: error.message, success: false };
    }

    return { data: data as TBudgetConfig, error: null, success: true };
  } catch (error) {
    logger.error("Error in getActiveBudgetConfig", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar configuracao de orcamento",
      success: false,
    };
  }
}

// =============================================================================
// DAILY BUDGET ACTIONS
// =============================================================================

/**
 * Get today's budget (creates cycle/record if needed)
 */
export async function getTodayBudget(
  accountId: string,
): Promise<TApiResponse<TTodayBudgetResponse>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Get active config
    const { data: config } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    if (!config) {
      return {
        data: null,
        error: "Configuracao de orcamento nao encontrada",
        success: false,
      };
    }

    const budgetConfig = config as TBudgetConfig;
    const today = getToday();
    const todayStr = formatDateToString(today);

    // Ensure we have an active cycle
    const cycle = await ensureActiveCycle(supabase, accountId, budgetConfig);

    // Get or create daily record
    const dailyRecord = await getOrCreateDailyRecord(
      supabase,
      accountId,
      cycle,
      budgetConfig,
      today,
    );

    // Get actual spending from invoice transactions for the period
    const cycleStartStr = cycle.start_date;
    const cycleEndStr = cycle.end_date;

    const { data: invoiceTransactions } = await db
      .from("transactions")
      .select("amount")
      .eq("account_id", accountId)
      .gte("date", cycleStartStr)
      .lte("date", cycleEndStr);

    const actualFromInvoices = (invoiceTransactions || []).reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Get manual expenses for today
    const { data: todayExpenses } = await db
      .from("budget_expenses")
      .select("amount")
      .eq("daily_record_id", dailyRecord.id);

    const manualExpenses = (todayExpenses || []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    // Calculate remaining days
    const cycleEndDate = new Date(cycle.end_date);
    const remainingDays = calculateRemainingDays(today, cycleEndDate);

    const response: TTodayBudgetResponse = {
      date: todayStr,
      available_budget: dailyRecord.available_budget,
      base_budget: dailyRecord.base_budget,
      adjustment: dailyRecord.available_budget - dailyRecord.base_budget,
      total_spent_today: dailyRecord.total_spent,
      remaining_today: dailyRecord.available_budget - dailyRecord.total_spent,
      actual_from_invoices: Math.round(actualFromInvoices * 100) / 100,
      manual_expenses: Math.round(manualExpenses * 100) / 100,
      cycle_info: {
        id: cycle.id,
        days_remaining: remainingDays,
        accumulated_balance: cycle.accumulated_balance,
        week_start: cycle.start_date,
        week_end: cycle.end_date,
      },
      status: getBudgetStatus(
        dailyRecord.available_budget,
        budgetConfig.daily_base,
      ),
    };

    return { data: response, error: null, success: true };
  } catch (error) {
    logger.error("Error in getTodayBudget", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar orcamento de hoje",
      success: false,
    };
  }
}

// =============================================================================
// EXPENSE ACTIONS
// =============================================================================

/**
 * Add manual expense
 */
export async function addBudgetExpense(
  accountId: string,
  data: {
    amount: number;
    category?: string;
    description?: string;
    date?: string;
    time?: string;
  },
): Promise<
  TApiResponse<{ expense: TBudgetExpense; updated_budget: TTodayBudgetResponse }>
> {
  try {
    const { user, supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Validate amount
    validateExpenseAmount(data.amount);

    // Determine expense date
    const expenseDate = data.date ? new Date(data.date) : getToday();
    const expenseDateStr = formatDateToString(expenseDate);

    // Get active config
    const { data: config } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    if (!config) {
      return {
        data: null,
        error: "Configuracao de orcamento nao encontrada",
        success: false,
      };
    }

    const budgetConfig = config as TBudgetConfig;

    // Ensure we have an active cycle
    const cycle = await ensureActiveCycle(supabase, accountId, budgetConfig);

    // Get or create daily record for the expense date
    const dailyRecord = await getOrCreateDailyRecord(
      supabase,
      accountId,
      cycle,
      budgetConfig,
      expenseDate,
    );

    // Create the expense
    const expenseData: TBudgetExpenseInsert = {
      account_id: accountId,
      daily_record_id: dailyRecord.id,
      user_id: user.id,
      amount: data.amount,
      category: data.category || "Outros",
      description: data.description || null,
      expense_date: expenseDateStr,
      expense_time: data.time || null,
      reconciliation_status: "pending",
    };

    const { data: expense, error: expenseError } = await db
      .from("budget_expenses")
      .insert(expenseData)
      .select()
      .single();

    if (expenseError) {
      logger.error("Error creating expense", expenseError);
      return { data: null, error: expenseError.message, success: false };
    }

    // Update daily record's total_spent
    const newTotalSpent = await getTotalExpensesForRecord(
      supabase,
      dailyRecord.id,
    );
    await updateDailyRecordSpent(supabase, dailyRecord.id, newTotalSpent);

    // Recalculate cycle balance
    await recalculateCycleAccumulatedBalance(supabase, cycle.id);

    // Get updated budget info
    const updatedBudgetResult = await getTodayBudget(accountId);

    if (!updatedBudgetResult.success || !updatedBudgetResult.data) {
      return {
        data: null,
        error: "Erro ao atualizar orcamento",
        success: false,
      };
    }

    logger.info("Budget expense added", {
      accountId,
      expenseId: expense.id,
      amount: data.amount,
    });

    revalidatePath("/budget");

    return {
      data: {
        expense: expense as TBudgetExpense,
        updated_budget: updatedBudgetResult.data,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Error in addBudgetExpense", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao adicionar gasto",
      success: false,
    };
  }
}

/**
 * Update expense
 */
export async function updateBudgetExpense(
  accountId: string,
  expenseId: string,
  data: {
    amount?: number;
    category?: string;
    description?: string;
  },
): Promise<TApiResponse<TBudgetExpense>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    if (data.amount !== undefined) {
      validateExpenseAmount(data.amount);
    }

    // Get current expense to find the daily record
    const { data: currentExpense } = await db
      .from("budget_expenses")
      .select("daily_record_id")
      .eq("id", expenseId)
      .eq("account_id", accountId)
      .single();

    if (!currentExpense) {
      return { data: null, error: "Gasto nao encontrado", success: false };
    }

    // Update the expense
    const { data: updated, error } = await db
      .from("budget_expenses")
      .update({
        amount: data.amount,
        category: data.category,
        description: data.description,
      })
      .eq("id", expenseId)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    // Update daily record's total_spent
    const newTotalSpent = await getTotalExpensesForRecord(
      supabase,
      currentExpense.daily_record_id,
    );
    await updateDailyRecordSpent(
      supabase,
      currentExpense.daily_record_id,
      newTotalSpent,
    );

    // Get cycle ID and recalculate balance
    const { data: dailyRecord } = await db
      .from("daily_records")
      .select("cycle_id")
      .eq("id", currentExpense.daily_record_id)
      .single();

    if (dailyRecord) {
      await recalculateCycleAccumulatedBalance(supabase, dailyRecord.cycle_id);
    }

    logger.info("Budget expense updated", { accountId, expenseId });
    revalidatePath("/budget");

    return { data: updated as TBudgetExpense, error: null, success: true };
  } catch (error) {
    logger.error("Error in updateBudgetExpense", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao atualizar gasto",
      success: false,
    };
  }
}

/**
 * Delete expense
 */
export async function deleteBudgetExpense(
  accountId: string,
  expenseId: string,
): Promise<TApiResponse<{ success: true }>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Get expense info before deleting
    const { data: expense } = await db
      .from("budget_expenses")
      .select("daily_record_id")
      .eq("id", expenseId)
      .eq("account_id", accountId)
      .single();

    if (!expense) {
      return { data: null, error: "Gasto nao encontrado", success: false };
    }

    // Delete the expense
    const { error } = await db
      .from("budget_expenses")
      .delete()
      .eq("id", expenseId)
      .eq("account_id", accountId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    // Update daily record's total_spent
    const newTotalSpent = await getTotalExpensesForRecord(
      supabase,
      expense.daily_record_id,
    );
    await updateDailyRecordSpent(supabase, expense.daily_record_id, newTotalSpent);

    // Get cycle ID and recalculate balance
    const { data: dailyRecord } = await db
      .from("daily_records")
      .select("cycle_id")
      .eq("id", expense.daily_record_id)
      .single();

    if (dailyRecord) {
      await recalculateCycleAccumulatedBalance(supabase, dailyRecord.cycle_id);
    }

    logger.info("Budget expense deleted", { accountId, expenseId });
    revalidatePath("/budget");

    return { data: { success: true }, error: null, success: true };
  } catch (error) {
    logger.error("Error in deleteBudgetExpense", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao excluir gasto",
      success: false,
    };
  }
}

/**
 * Get expenses for a specific date
 */
export async function getExpensesForDate(
  accountId: string,
  date: string,
): Promise<TApiResponse<TBudgetExpense[]>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data, error } = await db
      .from("budget_expenses")
      .select("*")
      .eq("account_id", accountId)
      .eq("expense_date", date)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    return { data: (data || []) as TBudgetExpense[], error: null, success: true };
  } catch (error) {
    logger.error("Error in getExpensesForDate", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar gastos",
      success: false,
    };
  }
}

// =============================================================================
// CYCLE ACTIONS
// =============================================================================

/**
 * Get current week cycle
 */
export async function getCurrentCycle(
  accountId: string,
): Promise<TApiResponse<TWeekCycle>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Get active config
    const { data: config } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    if (!config) {
      return {
        data: null,
        error: "Configuracao de orcamento nao encontrada",
        success: false,
      };
    }

    const cycle = await ensureActiveCycle(
      supabase,
      accountId,
      config as TBudgetConfig,
    );

    return { data: cycle, error: null, success: true };
  } catch (error) {
    logger.error("Error in getCurrentCycle", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar ciclo atual",
      success: false,
    };
  }
}

/**
 * Get week summary
 */
export async function getWeekSummary(
  accountId: string,
): Promise<TApiResponse<TWeekSummary>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Get active config
    const { data: config } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    if (!config) {
      return {
        data: null,
        error: "Configuracao de orcamento nao encontrada",
        success: false,
      };
    }

    const budgetConfig = config as TBudgetConfig;

    // Get active cycle
    const cycle = await ensureActiveCycle(supabase, accountId, budgetConfig);

    // Get all daily records for the cycle
    const dailyRecords = await getDailyRecordsForCycle(supabase, cycle.id);

    // Calculate stats
    const totalSpent = dailyRecords.reduce(
      (sum, r) => sum + Number(r.total_spent),
      0,
    );
    const totalBudget = cycle.initial_budget;
    const totalSaved = totalBudget - totalSpent;
    const daysWithRecords = dailyRecords.length || 1;
    const averageDailySpent = totalSpent / daysWithRecords;

    const daysOverBudget = dailyRecords.filter(
      (r) => r.total_spent > r.available_budget,
    ).length;
    const daysUnderBudget = dailyRecords.filter(
      (r) => r.total_spent < r.available_budget,
    ).length;

    // Get manual expenses total
    const { data: manualExpenses } = await db
      .from("budget_expenses")
      .select("amount")
      .eq("account_id", accountId)
      .gte("expense_date", cycle.start_date)
      .lte("expense_date", cycle.end_date);

    const manualTotal = (manualExpenses || []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    // Get invoice transactions total for comparison
    const { data: invoiceTransactions } = await db
      .from("transactions")
      .select("amount")
      .eq("account_id", accountId)
      .gte("date", cycle.start_date)
      .lte("date", cycle.end_date);

    const invoiceTotal = (invoiceTransactions || []).reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    const summary: TWeekSummary = {
      cycle,
      daily_records: dailyRecords,
      total_budget: totalBudget,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_saved: Math.round(totalSaved * 100) / 100,
      average_daily_spent: Math.round(averageDailySpent * 100) / 100,
      days_over_budget: daysOverBudget,
      days_under_budget: daysUnderBudget,
      comparison_with_actual: {
        manual_total: Math.round(manualTotal * 100) / 100,
        invoice_total: Math.round(invoiceTotal * 100) / 100,
        difference: Math.round((manualTotal - invoiceTotal) * 100) / 100,
      },
    };

    return { data: summary, error: null, success: true };
  } catch (error) {
    logger.error("Error in getWeekSummary", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar resumo semanal",
      success: false,
    };
  }
}

/**
 * Get budget vs actual comparison for period
 */
export async function getBudgetVsActual(
  accountId: string,
  period?: { startDate: string; endDate: string },
): Promise<
  TApiResponse<{
    budget_spent: number;
    actual_from_invoices: number;
    difference: number;
    by_category: {
      category: string;
      budget: number;
      actual: number;
      diff: number;
    }[];
  }>
> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Default to current month if no period specified
    const today = getToday();
    const startDate =
      period?.startDate ||
      formatDateToString(new Date(today.getFullYear(), today.getMonth(), 1));
    const endDate = period?.endDate || formatDateToString(today);

    // Get manual expenses by category
    const { data: manualExpenses } = await db
      .from("budget_expenses")
      .select("amount, category")
      .eq("account_id", accountId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    // Get invoice transactions by category
    const { data: invoiceTransactions } = await db
      .from("transactions")
      .select("amount, category")
      .eq("account_id", accountId)
      .gte("date", startDate)
      .lte("date", endDate);

    // Calculate totals
    const budgetSpent = (manualExpenses || []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const actualFromInvoices = (invoiceTransactions || []).reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    // Group by category
    const categoryMap = new Map<
      string,
      { budget: number; actual: number }
    >();

    for (const expense of manualExpenses || []) {
      const cat = expense.category || "Outros";
      const existing = categoryMap.get(cat) || { budget: 0, actual: 0 };
      existing.budget += Number(expense.amount);
      categoryMap.set(cat, existing);
    }

    for (const transaction of invoiceTransactions || []) {
      const cat = transaction.category || "Outros";
      const existing = categoryMap.get(cat) || { budget: 0, actual: 0 };
      existing.actual += Number(transaction.amount);
      categoryMap.set(cat, existing);
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, values]) => ({
        category,
        budget: Math.round(values.budget * 100) / 100,
        actual: Math.round(values.actual * 100) / 100,
        diff: Math.round((values.budget - values.actual) * 100) / 100,
      }))
      .sort((a, b) => b.actual - a.actual);

    return {
      data: {
        budget_spent: Math.round(budgetSpent * 100) / 100,
        actual_from_invoices: Math.round(actualFromInvoices * 100) / 100,
        difference: Math.round((budgetSpent - actualFromInvoices) * 100) / 100,
        by_category: byCategory,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Error in getBudgetVsActual", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao comparar orcamento vs real",
      success: false,
    };
  }
}

// =============================================================================
// RECONCILIATION ACTIONS
// =============================================================================

import {
  findReconciliationSuggestions,
  type TReconciliationResult,
} from "@/lib/budget/reconciliation";
import type { TTransaction } from "@/db/types";

/**
 * Get reconciliation suggestions for pending expenses
 */
export async function getReconciliationSuggestions(
  accountId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    minConfidence?: number;
  },
): Promise<TApiResponse<TReconciliationResult[]>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Default to last 30 days if no date range specified
    const today = getToday();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startDate = options?.startDate || formatDateToString(thirtyDaysAgo);
    const endDate = options?.endDate || formatDateToString(today);

    // Get pending expenses in date range
    const { data: expenses, error: expensesError } = await db
      .from("budget_expenses")
      .select("*")
      .eq("account_id", accountId)
      .eq("reconciliation_status", "pending")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .order("expense_date", { ascending: false });

    if (expensesError) {
      return { data: null, error: expensesError.message, success: false };
    }

    // Get transactions in a slightly wider date range (for close date matching)
    const extendedStart = new Date(startDate);
    extendedStart.setDate(extendedStart.getDate() - 5);
    const extendedEnd = new Date(endDate);
    extendedEnd.setDate(extendedEnd.getDate() + 5);

    const { data: transactions, error: transactionsError } = await db
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .gte("date", formatDateToString(extendedStart))
      .lte("date", formatDateToString(extendedEnd))
      .order("date", { ascending: false });

    if (transactionsError) {
      return { data: null, error: transactionsError.message, success: false };
    }

    // Find reconciliation suggestions
    const suggestions = findReconciliationSuggestions(
      expenses as TBudgetExpense[],
      transactions as TTransaction[],
      options?.minConfidence,
    );

    return { data: suggestions, error: null, success: true };
  } catch (error) {
    logger.error("Error in getReconciliationSuggestions", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar sugestoes de reconciliacao",
      success: false,
    };
  }
}

/**
 * Approve a reconciliation match
 */
export async function approveReconciliation(
  accountId: string,
  expenseId: string,
  transactionId: string,
): Promise<TApiResponse<TBudgetExpense>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify the expense belongs to this account
    const { data: expense, error: expenseError } = await db
      .from("budget_expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("account_id", accountId)
      .single();

    if (expenseError || !expense) {
      return { data: null, error: "Gasto nao encontrado", success: false };
    }

    // Verify the transaction belongs to this account
    const { data: transaction, error: transactionError } = await db
      .from("transactions")
      .select("id")
      .eq("id", transactionId)
      .eq("account_id", accountId)
      .single();

    if (transactionError || !transaction) {
      return { data: null, error: "Transacao nao encontrada", success: false };
    }

    // Update the expense with the reconciliation
    const { data: updated, error: updateError } = await db
      .from("budget_expenses")
      .update({
        reconciled_transaction_id: transactionId,
        reconciliation_status: "matched",
      })
      .eq("id", expenseId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message, success: false };
    }

    logger.info("Reconciliation approved", {
      accountId,
      expenseId,
      transactionId,
    });
    revalidatePath("/budget");
    revalidatePath("/budget/reconcile");

    return { data: updated as TBudgetExpense, error: null, success: true };
  } catch (error) {
    logger.error("Error in approveReconciliation", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao aprovar reconciliacao",
      success: false,
    };
  }
}

/**
 * Mark an expense as unmatched (no corresponding transaction found)
 */
export async function markExpenseUnmatched(
  accountId: string,
  expenseId: string,
): Promise<TApiResponse<TBudgetExpense>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    const { data: updated, error } = await db
      .from("budget_expenses")
      .update({
        reconciliation_status: "unmatched",
        reconciled_transaction_id: null,
      })
      .eq("id", expenseId)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    if (!updated) {
      return { data: null, error: "Gasto nao encontrado", success: false };
    }

    logger.info("Expense marked as unmatched", { accountId, expenseId });
    revalidatePath("/budget");
    revalidatePath("/budget/reconcile");

    return { data: updated as TBudgetExpense, error: null, success: true };
  } catch (error) {
    logger.error("Error in markExpenseUnmatched", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao marcar como nao reconciliado",
      success: false,
    };
  }
}

/**
 * Get reconciliation statistics
 */
export async function getReconciliationStats(
  accountId: string,
): Promise<
  TApiResponse<{
    total_expenses: number;
    pending: number;
    matched: number;
    unmatched: number;
    manual: number;
    match_rate: number;
  }>
> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Get counts by status
    const { data: expenses, error } = await db
      .from("budget_expenses")
      .select("reconciliation_status")
      .eq("account_id", accountId);

    if (error) {
      return { data: null, error: error.message, success: false };
    }

    const counts = {
      pending: 0,
      matched: 0,
      unmatched: 0,
      manual: 0,
    };

    for (const expense of expenses || []) {
      const status = expense.reconciliation_status as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }
    }

    const total = expenses?.length || 0;
    const matchRate =
      total > 0 ? (counts.matched / (total - counts.pending)) * 100 : 0;

    return {
      data: {
        total_expenses: total,
        ...counts,
        match_rate: Math.round(matchRate * 10) / 10,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Error in getReconciliationStats", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar estatisticas de reconciliacao",
      success: false,
    };
  }
}

// =============================================================================
// BUDGET FORECAST ACTIONS
// =============================================================================

import type {
  TBudgetForecast,
  TInstallmentProjection,
  TMonthlyProjection,
  TCalendarEvent,
  TBudgetImpact,
} from "@/db/types";

/**
 * Get budget forecast with installments projection and budget impact
 */
export async function getBudgetForecast(
  accountId: string,
  months: number = 6,
): Promise<TApiResponse<TBudgetForecast>> {
  try {
    const supabase = await createClient();
    const db = getUntypedClient(supabase);

    if (!(await hasAccessToAccount(accountId))) {
      return { data: null, error: "Acesso negado", success: false };
    }

    // Get active budget config
    const { data: config } = await db
      .from("budget_configs")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .single();

    const budgetConfig = config as TBudgetConfig | null;

    // Get transactions with installments
    const { data: transactions, error: transactionsError } = await db
      .from("transactions")
      .select("description, amount, installment, date")
      .eq("account_id", accountId)
      .not("installment", "is", null)
      .order("date", { ascending: false });

    if (transactionsError) {
      logger.error("Error fetching transactions", transactionsError);
      return { data: null, error: transactionsError.message, success: false };
    }

    // Parse installments and group by description (same logic as getInstallmentsProjection)
    const installmentMap = new Map<
      string,
      {
        amount: number;
        current: number;
        total: number;
        date: string;
        description: string;
      }
    >();

    const typedTransactions = transactions as {
      description: string;
      amount: number;
      installment: string | null;
      date: string;
    }[];

    for (const t of typedTransactions || []) {
      if (!t.installment) continue;

      // Parse installment format: "1/12", "3/6", etc.
      const match = t.installment.match(/(\d+)\/(\d+)/);
      if (!match) continue;

      const current = Number.parseInt(match[1], 10);
      const total = Number.parseInt(match[2], 10);

      // Get latest installment for each description
      const key = t.description.toLowerCase().trim();
      const existing = installmentMap.get(key);

      if (!existing || current > existing.current) {
        installmentMap.set(key, {
          amount: Number(t.amount),
          current,
          total,
          date: t.date,
          description: t.description,
        });
      }
    }

    // Build active installments projection
    const activeInstallments: TInstallmentProjection[] = [];

    for (const [_, data] of installmentMap.entries()) {
      // Only include if there are remaining installments
      if (data.current >= data.total) continue;

      const remaining = data.total - data.current;
      const nextMonth = new Date(data.date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      activeInstallments.push({
        description:
          data.description.charAt(0).toUpperCase() +
          data.description.slice(1).toLowerCase(),
        current_installment: data.current,
        total_installments: data.total,
        amount: data.amount,
        next_date: nextMonth.toISOString().split("T")[0],
        remaining_amount: data.amount * remaining,
        remaining_installments: remaining,
      });
    }

    // Sort by remaining amount (highest first)
    activeInstallments.sort((a, b) => b.remaining_amount - a.remaining_amount);

    // Generate monthly projections and calendar events
    const today = getToday();
    const monthlyProjections: TMonthlyProjection[] = [];
    const calendarEvents: TCalendarEvent[] = [];

    for (let m = 0; m < months; m++) {
      const projectionMonth = new Date(today);
      projectionMonth.setMonth(projectionMonth.getMonth() + m);
      const monthStr = `${projectionMonth.getFullYear()}-${String(projectionMonth.getMonth() + 1).padStart(2, "0")}`;

      const monthDetails: TMonthlyProjection["details"] = [];

      for (const inst of activeInstallments) {
        // Check if this installment will still be active in this month
        const nextPaymentDate = new Date(inst.next_date);
        const monthsUntilPayment =
          (nextPaymentDate.getFullYear() - today.getFullYear()) * 12 +
          (nextPaymentDate.getMonth() - today.getMonth());

        // Calculate which installment number this would be
        const installmentInMonth = inst.current_installment + m + 1;

        if (
          installmentInMonth <= inst.total_installments &&
          monthsUntilPayment <= m
        ) {
          monthDetails.push({
            description: inst.description,
            amount: inst.amount,
            installment: `${installmentInMonth}/${inst.total_installments}`,
          });

          // Add calendar event (use day from original date or 15th as default)
          const paymentDate = new Date(inst.next_date);
          paymentDate.setMonth(paymentDate.getMonth() + m);
          const dayOfMonth = paymentDate.getDate();

          const eventDate = new Date(
            projectionMonth.getFullYear(),
            projectionMonth.getMonth(),
            dayOfMonth,
          );

          calendarEvents.push({
            date: eventDate.toISOString().split("T")[0],
            description: inst.description,
            amount: inst.amount,
            installment: `${installmentInMonth}/${inst.total_installments}`,
          });
        }
      }

      monthlyProjections.push({
        month: monthStr,
        total_installments: monthDetails.reduce((sum, d) => sum + d.amount, 0),
        installment_count: monthDetails.length,
        details: monthDetails,
      });
    }

    // Sort calendar events by date
    calendarEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate budget impact
    const avgMonthlyInstallments =
      monthlyProjections.length > 0
        ? monthlyProjections.reduce((sum, mp) => sum + mp.total_installments, 0) /
          monthlyProjections.length
        : 0;

    let budgetImpact: TBudgetImpact;

    if (budgetConfig) {
      const dailyBase = budgetConfig.daily_base;
      const monthlyBudget = dailyBase * 30;

      const dailyImpact = avgMonthlyInstallments / 30;
      const dailyAvailable = dailyBase - dailyImpact;
      const weeklyAvailable = dailyAvailable * 7;
      const monthlyAvailable = monthlyBudget - avgMonthlyInstallments;

      budgetImpact = {
        avg_monthly_installments: Math.round(avgMonthlyInstallments * 100) / 100,
        daily_available: Math.round(dailyAvailable * 100) / 100,
        weekly_available: Math.round(weeklyAvailable * 100) / 100,
        monthly_available: Math.round(monthlyAvailable * 100) / 100,
        commitment_percentage:
          monthlyBudget > 0
            ? Math.round((avgMonthlyInstallments / monthlyBudget) * 10000) / 100
            : 0,
      };
    } else {
      // No budget config, just show installment totals
      budgetImpact = {
        avg_monthly_installments: Math.round(avgMonthlyInstallments * 100) / 100,
        daily_available: 0,
        weekly_available: 0,
        monthly_available: 0,
        commitment_percentage: 0,
      };
    }

    const forecast: TBudgetForecast = {
      budget_config: budgetConfig
        ? {
            daily_base: budgetConfig.daily_base,
            weekly_budget: budgetConfig.daily_base * 7,
            monthly_budget: budgetConfig.daily_base * 30,
          }
        : null,
      active_installments: activeInstallments,
      monthly_projections: monthlyProjections,
      budget_impact: budgetImpact,
      calendar_events: calendarEvents,
    };

    logger.info("Budget forecast fetched", {
      accountId,
      months,
      activeInstallments: activeInstallments.length,
      calendarEvents: calendarEvents.length,
    });

    return { data: forecast, error: null, success: true };
  } catch (error) {
    logger.error("Error in getBudgetForecast", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar previsao de orcamento",
      success: false,
    };
  }
}
