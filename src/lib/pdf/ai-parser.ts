import OpenAI from "openai";
import type { TParsedTransaction, TPdfParseResult } from "@/db/types";
import { env, hasOpenAI } from "@/lib/env";

/**
 * AI-extracted invoice data structure
 */
interface AIExtractedInvoice {
  period?: string; // "MM/YYYY"
  dueDate?: string; // "YYYY-MM-DD"
  totalAmount?: number;
  cardLastDigits?: string;
  transactions: {
    date: string; // "YYYY-MM-DD"
    description: string;
    amount: number;
    installment?: string; // "1/12"
    isInternational?: boolean;
    category?: string;
  }[];
}

/**
 * Category mapping for AI suggestions to our database categories
 */
const AI_CATEGORY_MAP: Record<string, string> = {
  food: "Alimentação",
  restaurant: "Alimentação",
  groceries: "Alimentação",
  supermarket: "Alimentação",
  transport: "Transporte",
  uber: "Transporte",
  taxi: "Transporte",
  gas: "Transporte",
  health: "Saúde",
  pharmacy: "Saúde",
  medical: "Saúde",
  entertainment: "Lazer",
  streaming: "Lazer",
  cinema: "Lazer",
  shopping: "Compras",
  marketplace: "Compras",
  education: "Educação",
  course: "Educação",
  home: "Casa",
  utilities: "Casa",
  internet: "Casa",
  clothing: "Vestuário",
  fashion: "Vestuário",
  beauty: "Beleza",
  salon: "Beleza",
  technology: "Tecnologia",
  electronics: "Tecnologia",
  services: "Serviços",
  subscription: "Serviços",
};

/**
 * Normalize AI category to our database category
 */
function normalizeCategory(aiCategory?: string): string {
  if (!aiCategory) return "Outros";

  const lower = aiCategory.toLowerCase();
  for (const [key, value] of Object.entries(AI_CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return "Outros";
}

/**
 * Parse invoice using OpenAI GPT-4o-mini
 */
export async function parseInvoiceWithAI(
  text: string,
): Promise<TPdfParseResult> {
  try {
    // Validate API key
    if (!hasOpenAI()) {
      console.error("OPENAI_API_KEY not configured");
      return {
        transactions: [],
        error:
          "Configuração de IA não encontrada. Configure OPENAI_API_KEY no arquivo .env.local",
      };
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Prepare prompt
    const prompt = `Você é um assistente especializado em extrair dados de faturas de cartão de crédito brasileiras.

Extraia as seguintes informações do texto abaixo e retorne APENAS um JSON válido (sem markdown, sem explicações):

{
  "period": "MM/YYYY",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": number,
  "cardLastDigits": "1234",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nome do estabelecimento limpo (sem parcelas, sem caracteres especiais desnecessários)",
      "amount": number (sempre positivo, sem vírgulas ou pontos - use ponto para decimal),
      "installment": "1/12" (se houver parcela, extrair no formato X/Y),
      "isInternational": boolean (true se transação internacional)
    }
  ]
}

REGRAS IMPORTANTES:
1. Datas sempre no formato ISO (YYYY-MM-DD)
2. Valores sempre como números decimais (ex: 123.45, não "123,45")
3. Ignorar linhas de cabeçalho, totais de seções, propagandas
4. Extrair APENAS transações reais (compras, pagamentos)
5. Se houver parcelas no formato "Parcela 01 de 12" ou "(1/12)", extrair como "1/12"
6. Limpar descrição: remover textos como "Parcela X de Y", manter apenas nome do estabelecimento
7. Não incluir linhas de "Total CARTÃO", "PAGTO DEBITO AUTOMATICO" com valor negativo ou positivo que sejam totalizadores
8. Para o período, usar o mês/ano de vencimento da fatura

Texto da fatura:
---
${text}
---

Retorne APENAS o JSON, sem markdown ou explicações.`;

    console.log("Calling OpenAI API for invoice parsing...");

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que extrai dados estruturados de faturas de cartão de crédito e retorna APENAS JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        transactions: [],
        error: "Resposta vazia da IA",
      };
    }

    console.log("OpenAI response received, parsing JSON...");

    // Parse JSON response
    const extracted: AIExtractedInvoice = JSON.parse(content);

    // Validate extracted data
    if (!extracted.transactions || !Array.isArray(extracted.transactions)) {
      return {
        transactions: [],
        error: "IA não conseguiu extrair transações da fatura",
      };
    }

    if (extracted.transactions.length === 0) {
      return {
        transactions: [],
        error: "Nenhuma transação encontrada na fatura",
      };
    }

    // Transform to our format
    const transactions: TParsedTransaction[] = extracted.transactions.map(
      (t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        installment: t.installment,
        is_international: t.isInternational || false,
        category: normalizeCategory(t.category),
      }),
    );

    // Calculate total
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    console.log(
      `Successfully parsed ${transactions.length} transactions via AI`,
    );
    console.log(`Total amount: R$ ${totalAmount.toFixed(2)}`);

    // Log usage for cost tracking
    const usage = response.usage;
    if (usage) {
      const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15; // $0.15 per 1M tokens
      const outputCost = (usage.completion_tokens / 1_000_000) * 0.6; // $0.60 per 1M tokens
      const totalCost = inputCost + outputCost;
      console.log(
        `OpenAI usage: ${usage.prompt_tokens} input + ${usage.completion_tokens} output tokens`,
      );
      console.log(`Estimated cost: $${totalCost.toFixed(4)}`);
    }

    return {
      transactions,
      period: extracted.period,
      cardLastDigits: extracted.cardLastDigits,
      totalAmount: extracted.totalAmount || totalAmount,
    };
  } catch (error) {
    console.error("Error parsing invoice with AI:", error);
    return {
      transactions: [],
      error: `Erro ao processar fatura com IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}
