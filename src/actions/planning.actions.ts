"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type {
  TApiResponse,
  TFinancialPlan,
  TFinancialPlanWithDetails,
  TPlanIncomeSource,
  TPlanScenario,
  TPlanScenarioItem,
  TPlanScenarioWithItems,
} from "@/db/types";
import { logger } from "@/lib/logger";
import { buildInitialScenarioItems } from "@/lib/planning/auto-detect";
import { requireAccountAccess } from "@/lib/supabase/server";

// Helper to get untyped supabase client for new tables
// This is needed because the Database type hasn't been regenerated from Supabase
function getUntypedClient(
  supabase: SupabaseClient,
  // biome-ignore lint/suspicious/noExplicitAny: Temporary until types are regenerated
): SupabaseClient<any> {
  // biome-ignore lint/suspicious/noExplicitAny: Temporary until types are regenerated
  return supabase as SupabaseClient<any>;
}

// =============================================================================
// PLAN CRUD ACTIONS
// =============================================================================

/**
 * Create a new financial plan with 3 default scenarios and auto-detected items
 */
export async function createPlan(
  accountId: string,
  name: string,
  startMonth: string,
  initialBalance: number,
): Promise<TApiResponse<TFinancialPlanWithDetails>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Create the plan
    const { data: plan, error: planError } = await db
      .from("financial_plans")
      .insert({
        account_id: accountId,
        name,
        start_month: startMonth,
        months: 12,
        initial_balance: initialBalance,
      })
      .select()
      .single();

    if (planError || !plan) {
      logger.error("Error creating financial plan", planError);
      return {
        data: null,
        error: planError?.message || "Erro ao criar plano",
        success: false,
      };
    }

    const planId = plan.id as string;

    // Create 3 default scenarios
    const scenarioDefinitions = [
      { type: "current", name: "Realidade Atual" },
      { type: "optimistic", name: "Cenario Otimista" },
      { type: "pessimistic", name: "Cenario Pessimista" },
    ];

    const { data: scenarios, error: scenariosError } = await db
      .from("plan_scenarios")
      .insert(
        scenarioDefinitions.map((s) => ({
          plan_id: planId,
          type: s.type,
          name: s.name,
        })),
      )
      .select();

    if (scenariosError || !scenarios?.length) {
      logger.error(
        "Error creating scenarios, rolling back plan",
        scenariosError,
      );
      // Rollback: delete the plan
      await db.from("financial_plans").delete().eq("id", planId);
      return {
        data: null,
        error: scenariosError?.message || "Erro ao criar cenarios",
        success: false,
      };
    }

    const typedScenarios = scenarios as TPlanScenario[];

    // Auto-detect items from transaction history
    const autoItems = await buildInitialScenarioItems(supabase, accountId);

    // Insert items for all scenarios
    if (autoItems.length > 0) {
      const allScenarioItems = typedScenarios.flatMap((scenario) =>
        autoItems.map((item) => ({
          scenario_id: scenario.id,
          category: item.category,
          expense_type: item.expense_type,
          name: item.name,
          amount: item.amount,
          end_month: item.end_month,
          auto_detected: item.auto_detected,
        })),
      );

      const { error: itemsError } = await db
        .from("plan_scenario_items")
        .insert(allScenarioItems);

      if (itemsError) {
        logger.warn("Error inserting auto-detected items", itemsError);
        // Non-fatal: plan and scenarios are created, items just failed
      }
    }

    logger.info("Financial plan created", {
      accountId,
      planId,
      scenarioCount: typedScenarios.length,
      autoItemCount: autoItems.length,
    });

    revalidatePath("/planning");

    // Return full plan with details
    const result = await getPlanWithDetails(planId, accountId);
    return result;
  } catch (error) {
    logger.error("Error in createPlan", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao criar plano financeiro",
      success: false,
    };
  }
}

/**
 * List all financial plans for an account
 */
export async function getPlans(
  accountId: string,
): Promise<TApiResponse<TFinancialPlan[]>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    const { data, error } = await db
      .from("financial_plans")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching plans", error);
      return { data: null, error: error.message, success: false };
    }

    return {
      data: (data || []) as TFinancialPlan[],
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Error in getPlans", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar planos financeiros",
      success: false,
    };
  }
}

/**
 * Get a financial plan with all its details (incomes, scenarios, items)
 */
