"use server";

import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { env, hasOpenAI } from "@/lib/env";
import {
  detectRecurringTransactions,
  type RecurringTransaction,
} from "@/lib/analytics/recurring";
import { generateInsights, type Insight } from "@/lib/analytics/insights";
import {
  calculateHealthScore,
  type HealthScore,
} from "@/lib/analytics/health-score";
import {
  calculateTransactionStats,
  type PeriodDateRange,
} from "@/lib/analytics/stats";
import type { TApiResponse, TTransaction } from "@/db/types";

/**
 * Get recurring transactions for account
 */
export async function getRecurringTransactions(
  accountId: string,
): Promise<TApiResponse<RecurringTransaction[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Detecting recurring transactions", { accountId });

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("date", { ascending: true });

    if (error) {
      logger.error(
        "Failed to fetch transactions for recurring detection",
        error,
        {
          accountId,
        },
      );
      return { data: null, error: error.message, success: false };
    }

    const recurring = detectRecurringTransactions(
      transactions as TTransaction[],
    );

    const duration = Date.now() - startTime;
    logger.info("Recurring transactions detected", {
      accountId,
      duration,
      recurringCount: recurring.length,
    });

    return { data: recurring, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getRecurringTransactions", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao detectar recorrências",
      success: false,
    };
  }
}

/**
 * Get smart insights for account
 */
export async function getSmartInsights(
  accountId: string,
  period?: PeriodDateRange,
  previousPeriod?: PeriodDateRange,
): Promise<TApiResponse<Insight[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Generating smart insights", { accountId });

    // Fetch current period transactions
    let currentQuery = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (period) {
      currentQuery = currentQuery
        .gte("date", period.startDate)
        .lte("date", period.endDate);
    }

    const { data: currentTransactions, error: currentError } =
      await currentQuery;

    if (currentError) {
      logger.error(
        "Failed to fetch current transactions for insights",
        currentError,
        {
          accountId,
        },
      );
      return { data: null, error: currentError.message, success: false };
    }

    // Calculate current stats
    const stats = calculateTransactionStats(
      currentTransactions as TTransaction[],
    );

    // Fetch previous period stats if available
    let previousStats: ReturnType<typeof calculateTransactionStats> | undefined;
    if (previousPeriod) {
      const { data: prevTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .gte("date", previousPeriod.startDate)
        .lte("date", previousPeriod.endDate);

      if (prevTransactions) {
        previousStats = calculateTransactionStats(
          prevTransactions as TTransaction[],
        );
      }
    }

    // Get recurring transactions
    const { data: recurring } = await getRecurringTransactions(accountId);

    // Generate insights
    const insights = generateInsights(
      stats,
      previousStats,
      recurring ?? undefined,
    );

    const duration = Date.now() - startTime;
    logger.info("Smart insights generated", {
      accountId,
      duration,
      insightCount: insights.length,
    });

    return { data: insights, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getSmartInsights", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao gerar insights",
      success: false,
    };
  }
}

/**
 * Get financial health score for account
 */
export async function getFinancialHealthScore(
  accountId: string,
  budget?: number,
  period?: PeriodDateRange,
  previousPeriod?: PeriodDateRange,
): Promise<TApiResponse<HealthScore>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Calculating health score", { accountId, budget });

    // Fetch current period transactions
    let currentQuery = supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId);

    if (period) {
      currentQuery = currentQuery
        .gte("date", period.startDate)
        .lte("date", period.endDate);
    }

    const { data: currentTransactions, error: currentError } =
      await currentQuery;

    if (currentError) {
      logger.error(
        "Failed to fetch current transactions for health score",
        currentError,
        {
          accountId,
        },
      );
      return { data: null, error: currentError.message, success: false };
    }

    // Calculate current stats
    const stats = calculateTransactionStats(
      currentTransactions as TTransaction[],
    );

    // Fetch previous period stats if available
    let previousStats: ReturnType<typeof calculateTransactionStats> | undefined;
    if (previousPeriod) {
      const { data: prevTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .gte("date", previousPeriod.startDate)
        .lte("date", previousPeriod.endDate);

      if (prevTransactions) {
        previousStats = calculateTransactionStats(
          prevTransactions as TTransaction[],
        );
      }
    }

    // Calculate health score
    const healthScore = calculateHealthScore(stats, budget, previousStats);

    const duration = Date.now() - startTime;
    logger.info("Health score calculated", {
      accountId,
      duration,
      score: healthScore.score,
      grade: healthScore.grade,
    });

    return { data: healthScore, error: null, success: true };
  } catch (error) {
    logger.error("Exception in getFinancialHealthScore", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao calcular score de saúde",
      success: false,
    };
  }
}

/**
 * Valid categories in our database
 */
const VALID_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Compras",
  "Educação",
  "Casa",
  "Vestuário",
  "Beleza",
  "Tecnologia",
  "Serviços",
  "Outros",
];

/**
 * Recategorize all transactions using AI
 */
