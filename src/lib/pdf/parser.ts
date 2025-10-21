import type { TParsedTransaction, TPdfParseResult } from '@/db/types'

/**
 * Categories and their keywords for auto-categorization
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['restaurante', 'lanchonete', 'mercado', 'supermercado', 'padaria', 'açougue', 'hortifruti', 'delivery', 'ifood', 'rappi', 'uber eats', 'pizza', 'hamburger', 'açai', 'food'],
  'Transporte': ['uber', 'taxi', '99', 'combustivel', 'gasolina', 'etanol', 'diesel', 'estacionamento', 'pedágio', 'metrô', 'ônibus', 'posto', 'shell', 'ipiranga', 'br petrobras'],
  'Saúde': ['farmácia', 'drogaria', 'clínica', 'hospital', 'médico', 'dentista', 'laboratório', 'exame', 'pague menos', 'drogasil', 'panvel', 'ultrafarma'],
  'Lazer': ['cinema', 'teatro', 'show', 'streaming', 'netflix', 'spotify', 'youtube', 'game', 'parque', 'ingresso', 'prime video', 'disney', 'hbo'],
  'Compras': ['loja', 'magazine', 'shopping', 'marketplace', 'mercado livre', 'amazon', 'shopee', 'aliexpress', 'shein', 'renner', 'c&a', 'zara'],
  'Educação': ['escola', 'curso', 'faculdade', 'universidade', 'livro', 'material escolar', 'udemy', 'coursera', 'alura', 'hotmart', 'eduzz'],
  'Casa': ['água', 'luz', 'energia', 'gás', 'internet', 'condomínio', 'aluguel', 'iptu', 'copel', 'cemig', 'enel', 'sabesp', 'tim', 'vivo', 'claro', 'oi'],
  'Vestuário': ['roupa', 'calçado', 'sapato', 'tênis', 'bolsa', 'acessório', 'moda', 'nike', 'adidas', 'puma'],
  'Beleza': ['salão', 'cabeleireiro', 'manicure', 'spa', 'cosméticos', 'perfume', 'maquiagem', 'boticário', 'natura', 'avon', 'eudora'],
  'Tecnologia': ['eletrônico', 'computador', 'celular', 'smartphone', 'notebook', 'tablet', 'acessório tech', 'kabum', 'pichau', 'terabyte', 'apple', 'samsung', 'dell'],
  'Serviços': ['manutenção', 'conserto', 'reparo', 'serviço', 'assinatura', 'mensalidade', 'netflix', 'spotify'],
}

/**
 * Detect category based on description
 */
function detectCategory(description: string): string {
  const lowerDesc = description.toLowerCase()

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }

  return 'Outros'
}

/**
 * Extract transactions from PDF text
 * This is a simplified parser that works with common Brazilian credit card invoice formats
 */
export function parseTransactionsFromText(text: string): TParsedTransaction[] {
  const transactions: TParsedTransaction[] = []
  const lines = text.split('\n')

  // Common patterns for Brazilian credit card invoices
  const patterns = [
    // Pattern 1: DD/MM/YYYY DESCRIPTION R$ 1.234,56
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d.,]+)/gi,
    // Pattern 2: DD/MM DESCRIPTION 1.234,56
    /(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)/gi,
    // Pattern 3: DD/MM/YY DESCRIPTION $ 1.234,56
    /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+\$?\s*([\d.,]+)/gi,
  ]

  for (const line of lines) {
    for (const pattern of patterns) {
      const matches = [...line.matchAll(pattern)]

      for (const match of matches) {
        try {
          let date = match[1]
          const description = match[2]?.trim() || 'Sem descrição'
          const amountStr = match[3]?.trim() || '0'

          // Skip if description or amount is invalid
          if (!description || description.length < 3) continue
          if (!amountStr || amountStr === '0') continue

          // Convert date to ISO format
          if (date.length === 5) { // DD/MM
            const currentYear = new Date().getFullYear()
            date = `${date}/${currentYear}`
          }

          const [day, month, year] = date.split('/')
          const fullYear = year.length === 2 ? `20${year}` : year
          const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

          // Parse amount (Brazilian format: 1.234,56)
          const amount = parseFloat(
            amountStr
              .replace(/\./g, '') // Remove thousands separator
              .replace(',', '.') // Replace decimal separator
          )

          if (isNaN(amount) || amount <= 0) continue

          // Detect installment (e.g., "PARC 01/12", "1/6")
          const installmentMatch = description.match(/(\d+)\/(\d+)/i)
          const installment = installmentMatch ? `${installmentMatch[1]}/${installmentMatch[2]}` : undefined

          // Detect international transaction
          const isInternational = /internacional|usd|eur|gbp|foreign/i.test(description)

          // Detect category
          const category = detectCategory(description)

          transactions.push({
            date: isoDate,
            description,
            amount,
            category,
            installment,
            is_international: isInternational,
          })
        } catch (error) {
          console.error('Error parsing line:', line, error)
          continue
        }
      }
    }
  }

  return transactions
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
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const period = match[0]

      // Convert month name to number if needed
      if (/^[a-z]/i.test(period)) {
        const monthMap: Record<string, string> = {
          janeiro: '01', fevereiro: '02', março: '03', abril: '04',
          maio: '05', junho: '06', julho: '07', agosto: '08',
          setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
          jan: '01', fev: '02', mar: '03', abr: '04',
          mai: '05', jun: '06', jul: '07', ago: '08',
          set: '09', out: '10', nov: '11', dez: '12',
        }

        for (const [name, num] of Object.entries(monthMap)) {
          if (period.toLowerCase().startsWith(name)) {
            const year = period.match(/\d{4}/)?.[0]
            return `${num}/${year}`
          }
        }
      }

      return period
    }
  }

  return undefined
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
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return undefined
}

/**
 * Calculate total amount from transactions
 */
export function calculateTotalAmount(transactions: TParsedTransaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}

/**
 * Main parser function - to be used in Server Actions
 * Note: pdf-parse must be imported dynamically in Server Actions due to Node.js dependencies
 */
export async function parsePdfFile(file: ArrayBuffer): Promise<TPdfParseResult> {
  try {
    // Dynamic import - CommonJS module
    const pdfParse = require('pdf-parse').default || require('pdf-parse')

    const data = await pdfParse(Buffer.from(file))
    const text = data.text

    if (!text || text.length < 50) {
      return {
        transactions: [],
        error: 'PDF vazio ou inválido'
      }
    }

    const transactions = parseTransactionsFromText(text)

    if (transactions.length === 0) {
      return {
        transactions: [],
        error: 'Nenhuma transação encontrada no PDF. Verifique se o formato é suportado.'
      }
    }

    const period = extractPeriod(text)
    const cardLastDigits = extractCardLastDigits(text)
    const totalAmount = calculateTotalAmount(transactions)

    return {
      transactions,
      period,
      cardLastDigits,
      totalAmount,
    }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return {
      transactions: [],
      error: `Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}