export async function getPlanWithDetails(
  planId: string,
  accountId: string,
): Promise<TApiResponse<TFinancialPlanWithDetails>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    const { data: plan, error } = await db
      .from("financial_plans")
      .select(
        "*, plan_income_sources(*), plan_scenarios(*, plan_scenario_items(*))",
      )
      .eq("id", planId)
      .eq("account_id", accountId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Plano nao encontrado", success: false };
      }
      logger.error("Error fetching plan with details", error);
      return { data: null, error: error.message, success: false };
    }

    if (!plan) {
      return { data: null, error: "Plano nao encontrado", success: false };
    }

    // Restructure the response to match TFinancialPlanWithDetails
    const { plan_income_sources, plan_scenarios, ...planFields } = plan;

    const scenarios: TPlanScenarioWithItems[] = (
      (plan_scenarios || []) as (TPlanScenario & {
        plan_scenario_items: TPlanScenarioItem[];
      })[]
    ).map((s) => {
      const { plan_scenario_items, ...scenarioFields } = s;
      return {
        ...scenarioFields,
        items: (plan_scenario_items || []) as TPlanScenarioItem[],
      };
    });

    const result: TFinancialPlanWithDetails = {
      ...(planFields as TFinancialPlan),
      incomes: (plan_income_sources || []) as TPlanIncomeSource[],
      scenarios,
    };

    return { data: result, error: null, success: true };
  } catch (error) {
    logger.error("Error in getPlanWithDetails", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar detalhes do plano",
      success: false,
    };
  }
}

/**
 * Update a financial plan's name or initial balance
 */
export async function updatePlan(
  planId: string,
  accountId: string,
  updates: { name?: string; initial_balance?: number },
): Promise<TApiResponse<TFinancialPlan>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    const { data, error } = await db
      .from("financial_plans")
      .update(updates)
      .eq("id", planId)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating plan", error);
      return { data: null, error: error.message, success: false };
    }

    if (!data) {
      return { data: null, error: "Plano nao encontrado", success: false };
    }

    logger.info("Financial plan updated", { accountId, planId });
    revalidatePath("/planning");

    return { data: data as TFinancialPlan, error: null, success: true };
  } catch (error) {
    logger.error("Error in updatePlan", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar plano financeiro",
      success: false,
    };
  }
}

/**
 * Delete a financial plan (cascading deletes handle children)
 */
export async function deletePlan(
  planId: string,
  accountId: string,
): Promise<TApiResponse<null>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    const { error } = await db
      .from("financial_plans")
      .delete()
      .eq("id", planId)
      .eq("account_id", accountId);

    if (error) {
      logger.error("Error deleting plan", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Financial plan deleted", { accountId, planId });
    revalidatePath("/planning");

    return { data: null, error: null, success: true };
  } catch (error) {
    logger.error("Error in deletePlan", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao excluir plano financeiro",
      success: false,
    };
  }
}

// =============================================================================
// INCOME SOURCE ACTIONS
// =============================================================================

/**
 * Add an income source to a plan
 */
export async function addIncome(
  planId: string,
  accountId: string,
  income: {
    name: string;
    amount: number;
    frequency: "monthly" | "once";
    month_index?: number | null;
  },
): Promise<TApiResponse<TPlanIncomeSource>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify plan belongs to this account
    const { data: plan, error: planError } = await db
      .from("financial_plans")
      .select("id")
      .eq("id", planId)
      .eq("account_id", accountId)
      .single();

    if (planError || !plan) {
      return { data: null, error: "Plano nao encontrado", success: false };
    }

    const { data, error } = await db
      .from("plan_income_sources")
      .insert({
        plan_id: planId,
        name: income.name,
        amount: income.amount,
        frequency: income.frequency,
        month_index: income.month_index ?? null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error adding income source", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Income source added", {
      accountId,
      planId,
      incomeId: data.id,
    });
    revalidatePath("/planning");

    return { data: data as TPlanIncomeSource, error: null, success: true };
  } catch (error) {
    logger.error("Error in addIncome", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao adicionar fonte de renda",
      success: false,
    };
  }
}

/**
 * Update an income source
 */
export async function updateIncome(
  incomeId: string,
  accountId: string,
  updates: {
    name?: string;
    amount?: number;
    frequency?: "monthly" | "once";
    month_index?: number | null;
  },
): Promise<TApiResponse<TPlanIncomeSource>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify income belongs to a plan owned by this account
    const { data: income, error: incomeError } = await db
      .from("plan_income_sources")
      .select("id, plan_id, financial_plans!inner(account_id)")
      .eq("id", incomeId)
      .single();

    if (incomeError || !income) {
      return {
        data: null,
        error: "Fonte de renda nao encontrada",
        success: false,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase embedded select returns dynamic shape
    const planData = (income as any).financial_plans;
    if (planData?.account_id !== accountId) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data, error } = await db
      .from("plan_income_sources")
      .update(updates)
      .eq("id", incomeId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating income source", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Income source updated", { accountId, incomeId });
    revalidatePath("/planning");

    return { data: data as TPlanIncomeSource, error: null, success: true };
  } catch (error) {
    logger.error("Error in updateIncome", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar fonte de renda",
      success: false,
    };
  }
}

/**
 * Remove an income source
 */