export async function recategorizeTransactionsWithAI(
  accountId: string,
): Promise<TApiResponse<{ updated: number; total: number }>> {
  const startTime = Date.now();

  try {
    if (!hasOpenAI()) {
      return {
        data: null,
        error:
          "OPENAI_API_KEY não configurada. Configure no arquivo .env.local",
        success: false,
      };
    }

    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Starting AI recategorization", { accountId });

    // Fetch all transactions
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select("id, description, category")
      .eq("account_id", accountId);

    if (fetchError) {
      logger.error("Failed to fetch transactions for recategorization", fetchError, {
        accountId,
      });
      return { data: null, error: fetchError.message, success: false };
    }

    if (!transactions || transactions.length === 0) {
      return {
        data: { updated: 0, total: 0 },
        error: null,
        success: true,
      };
    }

    const transactionList = transactions as { id: string; description: string; category: string }[];

    // Prepare descriptions for AI
    const descriptionsMap = transactionList.map((t) => ({
      id: t.id,
      description: t.description,
    }));

    // Call OpenAI to categorize all transactions at once
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const prompt = `Categorize as seguintes transações de cartão de crédito brasileiro.

CATEGORIAS VÁLIDAS (use EXATAMENTE estes nomes):
- "Alimentação" - restaurantes, mercados, supermercados, padarias, delivery, iFood
- "Transporte" - Uber, 99, táxi, combustível, gasolina, estacionamento, pedágio
- "Saúde" - farmácias, drogarias, clínicas, hospitais, médicos
- "Lazer" - cinema, streaming (Netflix, Spotify, Disney+), games, shows
- "Compras" - lojas, shopping, marketplaces (Amazon, Mercado Livre, Shopee)
- "Educação" - escolas, cursos, faculdades, livros, Udemy, Alura
- "Casa" - água, luz, energia, gás, internet, condomínio, telecom
- "Vestuário" - roupas, calçados, sapatos, tênis, acessórios
- "Beleza" - salões, cabeleireiros, cosméticos, perfumes
- "Tecnologia" - eletrônicos, computadores, celulares, notebooks
- "Serviços" - manutenção, consertos, assinaturas diversas
- "Outros" - quando não se encaixar em nenhuma categoria

Transações (formato: id|descrição):
${descriptionsMap.map((t) => `${t.id}|${t.description}`).join("\n")}

Retorne APENAS um JSON no formato:
{
  "categories": {
    "id1": "Categoria",
    "id2": "Categoria"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você categoriza transações de cartão de crédito. Retorne APENAS JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        data: null,
        error: "Resposta vazia da IA",
        success: false,
      };
    }

    const result = JSON.parse(content) as { categories: Record<string, string> };

    if (!result.categories) {
      return {
        data: null,
        error: "Formato de resposta inválido da IA",
        success: false,
      };
    }

    // Update transactions with new categories
    let updatedCount = 0;
    for (const [id, category] of Object.entries(result.categories)) {
      // Validate category
      const validCategory = VALID_CATEGORIES.includes(category) ? category : "Outros";

      const { error: updateError } = await (supabase
        .from("transactions") as any)
        .update({ category: validCategory })
        .eq("id", id)
        .eq("account_id", accountId);

      if (!updateError) {
        updatedCount++;
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    const duration = Date.now() - startTime;
    logger.info("AI recategorization completed", {
      accountId,
      duration,
      total: transactionList.length,
      updated: updatedCount,
    });

    return {
      data: { updated: updatedCount, total: transactionList.length },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in recategorizeTransactionsWithAI", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao recategorizar transações",
      success: false,
    };
  }
}

/**
 * Get invoices without billing_date for migration
 */
export async function getInvoicesWithoutBillingDate(
  accountId: string,
): Promise<TApiResponse<{ id: string; period: string | null; file_name: string | null; created_at: string }[]>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching invoices without billing_date", { accountId });

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, period, file_name, created_at")
      .eq("account_id", accountId)
      .is("billing_date", null)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch invoices without billing_date", error, {
        accountId,
      });
      return { data: null, error: error.message, success: false };
    }

    return { data: invoices || [], error: null, success: true };
  } catch (error) {
    logger.error("Exception in getInvoicesWithoutBillingDate", error, {
      accountId,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar faturas",
      success: false,
    };
  }
}

/**
 * Update billing_date for an invoice and all its transactions
 */
export async function updateInvoiceBillingDate(
  accountId: string,
  invoiceId: string,
  billingDate: string,
): Promise<TApiResponse<{ updatedTransactions: number }>> {
  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Updating invoice billing_date", {
      accountId,
      invoiceId,
      billingDate,
    });

    // Update invoice billing_date
    const { error: invoiceError } = await (supabase
      .from("invoices") as any)
      .update({ billing_date: billingDate })
      .eq("id", invoiceId)
      .eq("account_id", accountId);

    if (invoiceError) {
      logger.error("Failed to update invoice billing_date", invoiceError, {
        accountId,
        invoiceId,
      });
      return { data: null, error: invoiceError.message, success: false };
    }

    // Update all transactions from this invoice
    const { data: updateResult, error: transError } = await (supabase
      .from("transactions") as any)
      .update({ billing_date: billingDate })
      .eq("invoice_id", invoiceId)
      .eq("account_id", accountId)
      .select("id");

    if (transError) {
      logger.error("Failed to update transactions billing_date", transError, {
        accountId,
        invoiceId,
      });
      return { data: null, error: transError.message, success: false };
    }

    const updatedCount = updateResult?.length || 0;

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/invoices");
    revalidatePath("/settings");

    logger.info("Invoice billing_date updated", {
      accountId,
      invoiceId,
      billingDate,
      updatedTransactions: updatedCount,
    });

    return {
      data: { updatedTransactions: updatedCount },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in updateInvoiceBillingDate", error, {
      accountId,
      invoiceId,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar data de vencimento",
      success: false,
    };
  }
}
