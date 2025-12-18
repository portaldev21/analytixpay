import type { TFinancialContext } from "@/db/types";

/**
 * Suggested questions for the financial agent
 */
export const SUGGESTED_QUESTIONS = [
  "Quanto gastei este mes?",
  "Qual categoria tem mais gastos?",
  "Compare com o mes passado",
  "Onde posso economizar?",
  "Quais sao minhas assinaturas?",
  "Como esta minha saude financeira?",
  "Qual meu maior gasto recente?",
  "Tenho gastos internacionais?",
];

/**
 * Build system prompt with financial context
 */
export function buildSystemPrompt(context: TFinancialContext): string {
  const categoryBreakdown = context.categoryBreakdown
    .map(
      (c) =>
        `- ${c.category}: R$ ${c.total.toFixed(2)} (${c.percentage.toFixed(1)}%)`,
    )
    .join("\n");

  const topExpenses = context.topExpenses
    .slice(0, 5)
    .map(
      (t, i) =>
        `${i + 1}. ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category}) - ${t.date}`,
    )
    .join("\n");

  const recurring =
    context.recurring.length > 0
      ? context.recurring
          .map(
            (r) =>
              `- ${r.description}: R$ ${r.amount.toFixed(2)}/${r.frequency}`,
          )
          .join("\n")
      : "Nenhuma recorrencia detectada ainda.";

  const changeIndicator = context.comparison.percentageChange >= 0 ? "+" : "";
  const changeDescription =
    context.comparison.percentageChange >= 0 ? "aumento" : "reducao";

  return `Voce e um assistente financeiro especializado em analise de gastos de cartao de credito brasileiro.
Seu nome e AnalytiX, o assistente financeiro inteligente do AnalytiXPay.

=== CONTEXTO FINANCEIRO DO USUARIO ===

PERIODO ANALISADO:
- De: ${context.period.startDate}
- Ate: ${context.period.endDate}

RESUMO GERAL:
- Total gasto: R$ ${context.stats.totalSpent.toFixed(2)}
- Numero de transacoes: ${context.stats.transactionCount}
- Media por transacao: R$ ${context.stats.averageTransaction.toFixed(2)}
- Media diaria: R$ ${context.stats.dailyAverage.toFixed(2)}

COMPARACAO COM PERIODO ANTERIOR:
- Periodo anterior: R$ ${context.comparison.previousPeriodTotal.toFixed(2)}
- Variacao: ${changeIndicator}${context.comparison.percentageChange.toFixed(1)}% (${changeDescription})

DISTRIBUICAO POR CATEGORIA:
${categoryBreakdown}

TOP 5 MAIORES GASTOS:
${topExpenses}

GASTOS RECORRENTES DETECTADOS:
${recurring}

SAUDE FINANCEIRA:
- Score: ${context.healthScore.score}/100
- Nota: ${context.healthScore.grade}
- Recomendacoes:
${context.healthScore.recommendations.map((r) => `  * ${r}`).join("\n")}

=== INSTRUCOES ===

1. Responda SEMPRE em portugues brasileiro
2. Use os dados acima para responder perguntas sobre gastos
3. Seja conciso e objetivo - respostas curtas e diretas
4. Formate valores monetarios em R$ com 2 casas decimais
5. Use emojis com moderacao para tornar as respostas mais amigaveis
6. Quando apropriado, sugira dicas de economia baseadas nos dados
7. Se nao tiver informacao suficiente, diga claramente
8. Nunca invente dados - use apenas o contexto fornecido
9. Para perguntas fora do escopo financeiro, redirecione educadamente
10. Considere que valores podem ter virgula como separador decimal (formato BR)

=== ESTILO DE RESPOSTA ===

- Mantenha um tom profissional mas acessivel
- Use listas quando apropriado para melhor legibilidade
- Destaque informacoes importantes com negrito usando **texto**
- Para comparacoes, use indicadores visuais como 📈 (alta) e 📉 (baixa)
- Termine respostas sobre gastos com uma dica pratica quando relevante`;
}

/**
 * Build a concise context summary for smaller prompts
 */
export function buildContextSummary(context: TFinancialContext): string {
  return `Periodo: ${context.period.startDate} a ${context.period.endDate}
Total: R$ ${context.stats.totalSpent.toFixed(2)} (${context.stats.transactionCount} transacoes)
Vs anterior: ${context.comparison.percentageChange >= 0 ? "+" : ""}${context.comparison.percentageChange.toFixed(1)}%
Score: ${context.healthScore.score}/100 (${context.healthScore.grade})
Top categoria: ${context.categoryBreakdown[0]?.category || "N/A"} (${context.categoryBreakdown[0]?.percentage?.toFixed(1) || 0}%)`;
}
