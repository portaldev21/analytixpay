import type { TParsedTransaction, TPdfParseResult } from "@/db/types";
import { logger } from "@/lib/logger";

/**
 * Categories and their keywords for auto-categorization
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Alimentação: [
    "restaurante",
    "lanchonete",
    "mercado",
    "supermercado",
    "padaria",
    "açougue",
    "hortifruti",
    "delivery",
    "ifood",
    "rappi",
    "uber eats",
    "pizza",
    "hamburger",
    "açai",
    "food",
  ],
  Transporte: [
    "uber",
    "taxi",
    "99",
    "combustivel",
    "gasolina",
    "etanol",
    "diesel",
    "estacionamento",
    "pedágio",
    "metrô",
    "ônibus",
    "posto",
    "shell",
    "ipiranga",
    "br petrobras",
  ],
  Saúde: [
    "farmácia",
    "drogaria",
    "clínica",
    "hospital",
    "médico",
    "dentista",
    "laboratório",
    "exame",
    "pague menos",
    "drogasil",
    "panvel",
    "ultrafarma",
  ],
  Lazer: [
    "cinema",
    "teatro",
    "show",
    "streaming",
    "netflix",
    "spotify",
    "youtube",
    "game",
    "parque",
    "ingresso",
    "prime video",
    "disney",
    "hbo",
  ],
  Compras: [
    "loja",
    "magazine",
    "shopping",
    "marketplace",
    "mercado livre",
    "amazon",
    "shopee",
    "aliexpress",
    "shein",
    "renner",
    "c&a",
    "zara",
  ],
  Educação: [
    "escola",
    "curso",
    "faculdade",
    "universidade",
    "livro",
    "material escolar",
    "udemy",
    "coursera",
    "alura",
    "hotmart",
    "eduzz",
  ],
  Casa: [
    "água",
    "luz",
    "energia",
    "gás",
    "internet",
    "condomínio",
    "aluguel",
    "iptu",
    "copel",
    "cemig",
    "enel",
    "sabesp",
    "tim",
    "vivo",
    "claro",
    "oi",
  ],
  Vestuário: [
    "roupa",
    "calçado",
    "sapato",
    "tênis",
    "bolsa",
    "acessório",
    "moda",
    "nike",
    "adidas",
    "puma",
  ],
  Beleza: [
    "salão",
    "cabeleireiro",
    "manicure",
    "spa",
    "cosméticos",
    "perfume",
    "maquiagem",
    "boticário",
    "natura",
    "avon",
    "eudora",
  ],
  Tecnologia: [
    "eletrônico",
    "computador",
    "celular",
    "smartphone",
    "notebook",
    "tablet",
    "acessório tech",
    "kabum",
    "pichau",
    "terabyte",
    "apple",
    "samsung",
    "dell",
  ],
  Serviços: [
    "manutenção",
    "conserto",
    "reparo",
    "serviço",
    "assinatura",
    "mensalidade",
    "netflix",
    "spotify",
  ],
};

/**
 * Convert Brazilian month names to numbers
 */
const MONTH_MAP: Record<string, string> = {
  jan: "01",
  janeiro: "01",
  fev: "02",
  fevereiro: "02",
  mar: "03",
  março: "03",
  abr: "04",
  abril: "04",
  mai: "05",
  maio: "05",
  jun: "06",
  junho: "06",
  jul: "07",
  julho: "07",
  ago: "08",
  agosto: "08",
  set: "09",
  setembro: "09",
  out: "10",
  outubro: "10",
  nov: "11",
  novembro: "11",
  dez: "12",
  dezembro: "12",
};

/**
 * Convert date formats like "29 de nov. 2024" to ISO format
 */
function convertBrazilianDate(dateStr: string): string | null {
  // Pattern: DD de MES. YYYY or DD de MES YYYY
  const match = dateStr.match(/(\d{1,2})\s+de\s+([a-z]+)\.?\s+(\d{4})/i);
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const monthName = match[2].toLowerCase().replace(".", "");
  const year = match[3];

  const month = MONTH_MAP[monthName];
  if (!month) return null;

  return `${year}-${month}-${day}`;
}

/**
 * Detect category based on description
 */
function detectCategory(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return "Outros";
}

/**
 * Extract transactions from PDF text
 * This is a simplified parser that works with common Brazilian credit card invoice formats
 */
