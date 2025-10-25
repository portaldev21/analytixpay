# Planejamento: Parser de Fatura com IA

## Objetivo
Substituir o parser baseado em regex por um parser baseado em IA (OpenAI/Anthropic) que seja capaz de extrair dados de qualquer formato de fatura de cartão de crédito.

## Vantagens da Abordagem com IA

1. **Flexibilidade Total**: Funciona com qualquer banco (Inter, Nubank, Itaú, Bradesco, etc.)
2. **Sem Manutenção de Regex**: Não precisa criar padrões para cada formato
3. **Extração Inteligente**: IA entende contexto e variações
4. **Dados Estruturados**: JSON padronizado independente da fonte
5. **Campos Extras**: Pode extrair informações adicionais (taxas, parcelamentos, etc.)

## Arquitetura Proposta

```
PDF → Texto (pdf2json) → IA (OpenAI/Anthropic) → JSON Estruturado → Database
```

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

## Opções de API

### Opção 1: OpenAI (gpt-4o-mini)
- **Custo**: ~$0.15 por 1M tokens de entrada, ~$0.60 por 1M tokens de saída
- **Performance**: Rápido e preciso
- **Custo estimado por fatura**: ~$0.01-0.03 (faturas de 10-20 páginas)

### Opção 2: Anthropic Claude (claude-3-haiku)
- **Custo**: ~$0.25 por 1M tokens de entrada, ~$1.25 por 1M tokens de saída
- **Performance**: Muito bom com documentos longos
- **Custo estimado por fatura**: ~$0.02-0.05

### Opção 3: Hybrid (Regex + IA)
- Tentar regex primeiro (grátis, rápido)
- Se falhar ou baixa confiança → usar IA
- Melhor custo-benefício

## Implementação

### 1. Environment Variables
```env
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Nova Função de Parser
```typescript
// src/lib/pdf/ai-parser.ts
export async function parseInvoiceWithAI(text: string): Promise<TPdfParseResult>
```

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

### 4. Integração no Fluxo Existente

```typescript
// src/actions/invoice.actions.ts
const parseResult = await parseInvoiceWithAI(buffer, {
  useAI: true,  // Flag para habilitar IA
  fallbackToRegex: true  // Fallback se IA falhar
})
```

## Custos Estimados

### Cenário de Uso Mensal
- 100 faturas/mês
- 15 páginas média
- ~10.000 tokens por fatura
- **Custo total: $1-3/mês** (OpenAI gpt-4o-mini)

### Comparação
- **Sem IA**: Manutenção constante de regex, bugs, formatos não suportados
- **Com IA**: Funciona com todos os bancos, sem manutenção, custo mínimo

## Fases de Implementação

### Fase 1: Protótipo (1-2 horas)
- [ ] Criar função `parseInvoiceWithAI()`
- [ ] Integrar OpenAI API
- [ ] Testar com fatura do Banco Inter
- [ ] Validar JSON de saída

### Fase 2: Produção (2-3 horas)
- [ ] Adicionar error handling robusto
- [ ] Implementar retry logic
- [ ] Adicionar logs de custo
- [ ] Criar testes unitários

### Fase 3: Otimização (opcional)
- [ ] Implementar cache de resultados
- [ ] Adicionar validação de confiança
- [ ] Hybrid approach (regex first, AI fallback)
- [ ] Dashboard de custos

## Segurança

- ✅ Faturas processadas server-side (Next.js Server Actions)
- ✅ Texto enviado para OpenAI (sem dados sensíveis do usuário)
- ✅ Não armazenar texto da fatura no banco (apenas metadados)
- ⚠️ Considerar: Remover números de cartão completos antes de enviar para IA

## Alternativas Open Source (Futuro)

- **Llama 3.1 70B** (self-hosted via Groq/Together)
- **Mistral Large** (API mais barata)
- **Open source OCR + fine-tuned model** (sem custo recorrente)

## Decisão

**Recomendação**: Implementar OpenAI gpt-4o-mini com fallback para regex.

**Próximo passo**: Você autoriza criar a integração com OpenAI?
