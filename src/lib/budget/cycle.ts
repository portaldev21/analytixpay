/**
 * Cycle management functions for Rolling Budget (Orcamento Fluido)
 *
 * Handles creation, closing, and transition of weekly budget cycles.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TBudgetConfig,
  TCarryOverMode,
  TDailyRecord,
  TWeekCycle,
  TWeekCycleInsert,
  TDailyRecordInsert,
} from "@/db/types";
import {
  calculateAvailableBudget,
  calculateCarryOverBalance,
  calculateRemainingDays,
  calculateWeekCycleDates,
  formatDateToString,
  getToday,
} from "./calculations";

/**
 * Creates a new week cycle for an account
 *
 * @param supabase - Supabase client
 * @param accountId - The account ID
 * @param config - The budget configuration
 * @param referenceDate - Date to use for calculating cycle dates
 * @param carriedBalance - Balance carried from previous cycle (default 0)
 * @returns The newly created week cycle
 */
export async function createNewCycle(
  supabase: SupabaseClient,
  accountId: string,
  config: TBudgetConfig,
  referenceDate: Date = getToday(),
  carriedBalance: number = 0,
): Promise<TWeekCycle> {
  const { start, end } = calculateWeekCycleDates(
    referenceDate,
    config.week_start_day,
  );

  const startDateStr = formatDateToString(start);
  const endDateStr = formatDateToString(end);

  // First check if cycle already exists (race condition prevention)
  const { data: existingCycle } = await supabase
    .from("week_cycles")
    .select("*")
    .eq("account_id", accountId)
    .eq("start_date", startDateStr)
    .eq("end_date", endDateStr)
    .single();

  if (existingCycle) {
    return existingCycle as TWeekCycle;
  }

  const cycleData: TWeekCycleInsert = {
    account_id: accountId,
    config_id: config.id,
    start_date: startDateStr,
    end_date: endDateStr,
    initial_budget: config.daily_base * 7,
    carried_balance: carriedBalance,
    accumulated_balance: carriedBalance, // Starts with carried balance
    status: "active",
  };

  const { data, error } = await supabase
    .from("week_cycles")
    .insert(cycleData)
    .select()
    .single();

  if (error) {
    // Handle race condition - cycle may have been created by another request
    if (error.code === "23505") {
      const { data: raceRecord, error: raceError } = await supabase
        .from("week_cycles")
        .select("*")
        .eq("account_id", accountId)
        .eq("start_date", startDateStr)
        .eq("end_date", endDateStr)
        .single();

      if (raceError || !raceRecord) {
        throw new Error(`Erro ao buscar ciclo apos conflito: ${raceError?.message}`);
      }

      return raceRecord as TWeekCycle;
    }

    throw new Error(`Erro ao criar ciclo semanal: ${error.message}`);
  }

  return data as TWeekCycle;
}

/**
 * Closes a week cycle by setting its status to 'closed'
 *
 * @param supabase - Supabase client
 * @param cycleId - The cycle ID to close
 */
export async function closeCycle(
  supabase: SupabaseClient,
  cycleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("week_cycles")
    .update({ status: "closed" })
    .eq("id", cycleId);

  if (error) {
    throw new Error(`Erro ao fechar ciclo: ${error.message}`);
  }
}

/**
 * Gets the active cycle for an account, or null if none exists
 *
 * @param supabase - Supabase client
 * @param accountId - The account ID
 * @param referenceDate - Date to check for active cycle
 * @returns The active cycle or null
 */
