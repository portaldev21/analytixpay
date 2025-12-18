# Planejamento: Parser de Fatura com IA

> **STATUS: ✅ IMPLEMENTADO** - Este planejamento foi concluído em 2025-12. O parser agora usa **Anthropic Claude Haiku** com suporte nativo a PDF.

## Objetivo
Substituir o parser baseado em regex por um parser baseado em IA (Anthropic Claude) que seja capaz de extrair dados de qualquer formato de fatura de cartão de crédito.

## Vantagens da Abordagem com IA

1. **Flexibilidade Total**: Funciona com qualquer banco (Inter, Nubank, Itaú, Bradesco, etc.)
2. **Sem Manutenção de Regex**: Não precisa criar padrões para cada formato
3. **Extração Inteligente**: IA entende contexto e variações
4. **Dados Estruturados**: JSON padronizado independente da fonte
5. **Campos Extras**: Pode extrair informações adicionais (taxas, parcelamentos, etc.)

## Arquitetura Implementada

```
PDF → Claude API (suporte nativo PDF base64) → JSON Estruturado → Database
```

> **Nota**: O Claude recebe o PDF diretamente como documento base64, sem necessidade de extrair texto primeiro. Isso melhora significativamente a precisão da extração.

## Schema JSON para Extração

```typescript
interface IAIExtractedInvoice {
  period: string // "MM/YYYY"
  dueDate: string // "YYYY-MM-DD"
  totalAmount: number
  cardLastDigits?: string
  transactions: {
    date: string // "YYYY-MM-DD"
    description: string
    amount: number
    installment?: string // "1/12"
    isInternational?: boolean
    category?: string // Deixar IA sugerir
  }[]
  metadata?: {
    bankName?: string
    minimumPayment?: number
    availableLimit?: number
  }
}
```

## API Escolhida: Anthropic Claude Haiku

### Implementação Final: Claude Haiku 4.5
- **Modelo**: `claude-haiku-4-5-20251001`
- **Custo**: ~$0.80 por 1M tokens de entrada, ~$4.00 por 1M tokens de saída
- **Performance**: Excelente com suporte nativo a PDF
- **Custo estimado por fatura**: ~$0.01-0.03

### Vantagens do Claude vs OpenAI:
- **Suporte nativo a PDF**: Não precisa extrair texto primeiro
- **Melhor precisão**: Claude "vê" o PDF visualmente
- **Menos erros**: Não perde dados em PDFs complexos com tabelas

## Implementação

### 1. Environment Variables
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Função de Parser (Implementada)
```typescript
// src/lib/pdf/ai-parser.ts
export async function parseInvoiceWithAI(pdfBuffer: ArrayBuffer): Promise<TPdfParseResult>
```

> O parser recebe o buffer do PDF diretamente e envia como documento base64 para o Claude.

### 3. Prompt Engineering
```
Você é um assistente especializado em extrair dados de faturas de cartão de crédito brasileiras.

Extraia as seguintes informações do texto abaixo e retorne APENAS um JSON válido:

{
  "period": "MM/YYYY",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": number,
  "cardLastDigits": "1234",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Nome do estabelecimento",
      "amount": number (sempre positivo),
      "installment": "1/12" (se aplicável),
      "isInternational": boolean
    }
  ]
}

Regras:
- Datas no formato ISO (YYYY-MM-DD)
- Valores sempre como números (sem R$, sem pontos/vírgulas)
- Ignorar linhas de cabeçalho, totais, propagandas
- Extrair APENAS transações reais
- Se houver parcelas, indicar no campo installment

Texto da fatura:
---
${text}
---
```

### 4. Integração no Fluxo (Implementada)

```typescript
// src/lib/pdf/parser.ts
if (useAI && hasAnthropic()) {
  const { parseInvoiceWithAI } = await import("./ai-parser");
  const aiResult = await parseInvoiceWithAI(file); // buffer direto para Claude
  if (aiResult.transactions.length > 0) {
    return aiResult;
  }
}
// Fallback para regex se IA falhar
```

## Custos Reais (Anthropic Claude Haiku)

### Cenário de Uso Mensal
- 100 faturas/mês
- 10-15 páginas média
- ~5.000 tokens entrada + ~2.000 tokens saída por fatura
- **Custo total: $1-2/mês** (Claude Haiku)

### Comparação
- **Sem IA**: Manutenção constante de regex, bugs, formatos não suportados
- **Com IA (Claude)**: Funciona com todos os bancos, sem manutenção, custo mínimo, precisão superior

## Fases de Implementação

### Fase 1: Protótipo ✅ CONCLUÍDO
- [x] Criar função `parseInvoiceWithAI()`
- [x] Integrar Anthropic Claude API
- [x] Testar com fatura do Banco Inter
- [x] Validar JSON de saída

### Fase 2: Produção ✅ CONCLUÍDO
- [x] Adicionar error handling robusto
- [x] Implementar JSON repair para respostas truncadas
- [x] Adicionar logging estruturado
- [x] Migrar recategorização para Claude

### Fase 3: Otimização (em andamento)
- [x] Implementar cache de resultados (`src/lib/pdf/cache.ts`)
- [ ] Adicionar validação de confiança
- [x] Hybrid approach (AI first, regex fallback)
- [ ] Dashboard de custos

## Segurança

- ✅ Faturas processadas server-side (Next.js Server Actions)
- ✅ PDF enviado para Anthropic Claude (sem dados sensíveis do usuário)
- ✅ Não armazenar texto da fatura no banco (apenas metadados)
- ⚠️ Considerar: Remover números de cartão completos antes de enviar para IA

## Alternativas Open Source (Futuro)

- **Llama 3.1 70B** (self-hosted via Groq/Together)
- **Mistral Large** (API mais barata)
- **Open source OCR + fine-tuned model** (sem custo recorrente)

## Decisão Final

**Implementado**: Anthropic Claude Haiku com suporte nativo a PDF e fallback para regex.

**Arquivos principais**:
- `src/lib/pdf/ai-parser.ts` - Parser com Claude
- `src/lib/pdf/parser.ts` - Orchestrador com fallback
- `src/lib/env.ts` - Validação de ANTHROPIC_API_KEY

**Documentação**: Ver `docs/setup/ANTHROPIC_SETUP.md` para configuração.
