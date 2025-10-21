# Configuração OpenAI para Parser de Faturas

## ✨ Nova Feature: Parser com IA

O AnalytiXPay agora usa **OpenAI GPT-4o-mini** para extrair dados de faturas de cartão de crédito de forma inteligente e universal!

### Vantagens:
- ✅ **Funciona com QUALQUER banco** (Inter, Nubank, Itaú, Bradesco, etc.)
- ✅ **Sem manutenção** de padrões regex
- ✅ **Extração precisa** de transações, parcelas, valores
- ✅ **Custo baixíssimo**: ~$0.01-0.03 por fatura
- ✅ **Fallback automático** para regex se IA falhar

## 🔧 Como Configurar

### Passo 1: Criar Conta OpenAI

1. Acesse: https://platform.openai.com/signup
2. Crie uma conta (pode usar email ou Google)
3. Verifique seu email

### Passo 2: Adicionar Créditos

1. Acesse: https://platform.openai.com/settings/organization/billing/overview
2. Clique em **"Add payment method"**
3. Adicione seu cartão de crédito
4. Adicione créditos mínimos: **$5 dólares** (dura meses!)

💡 **Dica**: $5 é suficiente para processar ~200-300 faturas

### Passo 3: Gerar API Key

1. Acesse: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Dê um nome: `AnalytiXPay`
4. Copie a chave (começa com `sk-proj-...`)
5. ⚠️ **IMPORTANTE**: Salve em local seguro! Ela só aparece uma vez!

### Passo 4: Configurar no Projeto

Edite o arquivo `.env.local` na raiz do projeto e adicione:

```env
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Substitua pelo valor da sua chave copiada no Passo 3.

### Passo 5: Reiniciar Servidor

Se o servidor já estiver rodando, **reinicie-o**:

```bash
# Parar (Ctrl+C)
# Iniciar novamente
npm run dev
```

## 🧪 Testar

1. Acesse sua aplicação
2. Faça upload de uma fatura
3. No terminal, você verá:
   ```
   Attempting AI-based parsing...
   Calling OpenAI API for invoice parsing...
   OpenAI response received, parsing JSON...
   Successfully parsed 8 transactions via AI
   OpenAI usage: 3245 input + 421 output tokens
   Estimated cost: $0.0011
   ✓ AI parsing successful
   ```

## 💰 Custos Reais

### Modelo: GPT-4o-mini
- **Input**: $0.15 por 1M tokens
- **Output**: $0.60 por 1M tokens

### Exemplo real (fatura de 10 páginas):
- Tokens de entrada: ~3.500
- Tokens de saída: ~500
- **Custo por fatura**: ~$0.001 (um décimo de centavo!)

### Uso mensal estimado:
- 100 faturas/mês = **~$0.10-0.50 dólares/mês**
- 500 faturas/mês = **~$0.50-2.50 dólares/mês**

## 🔄 Fallback para Regex

Se a API Key não estiver configurada ou houver erro, o sistema automaticamente usa o parser regex como backup.

Para **desabilitar IA** e usar apenas regex, edite `src/actions/invoice.actions.ts`:

```typescript
const parseResult = await parsePdfFile(buffer, {
  useAI: false,  // Desabilitar IA
  fallbackToRegex: true
})
```

## 🔒 Segurança

- ✅ API Key **nunca** é exposta ao frontend
- ✅ Processamento **server-side** apenas
- ✅ Texto da fatura enviado para OpenAI (sem dados de login/senha)
- ✅ Números completos de cartão **não** são enviados (apenas últimos 4 dígitos)

## 📊 Monitorar Uso

Acompanhe seu uso e custos em:
https://platform.openai.com/usage

## ❓ Troubleshooting

### Erro: "OPENAI_API_KEY not configured"
- Verifique se adicionou a chave no `.env.local`
- Reinicie o servidor de desenvolvimento

### Erro: "Insufficient credits"
- Adicione mais créditos em: https://platform.openai.com/settings/organization/billing/overview

### Erro: "Rate limit exceeded"
- Você está fazendo muitas requisições. Aguarde 1 minuto e tente novamente
- Ou aumente seu limite em: https://platform.openai.com/settings/organization/limits

### Parser retorna 0 transações
- Verifique logs no terminal para ver se a IA está sendo chamada
- Se estiver usando fallback regex, veja `DEBUG_PDF_PARSER.md`

## 🚀 Próximos Passos

Após configurar, você pode:
- Fazer upload de faturas de **qualquer banco**
- Ver transações extraídas automaticamente
- Acompanhar custos no dashboard da OpenAI
- (Opcional) Implementar cache para reduzir custos

---

**Pronto!** 🎉 Agora seu sistema processa faturas de forma universal e inteligente!
