# Configuracao Anthropic Claude para Parser de Faturas

## Nova Feature: Parser com Claude AI

O AnalytiXPay usa **Anthropic Claude Haiku** com suporte nativo a PDF para extrair dados de faturas de cartao de credito de forma inteligente!

### Vantagens:
- **Processamento nativo de PDF** - Claude "ve" o PDF visualmente, sem extracao de texto
- **Funciona com QUALQUER banco** (Inter, Nubank, Itau, Bradesco, etc.)
- **Sem manutencao** de padroes regex
- **Extracao precisa** de transacoes, parcelas, valores
- **Custo baixissimo**: ~$0.01-0.03 por fatura
- **Fallback automatico** para regex se IA falhar

## Como Configurar

### Passo 1: Criar Conta Anthropic

1. Acesse: https://console.anthropic.com/
2. Crie uma conta (pode usar email ou Google)
3. Verifique seu email

### Passo 2: Adicionar Creditos

1. Acesse: https://console.anthropic.com/settings/billing
2. Clique em **"Add payment method"**
3. Adicione seu cartao de credito
4. Adicione creditos minimos: **$5 dolares** (dura meses!)

**Dica**: $5 e suficiente para processar ~200-300 faturas

### Passo 3: Gerar API Key

1. Acesse: https://console.anthropic.com/settings/keys
2. Clique em **"Create Key"**
3. De um nome: `AnalytiXPay`
4. Copie a chave (comeca com `sk-ant-...`)
5. **IMPORTANTE**: Salve em local seguro! Ela so aparece uma vez!

### Passo 4: Configurar no Projeto

Edite o arquivo `.env.local` na raiz do projeto e adicione:

```env
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Substitua pelo valor da sua chave copiada no Passo 3.

### Passo 5: Reiniciar Servidor

Se o servidor ja estiver rodando, **reinicie-o**:

```bash
# Parar (Ctrl+C)
# Iniciar novamente
npm run dev
```

## Testar

1. Acesse sua aplicacao
2. Faca upload de uma fatura
3. No terminal, voce vera:
   ```
   Claude AI extracted raw response { transactionCount: 45, ... }
   Claude AI parsing completed { transactionCount: 45, calculatedTotal: 10215.79 }
   ```

## Custos Reais

### Modelo: Claude Haiku 4.5
- **Input**: $0.80 por 1M tokens
- **Output**: $4.00 por 1M tokens

### Exemplo real (fatura de 10 paginas):
- Tokens de entrada: ~5.000
- Tokens de saida: ~2.000
- **Custo por fatura**: ~$0.01-0.02

### Uso mensal estimado:
- 100 faturas/mes = **~$1-2 dolares/mes**
- 500 faturas/mes = **~$5-10 dolares/mes**

## Fallback para Regex

Se a API Key nao estiver configurada ou houver erro, o sistema automaticamente usa o parser regex como backup.

Para **desabilitar IA** e usar apenas regex, edite `src/actions/invoice.actions.ts`:

```typescript
const parseResult = await parsePdfFile(buffer, {
  useAI: false,  // Desabilitar IA
  fallbackToRegex: true
})
```

## Seguranca

- API Key **nunca** e exposta ao frontend
- Processamento **server-side** apenas
- PDF enviado como base64 para Claude (sem dados de login/senha)
- Numeros completos de cartao **nao** sao extraidos (apenas ultimos 4 digitos)

## Monitorar Uso

Acompanhe seu uso e custos em:
https://console.anthropic.com/settings/usage

## Troubleshooting

### Erro: "ANTHROPIC_API_KEY not configured"
- Verifique se adicionou a chave no `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Insufficient credits"
- Adicione mais creditos em: https://console.anthropic.com/settings/billing

### Erro: "Rate limit exceeded"
- Voce esta fazendo muitas requisicoes. Aguarde 1 minuto e tente novamente

### JSON truncado / Parser retorna erro
- Faturas muito grandes podem exceder o limite de tokens
- O sistema tenta reparar JSON truncado automaticamente
- Se persistir, verifique os logs para diagnostico

### Parser retorna 0 transacoes
- Verifique logs no terminal para ver se a IA esta sendo chamada
- Se estiver usando fallback regex, o formato do PDF pode nao ser suportado

## Proximos Passos

Apos configurar, voce pode:
- Fazer upload de faturas de **qualquer banco**
- Ver transacoes extraidas automaticamente
- Acompanhar custos no console da Anthropic
- Recategorizar transacoes com IA (Settings > Recategorizar)

---

**Pronto!** Agora seu sistema processa faturas de forma universal e inteligente com Claude AI!
