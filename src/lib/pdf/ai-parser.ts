import OpenAI from "openai";
import type { TParsedTransaction, TPdfParseResult } from "@/db/types";
import { env, hasOpenAI } from "@/lib/env";
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
 * Parse invoice using OpenAI GPT-4o-mini
 */
export async function parseInvoiceWithAI(
  text: string,
): Promise<TPdfParseResult> {
  try {
    // Validate API key
    if (!hasOpenAI()) {
      logger.warn("OPENAI_API_KEY not configured");
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
  "totalAmountCents": number (total da fatura em CENTAVOS),
  "cardLastDigits": "1234",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nome do estabelecimento limpo (sem parcelas, sem caracteres especiais desnecessários)",
      "amountCents": number (valor em CENTAVOS - número inteiro. Ex: R$ 1.234,56 = 123456, R$ 45,90 = 4590),
      "installment": "1/12" (se houver parcela, extrair no formato X/Y),
      "isInternational": boolean (true se transação internacional),
      "category": "categoria da transação"
    }
  ]
}

IMPORTANTE - VALORES EM CENTAVOS:
- Todos os valores monetários devem ser convertidos para CENTAVOS (inteiros)
- R$ 1.234,56 → 123456
- R$ 45,90 → 4590
- R$ 1.000,00 → 100000
- Isso evita confusão com separadores decimais brasileiros

CATEGORIAS VÁLIDAS (use exatamente estes nomes):
- "Alimentação" - restaurantes, lanchonetes, mercados, supermercados, padarias, delivery, iFood, Rappi
- "Transporte" - Uber, 99, táxi, combustível, gasolina, estacionamento, pedágio, postos
- "Saúde" - farmácias, drogarias, clínicas, hospitais, médicos, laboratórios
- "Lazer" - cinema, teatro, shows, streaming (Netflix, Spotify, Disney+), games, parques
- "Compras" - lojas, shopping, marketplaces (Amazon, Mercado Livre, Shopee, Shein)
- "Educação" - escolas, cursos, faculdades, livros, Udemy, Coursera, Alura
- "Casa" - água, luz, energia, gás, internet, condomínio, aluguel, telecom (Tim, Vivo, Claro)
- "Vestuário" - roupas, calçados, sapatos, tênis, acessórios, Nike, Adidas
- "Beleza" - salões, cabeleireiros, cosméticos, perfumes, O Boticário, Natura
- "Tecnologia" - eletrônicos, computadores, celulares, notebooks, KaBuM, Apple, Samsung
- "Serviços" - manutenção, consertos, assinaturas diversas
- "Outros" - quando não se encaixar em nenhuma categoria acima

REGRAS IMPORTANTES:
1. Datas sempre no formato ISO (YYYY-MM-DD)
2. Valores sempre como números decimais (ex: 123.45, não "123,45")
3. Ignorar linhas de cabeçalho, totais de seções, propagandas
4. Extrair APENAS transações reais (compras, pagamentos)
5. Se houver parcelas no formato "Parcela 01 de 12" ou "(1/12)", extrair como "1/12"
6. Limpar descrição: remover textos como "Parcela X de Y", manter apenas nome do estabelecimento
7. Não incluir linhas de "Total CARTÃO", "PAGTO DEBITO AUTOMATICO" com valor negativo ou positivo que sejam totalizadores
8. Para o período, usar o mês/ano de vencimento da fatura
9. SEMPRE categorizar cada transação - analise o nome do estabelecimento para determinar a categoria correta

Texto da fatura:
---
${text}
---

Retorne APENAS o JSON, sem markdown ou explicações.`;

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

    // Log raw AI response for debugging
    logger.info("AI extracted raw response", {
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
    const transactions: TParsedTransaction[] = validTransactions.map(
      (t) => ({
        date: t.date,
        description: t.description,
        amount: t.amountCents / 100, // Convert centavos to reais
        installment: t.installment,
        is_international: t.isInternational || false,
        category: normalizeCategory(t.category),
      }),
    );

    // Calculate total from converted values
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    logger.info("AI parsing completed", {
      transactionCount: transactions.length,
      totalAmount,
      filteredOut: extracted.transactions.length - validTransactions.length,
    });

    return {
      transactions,
      period: extracted.period,
      cardLastDigits: extracted.cardLastDigits,
      totalAmount: extracted.totalAmountCents
        ? extracted.totalAmountCents / 100
        : totalAmount,
    };
  } catch (error) {
    logger.error("Error parsing invoice with AI", error);
    return {
      transactions: [],
      error: `Erro ao processar fatura com IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}