export async function removeIncome(
  incomeId: string,
  accountId: string,
): Promise<TApiResponse<null>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify income belongs to a plan owned by this account
    const { data: income, error: incomeError } = await db
      .from("plan_income_sources")
      .select("id, plan_id, financial_plans!inner(account_id)")
      .eq("id", incomeId)
      .single();

    if (incomeError || !income) {
      return {
        data: null,
        error: "Fonte de renda nao encontrada",
        success: false,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase embedded select returns dynamic shape
    const planData = (income as any).financial_plans;
    if (planData?.account_id !== accountId) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { error } = await db
      .from("plan_income_sources")
      .delete()
      .eq("id", incomeId);

    if (error) {
      logger.error("Error removing income source", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Income source removed", { accountId, incomeId });
    revalidatePath("/planning");

    return { data: null, error: null, success: true };
  } catch (error) {
    logger.error("Error in removeIncome", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao remover fonte de renda",
      success: false,
    };
  }
}

// =============================================================================
// SCENARIO ITEM ACTIONS
// =============================================================================

/**
 * Add an item to a scenario
 */
export async function addScenarioItem(
  scenarioId: string,
  accountId: string,
  item: {
    category: string;
    expense_type: "fixed" | "variable";
    name: string;
    amount: number;
    end_month?: number | null;
  },
): Promise<TApiResponse<TPlanScenarioItem>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify scenario belongs to a plan owned by this account
    const { data: scenario, error: scenarioError } = await db
      .from("plan_scenarios")
      .select("id, plan_id, financial_plans!inner(account_id)")
      .eq("id", scenarioId)
      .single();

    if (scenarioError || !scenario) {
      return { data: null, error: "Cenario nao encontrado", success: false };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase embedded select returns dynamic shape
    const planData = (scenario as any).financial_plans;
    if (planData?.account_id !== accountId) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data, error } = await db
      .from("plan_scenario_items")
      .insert({
        scenario_id: scenarioId,
        category: item.category,
        expense_type: item.expense_type,
        name: item.name,
        amount: item.amount,
        end_month: item.end_month ?? null,
        auto_detected: false,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error adding scenario item", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Scenario item added", {
      accountId,
      scenarioId,
      itemId: data.id,
    });
    revalidatePath("/planning");

    return { data: data as TPlanScenarioItem, error: null, success: true };
  } catch (error) {
    logger.error("Error in addScenarioItem", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao adicionar item ao cenario",
      success: false,
    };
  }
}

/**
 * Update a scenario item
 */
export async function updateScenarioItem(
  itemId: string,
  accountId: string,
  updates: {
    category?: string;
    expense_type?: "fixed" | "variable";
    name?: string;
    amount?: number;
    end_month?: number | null;
  },
): Promise<TApiResponse<TPlanScenarioItem>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify item belongs to a scenario in a plan owned by this account
    const { data: item, error: itemError } = await db
      .from("plan_scenario_items")
      .select(
        "id, scenario_id, plan_scenarios!inner(plan_id, financial_plans!inner(account_id))",
      )
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return {
        data: null,
        error: "Item do cenario nao encontrado",
        success: false,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase embedded select returns dynamic shape
    const scenarioData = (item as any).plan_scenarios;
    if (scenarioData?.financial_plans?.account_id !== accountId) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { data, error } = await db
      .from("plan_scenario_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating scenario item", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Scenario item updated", { accountId, itemId });
    revalidatePath("/planning");

    return { data: data as TPlanScenarioItem, error: null, success: true };
  } catch (error) {
    logger.error("Error in updateScenarioItem", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar item do cenario",
      success: false,
    };
  }
}

/**
 * Remove a scenario item
 */
export async function removeScenarioItem(
  itemId: string,
  accountId: string,
): Promise<TApiResponse<null>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);
    const db = getUntypedClient(supabase);

    // Verify item belongs to a scenario in a plan owned by this account
    const { data: item, error: itemError } = await db
      .from("plan_scenario_items")
      .select(
        "id, scenario_id, plan_scenarios!inner(plan_id, financial_plans!inner(account_id))",
      )
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return {
        data: null,
        error: "Item do cenario nao encontrado",
        success: false,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase embedded select returns dynamic shape
    const scenarioData = (item as any).plan_scenarios;
    if (scenarioData?.financial_plans?.account_id !== accountId) {
      return { data: null, error: "Acesso negado", success: false };
    }

    const { error } = await db
      .from("plan_scenario_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      logger.error("Error removing scenario item", error);
      return { data: null, error: error.message, success: false };
    }

    logger.info("Scenario item removed", { accountId, itemId });
    revalidatePath("/planning");

    return { data: null, error: null, success: true };
  } catch (error) {
    logger.error("Error in removeScenarioItem", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao remover item do cenario",
      success: false,
    };
  }
}