export function parseTransactionsFromText(
  text: string,
  debug = false,
): TParsedTransaction[] {
  const transactions: TParsedTransaction[] = [];
  const lines = text.split("\n");

  if (debug) {
    logger.debug("PDF Text Debug", {
      totalLines: lines.length,
      firstLines: lines.slice(0, 20),
    });
  }

  // Common patterns for Brazilian credit card invoices (ordered by specificity)
  const patterns = [
    // Pattern 1: Banco Inter format - DD de MES. YYYY DESCRIPTION - R$ 1.234,56
    /(\d{1,2}\s+de\s+[a-z]+\.?\s+\d{4})\s+(.+?)\s+-\s+R\$\s*([\d.,]+)/gi,
    // Pattern 2: DD/MM/YYYY DESCRIPTION R$ 1.234,56
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d.,]+)/gi,
    // Pattern 3: DD/MM/YY DESCRIPTION R$ 1.234,56 (requires R$)
    /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+R\$\s*([\d.,]+)/gi,
    // Pattern 4: DD/MM DESCRIPTION R$ 1.234,56 (requires R$)
    /(\d{2}\/\d{2})\s+(.+?)\s+R\$\s*([\d.,]+)/gi,
  ];

  // Words that indicate a line is a total/header, not a transaction
  const excludePatterns = [
    /^total/i,
    /total\s*(cart[aã]o|fatura)/i,
    /pagto?\s+debito/i,
    /pagamento/i,
    /saldo\s+(anterior|atual)/i,
    /encargos/i,
    /juros/i,
    /limite\s+dispon[ií]vel/i,
    /cr[eé]dito/i,
    /valor\s+m[ií]nimo/i,
  ];

  for (const line of lines) {
    // Skip lines that look like totals or headers
    const shouldExclude = excludePatterns.some((pattern) =>
      pattern.test(line),
    );
    if (shouldExclude) {
      if (debug) {
        logger.debug("Skipping excluded line", { line: line.substring(0, 100) });
      }
      continue;
    }

    let foundMatch = false;

    for (const pattern of patterns) {
      if (foundMatch) break; // Stop after first pattern match per line

      const matches = [...line.matchAll(pattern)];

      for (const match of matches) {
        try {
          let dateStr = match[1];
          const description = match[2]?.trim() || "Sem descrição";
          const amountStr = match[3]?.trim() || "0";

          if (debug && match) {
            logger.debug("Match found", {
              date: dateStr,
              description,
              amountStr,
            });
          }

          // Skip if description or amount is invalid
          if (!description || description.length < 3) continue;
          if (!amountStr || amountStr === "0") continue;

          // Skip descriptions that look like totals
          const descLower = description.toLowerCase();
          if (
            descLower.includes("total") ||
            descLower.includes("pagamento") ||
            descLower.includes("saldo")
          ) {
            continue;
          }

          // Convert date to ISO format
          let isoDate: string;

          // Check if date is in Brazilian format (DD de MES YYYY)
          if (dateStr.includes(" de ")) {
            const converted = convertBrazilianDate(dateStr);
            if (!converted) continue;
            isoDate = converted;
          } else {
            // Handle DD/MM/YYYY, DD/MM, DD/MM/YY formats
            if (dateStr.length === 5) {
              // DD/MM
              const currentYear = new Date().getFullYear();
              dateStr = `${dateStr}/${currentYear}`;
            }

            const [day, month, year] = dateStr.split("/");
            const fullYear = year.length === 2 ? `20${year}` : year;
            isoDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }

          // Parse amount (Brazilian format: 1.234,56)
          const amount = parseFloat(
            amountStr
              .replace(/\./g, "") // Remove thousands separator
              .replace(",", "."), // Replace decimal separator
          );

          // Validate amount: must be positive and reasonable (R$ 0.01 - R$ 100,000)
          if (isNaN(amount) || amount < 0.01 || amount > 100000) continue;

          // Detect installment (e.g., "PARC 01/12", "1/6")
          const installmentMatch = description.match(/(\d+)\/(\d+)/i);
          const installment = installmentMatch
            ? `${installmentMatch[1]}/${installmentMatch[2]}`
            : undefined;

          // Detect international transaction
          const isInternational = /internacional|usd|eur|gbp|foreign/i.test(
            description,
          );

          // Detect category
          const category = detectCategory(description);

          transactions.push({
            date: isoDate,
            description,
            amount,
            category,
            installment,
            is_international: isInternational,
          });

          foundMatch = true; // Mark that we found a match for this line
        } catch {
          // Skip malformed lines silently
          continue;
        }
      }
    }
  }

  return transactions;
}