export async function getActiveCycle(
  supabase: SupabaseClient,
  accountId: string,
  referenceDate: Date = getToday(),
): Promise<TWeekCycle | null> {
  const dateStr = formatDateToString(referenceDate);

  const { data, error } = await supabase
    .from("week_cycles")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "active")
    .lte("start_date", dateStr)
    .gte("end_date", dateStr)
    .single();

  if (error) {
    // No active cycle found is not an error
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Erro ao buscar ciclo ativo: ${error.message}`);
  }

  return data as TWeekCycle;
}

/**
 * Handles the transition from one cycle to another
 * Closes the old cycle if needed and creates a new one
 *
 * @param supabase - Supabase client
 * @param accountId - The account ID
 * @param config - The budget configuration
 * @returns The new active cycle
 */
export async function handleCycleTransition(
  supabase: SupabaseClient,
  accountId: string,
  config: TBudgetConfig,
): Promise<TWeekCycle> {
  const today = getToday();

  // Check for any active cycle
  const { data: currentCycle } = await supabase
    .from("week_cycles")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "active")
    .single();

  // If there's an active cycle that should have ended
  if (currentCycle) {
    const cycleEndDate = new Date(currentCycle.end_date);
    cycleEndDate.setHours(23, 59, 59, 999);

    if (today > cycleEndDate) {
      // Close the old cycle
      await closeCycle(supabase, currentCycle.id);

      // Calculate carry-over balance
      const carriedBalance = calculateCarryOverBalance(
        currentCycle.accumulated_balance,
        config.carry_over_mode,
      );

      // Create new cycle with carried balance
      return await createNewCycle(
        supabase,
        accountId,
        config,
        today,
        carriedBalance,
      );
    }

    // Current cycle is still valid
    return currentCycle as TWeekCycle;
  }

  // No active cycle exists, create a new one
  return await createNewCycle(supabase, accountId, config, today, 0);
}

/**
 * Ensures a cycle exists for the current week, creating one if needed
 *
 * @param supabase - Supabase client
 * @param accountId - The account ID
 * @param config - The budget configuration
 * @returns The active cycle for the current week
 */
export async function ensureActiveCycle(
  supabase: SupabaseClient,
  accountId: string,
  config: TBudgetConfig,
): Promise<TWeekCycle> {
  const activeCycle = await getActiveCycle(supabase, accountId);

  if (activeCycle) {
    return activeCycle;
  }

  // Need to handle cycle transition or create new cycle
  return await handleCycleTransition(supabase, accountId, config);
}

/**
 * Gets or creates a daily record for a specific date
 *
 * @param supabase - Supabase client
 * @param accountId - The account ID
 * @param cycle - The week cycle
 * @param config - The budget configuration
 * @param date - The date for the record
 * @returns The daily record (existing or newly created)
 */
export async function getOrCreateDailyRecord(
  supabase: SupabaseClient,
  accountId: string,
  cycle: TWeekCycle,
  config: TBudgetConfig,
  date: Date = getToday(),
): Promise<TDailyRecord> {
  const dateStr = formatDateToString(date);

  // Try to get existing record
  const { data: existingRecord } = await supabase
    .from("daily_records")
    .select("*")
    .eq("account_id", accountId)
    .eq("record_date", dateStr)
    .single();

  if (existingRecord) {
    return existingRecord as TDailyRecord;
  }

  // Calculate remaining days and available budget
  const cycleEndDate = new Date(cycle.end_date);
  const remainingDays = calculateRemainingDays(date, cycleEndDate);
  const availableBudget = calculateAvailableBudget(
    config.daily_base,
    cycle.accumulated_balance,
    remainingDays,
  );

  // Create new daily record
  const recordData: TDailyRecordInsert = {
    account_id: accountId,
    cycle_id: cycle.id,
    record_date: dateStr,
    base_budget: config.daily_base,
    available_budget: availableBudget,
    total_spent: 0,
    daily_balance: availableBudget, // Initially, balance = available (no spending yet)
    remaining_days: remainingDays,
  };

  const { data: newRecord, error } = await supabase
    .from("daily_records")
    .insert(recordData)
    .select()
    .single();

  if (error) {
    // Handle race condition - record may have been created by another request
    if (error.code === "23505") {
      // Unique constraint violation - fetch the existing record
      const { data: raceRecord, error: raceError } = await supabase
        .from("daily_records")
        .select("*")
        .eq("account_id", accountId)
        .eq("record_date", dateStr)
        .single();

      if (raceError || !raceRecord) {
        throw new Error(`Erro ao buscar registro apos conflito: ${raceError?.message}`);
      }

      return raceRecord as TDailyRecord;
    }

    throw new Error(`Erro ao criar registro diario: ${error.message}`);
  }

  return newRecord as TDailyRecord;
}

/**
 * Updates a daily record's spent amount and recalculates balance
 *
 * @param supabase - Supabase client
 * @param recordId - The daily record ID
 * @param newTotalSpent - The new total spent amount
 * @returns The updated daily record
 */
export async function updateDailyRecordSpent(
  supabase: SupabaseClient,
  recordId: string,
  newTotalSpent: number,
): Promise<TDailyRecord> {
  // Get current record to calculate new balance
  const { data: currentRecord, error: fetchError } = await supabase
    .from("daily_records")
    .select("available_budget")
    .eq("id", recordId)
    .single();

  if (fetchError) {
    throw new Error(`Erro ao buscar registro: ${fetchError.message}`);
  }

  const availableBudget = currentRecord.available_budget;
  const dailyBalance = Math.round((availableBudget - newTotalSpent) * 100) / 100;

  const { data: updatedRecord, error } = await supabase
    .from("daily_records")
    .update({
      total_spent: newTotalSpent,
      daily_balance: dailyBalance,
    })
    .eq("id", recordId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar registro diario: ${error.message}`);
  }

  return updatedRecord as TDailyRecord;
}

