import Anthropic from "@anthropic-ai/sdk";
import type { TParsedTransaction, TPdfParseResult } from "@/db/types";
import { env, hasAnthropic } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * AI-extracted invoice data structure
 * Valores em CENTAVOS para evitar problemas com separadores decimais
 */
interface AIExtractedInvoice {
  period?: string; // "MM/YYYY"
  dueDate?: string; // "YYYY-MM-DD"
  totalAmountCents?: number; // Total em centavos
  cardLastDigits?: string;
  transactions: {
    date: string; // "YYYY-MM-DD"
    description: string;
    amountCents: number; // Valor em centavos (ex: R$ 1.234,56 = 123456)
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
  // Taxas e encargos
  iof: "Taxas e Encargos",
  tax: "Taxas e Encargos",
  fee: "Taxas e Encargos",
  interest: "Taxas e Encargos",
  annuity: "Taxas e Encargos",
  anuidade: "Taxas e Encargos",
  juros: "Taxas e Encargos",
  multa: "Taxas e Encargos",
  tarifa: "Taxas e Encargos",
  encargo: "Taxas e Encargos",
  seguro: "Taxas e Encargos",
};

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
  "Taxas e Encargos",
  "Outros",
];

/**
 * Normalize AI category to our database category
 */
function normalizeCategory(aiCategory?: string): string {
  if (!aiCategory) return "Outros";

  // Check if category is already valid (direct match from AI)
  if (VALID_CATEGORIES.includes(aiCategory)) {
    return aiCategory;
  }

  // Try to map from English/alternative names
  const lower = aiCategory.toLowerCase();
  for (const [key, value] of Object.entries(AI_CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return "Outros";
}

/**
 * Parse invoice using Anthropic Claude with native PDF support
 */
export async function parseInvoiceWithAI(
  pdfBuffer: ArrayBuffer,
): Promise<TPdfParseResult> {
  try {
    // Validate API key
    if (!hasAnthropic()) {
      logger.warn("ANTHROPIC_API_KEY not configured");
      return {
        transactions: [],
        error:
          "Configuração de IA não encontrada. Configure ANTHROPIC_API_KEY no arquivo .env.local",
      };
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    // Convert PDF to base64
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Prepare prompt - optimized for Banco Inter format
    const prompt = `Você é um extrator de dados de faturas de cartão de crédito brasileiras.

TAREFA: Extrair transações da seção "Despesas da fatura" deste PDF.

RETORNE APENAS JSON (sem markdown):
{
  "period": "MM/YYYY",
  "dueDate": "YYYY-MM-DD",
  "totalAmountCents": number,
  "cardLastDigits": "1234",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nome do estabelecimento",
      "amountCents": number,
      "installment": "1/12" ou null,
      "isInternational": boolean,
      "category": "categoria"
    }
  ]
}

=== SEÇÕES DO PDF A EXTRAIR ===
EXTRAIR APENAS da seção "Despesas da fatura" que lista transações por cartão:
- Cada cartão tem formato: "CARTÃO XXXX****XXXX" seguido de tabela com Data, Movimentação, Valor
- Extrair TODAS as transações de TODOS os cartões listados
- A soma dos "Total CARTÃO" deve bater com o "Total da sua fatura"

=== SEÇÕES A IGNORAR COMPLETAMENTE ===
1. "Precisa de uma força para pagar?" - opções de parcelamento da fatura (1+2, 1+3, etc.)
2. "Próxima fatura" - são parcelas FUTURAS, não desta fatura
3. "Encargos financeiros" - tabela de taxas informativas
4. "Limite de crédito" - informações de limite
5. Boleto e dados de pagamento

=== LINHAS A IGNORAR ===
- "Total CARTÃO XXXX" (são subtotais, não transações)
- "PAGTO DEBITO AUTOMATICO" com sinal + (é crédito/pagamento anterior)
- Linhas de resumo: "Despesas do mês", "Fatura atual", "Valor antecipado"

=== VALORES EM CENTAVOS ===
R$ 1.234,56 → 123456
R$ 45,90 → 4590

=== CATEGORIAS ===
Alimentação, Transporte, Saúde, Lazer, Compras, Educação, Casa, Vestuário, Beleza, Tecnologia, Serviços, Taxas e Encargos, Outros

=== VALIDAÇÃO ===
A soma de amountCents de todas as transações DEVE ser igual ao totalAmountCents (que é o "Total da sua fatura").

Retorne APENAS o JSON.`;

    // Call Anthropic API with native PDF support
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const contentBlock = response.content[0];
    if (contentBlock.type !== "text") {
      return {
        transactions: [],
        error: "Resposta inesperada da IA (tipo não é texto)",
      };
    }

    const content = contentBlock.text;
    if (!content) {
      return {
        transactions: [],
        error: "Resposta vazia da IA",
      };
    }

    // Clean possible markdown code blocks
    let cleanJson = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to repair truncated JSON by closing open brackets
    let extracted: AIExtractedInvoice;
    try {
      extracted = JSON.parse(cleanJson);
    } catch {
      // Try to repair truncated JSON
      logger.warn("JSON parse failed, attempting repair", {
        jsonLength: cleanJson.length,
        lastChars: cleanJson.slice(-100),
      });

      // Find the last complete transaction and close the JSON
      const lastCompleteTransaction = cleanJson.lastIndexOf("},");
      if (lastCompleteTransaction > 0) {
        cleanJson = cleanJson.slice(0, lastCompleteTransaction + 1) + "]}";
        try {
          extracted = JSON.parse(cleanJson);
          logger.info("JSON repair successful", {
            transactionCount: extracted.transactions?.length,
          });
        } catch {
          return {
            transactions: [],
            error: "Falha ao processar resposta da IA (JSON inválido)",
          };
        }
      } else {
        return {
          transactions: [],
          error: "Falha ao processar resposta da IA (JSON truncado)",
        };
      }
    }

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

    // Log raw AI response for debugging
    logger.info("Claude AI extracted raw response", {
      transactionCount: extracted.transactions.length,
      firstTransaction: extracted.transactions[0],
      totalAmountCents: extracted.totalAmountCents,
    });

    // Validate and filter transactions
    const validTransactions = extracted.transactions.filter((t) => {
      const amountReais = t.amountCents / 100;
      // Filter out invalid amounts (too small or too large)
      return amountReais >= 0.01 && amountReais <= 100000;
    });

    // Transform to our format - convert centavos to reais
    const transactions: TParsedTransaction[] = validTransactions.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amountCents / 100, // Convert centavos to reais
      installment: t.installment,
      is_international: t.isInternational || false,
      category: normalizeCategory(t.category),
    }));

    // Calculate total from converted values (soma das transações)
    const calculatedTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Get original invoice total from PDF header
    const originalInvoiceTotal = extracted.totalAmountCents
      ? extracted.totalAmountCents / 100
      : null;

    // Check for discrepancy between invoice total and sum of transactions
    if (originalInvoiceTotal !== null) {
      const difference = Math.abs(originalInvoiceTotal - calculatedTotal);
      const percentDiff = (difference / originalInvoiceTotal) * 100;

      if (percentDiff > 1) {
        // More than 1% difference
        logger.warn(
          "Discrepancy detected between invoice total and transactions sum",
          {
            originalInvoiceTotal,
            calculatedTotal,
            difference,
            percentDiff: `${percentDiff.toFixed(2)}%`,
            transactionCount: transactions.length,
            hint: "Possíveis causas: IOF, anuidade, juros ou taxas não extraídos",
          },
        );
      }
    }

    logger.info("Claude AI parsing completed", {
      transactionCount: transactions.length,
      calculatedTotal,
      originalInvoiceTotal,
      filteredOut: extracted.transactions.length - validTransactions.length,
    });

    // SEMPRE usar a soma das transações como total (não o valor do cabeçalho)
    // Isso garante consistência entre total_amount e as transações no banco
    return {
      transactions,
      period: extracted.period,
      cardLastDigits: extracted.cardLastDigits,
      totalAmount: calculatedTotal, // Usar soma das transações, não o cabeçalho
      dueDate: extracted.dueDate,
    };
  } catch (error) {
    logger.error("Error parsing invoice with Claude AI", error);
    return {
      transactions: [],
      error: `Erro ao processar fatura com IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}