/**
 * Extract period from PDF text (e.g., "Fatura de Setembro/2025", "09/2025")
 */
export function extractPeriod(text: string): string | undefined {
  const patterns = [
    // Pattern: Setembro/2025, setembro/2025
    /(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/\d{4}/i,
    // Pattern: 09/2025
    /\b(\d{2})\/(\d{4})\b/,
    // Pattern: Set/2025
    /(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const period = match[0];

      // Convert month name to number if needed
      if (/^[a-z]/i.test(period)) {
        const monthMap: Record<string, string> = {
          janeiro: "01",
          fevereiro: "02",
          março: "03",
          abril: "04",
          maio: "05",
          junho: "06",
          julho: "07",
          agosto: "08",
          setembro: "09",
          outubro: "10",
          novembro: "11",
          dezembro: "12",
          jan: "01",
          fev: "02",
          mar: "03",
          abr: "04",
          mai: "05",
          jun: "06",
          jul: "07",
          ago: "08",
          set: "09",
          out: "10",
          nov: "11",
          dez: "12",
        };

        for (const [name, num] of Object.entries(monthMap)) {
          if (period.toLowerCase().startsWith(name)) {
            const year = period.match(/\d{4}/)?.[0];
            return `${num}/${year}`;
          }
        }
      }

      return period;
    }
  }

  return undefined;
}

/**
 * Extract card last 4 digits from text
 */
export function extractCardLastDigits(text: string): string | undefined {
  const patterns = [
    // Pattern: "Cartão **** 1234"
    /cart[aã]o\s+\*+\s*(\d{4})/i,
    // Pattern: "Final 1234"
    /final\s+(\d{4})/i,
    // Pattern: "**** 1234"
    /\*{4}\s*(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Calculate total amount from transactions
 */
export function calculateTotalAmount(
  transactions: TParsedTransaction[],
): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Main parser function - to be used in Server Actions
 * Uses pdf2json library with zero dependencies
 * Supports AI-based parsing with regex fallback
 */
export async function parsePdfFile(
  file: ArrayBuffer,
  options: { debug?: boolean; useAI?: boolean; fallbackToRegex?: boolean } = {},
): Promise<TPdfParseResult> {
  const { debug = false, useAI = true, fallbackToRegex = true } = options;

  try {
    // Dynamic import - pdf2json has zero dependencies (default export)
    const PDFParser = (await import("pdf2json")).default;

    // Create parser instance (null context, true for raw text)
    const pdfParser = new PDFParser(null, true);

    // Parse PDF using promise wrapper
    const text = await new Promise<string>((resolve, reject) => {
      // Handle parsing completion
      pdfParser.on("pdfParser_dataReady", () => {
        try {
          const rawText = pdfParser.getRawTextContent();
          resolve(rawText);
        } catch (err) {
          reject(err);
        }
      });

      // Handle parsing errors
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError || new Error("PDF parsing failed"));
      });

      // Start parsing
      pdfParser.parseBuffer(Buffer.from(file));
    });

    if (debug) {
      logger.debug("Raw PDF text", {
        textLength: text.length,
        preview: text.substring(0, 500),
      });
    }

    if (!text || text.length < 50) {
      return {
        transactions: [],
        error: "PDF vazio ou inválido",
      };
    }

    // Clean up PDF parser resources
    pdfParser.destroy();

    // Try AI parsing first if enabled
    if (useAI) {
      const { parseInvoiceWithAI } = await import("./ai-parser");
      const aiResult = await parseInvoiceWithAI(text);

      // If AI parsing succeeded, return result
      if (aiResult.transactions.length > 0) {
        return aiResult;
      }

      // If AI failed and no fallback, return AI error
      if (!fallbackToRegex) {
        return aiResult;
      }

      logger.debug("AI parsing failed, falling back to regex");
    }

    // Fallback to regex parsing
    const transactions = parseTransactionsFromText(text, debug);

    if (transactions.length === 0) {
      return {
        transactions: [],
        error:
          "Nenhuma transação encontrada no PDF. Verifique se o formato é suportado.",
      };
    }

    const period = extractPeriod(text);
    const cardLastDigits = extractCardLastDigits(text);
    const totalAmount = calculateTotalAmount(transactions);

    return {
      transactions,
      period,
      cardLastDigits,
      totalAmount,
    };
  } catch (error) {
    logger.error("Error parsing PDF", error);
    return {
      transactions: [],
      error: `Erro ao processar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
  }
}