/**
 * Recalculates the accumulated balance for a cycle based on all daily records
 *
 * @param supabase - Supabase client
 * @param cycleId - The cycle ID
 * @returns The new accumulated balance
 */
export async function recalculateCycleAccumulatedBalance(
  supabase: SupabaseClient,
  cycleId: string,
): Promise<number> {
  // Get all daily records for this cycle
  const { data: dailyRecords, error: fetchError } = await supabase
    .from("daily_records")
    .select("daily_balance")
    .eq("cycle_id", cycleId);

  if (fetchError) {
    throw new Error(`Erro ao buscar registros diarios: ${fetchError.message}`);
  }

  // Get cycle's carried balance
  const { data: cycle, error: cycleError } = await supabase
    .from("week_cycles")
    .select("carried_balance")
    .eq("id", cycleId)
    .single();

  if (cycleError) {
    throw new Error(`Erro ao buscar ciclo: ${cycleError.message}`);
  }

  // Sum all daily balances plus carried balance
  const dailyBalancesSum = (dailyRecords || []).reduce((sum, record) => {
    return sum + Number(record.daily_balance);
  }, 0);

  const newAccumulatedBalance =
    Math.round((Number(cycle.carried_balance) + dailyBalancesSum) * 100) / 100;

  // Update cycle's accumulated balance
  const { error: updateError } = await supabase
    .from("week_cycles")
    .update({ accumulated_balance: newAccumulatedBalance })
    .eq("id", cycleId);

  if (updateError) {
    throw new Error(`Erro ao atualizar ciclo: ${updateError.message}`);
  }

  return newAccumulatedBalance;
}

/**
 * Gets all daily records for a cycle, ordered by date
 *
 * @param supabase - Supabase client
 * @param cycleId - The cycle ID
 * @returns Array of daily records
 */
export async function getDailyRecordsForCycle(
  supabase: SupabaseClient,
  cycleId: string,
): Promise<TDailyRecord[]> {
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("record_date", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar registros diarios: ${error.message}`);
  }

  return (data || []) as TDailyRecord[];
}

/**
 * Gets the total expenses for a daily record from the budget_expenses table
 *
 * @param supabase - Supabase client
 * @param dailyRecordId - The daily record ID
 * @returns Total amount of expenses
 */
export async function getTotalExpensesForRecord(
  supabase: SupabaseClient,
  dailyRecordId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("budget_expenses")
    .select("amount")
    .eq("daily_record_id", dailyRecordId);

  if (error) {
    throw new Error(`Erro ao buscar gastos: ${error.message}`);
  }

  return (data || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
}
