# Guia de Debug do Parser de PDF

## O que foi adicionado

Adicionei logs de debug detalhados no parser de PDF para ajudar a identificar onde está o problema no processamento da fatura.

## Como usar

### 1. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

### 2. Faça upload da fatura novamente

Acesse a aplicação e faça upload da fatura problemática.

### 3. Verifique os logs no terminal

No terminal onde o servidor está rodando, você verá logs detalhados como:

```
Starting PDF parse with debug enabled...
=== RAW PDF TEXT ===
Text length: 12543
First 500 chars: [primeiros 500 caracteres do PDF]
====================
Debug file saved to: c:\newProjects\analytixpay\debug\pdf-debug-1234567890.txt
=== PDF TEXT DEBUG ===
Total lines: 234
First 20 lines:
1: Linha 1 do PDF
2: Linha 2 do PDF
...
=====================
Parse result: {
  transactionsFound: 0,
  period: undefined,
  cardLastDigits: undefined,
  totalAmount: 0,
  error: 'Nenhuma transação encontrada...'
}
```

### 4. Analise o arquivo de debug

Um arquivo de texto será criado em `c:\newProjects\analytixpay\debug\pdf-debug-TIMESTAMP.txt` contendo todo o texto extraído do PDF.

**Abra esse arquivo e verifique:**

- O texto está sendo extraído corretamente?
- As datas estão no formato esperado (DD/MM/YYYY, DD/MM ou DD/MM/YY)?
- As descrições das transações estão presentes?
- Os valores estão no formato brasileiro (R$ 1.234,56)?

### 5. Compartilhe as informações

Com base nos logs e no arquivo de debug, você pode:

1. **Me enviar uma amostra do texto extraído** (primeiras 50 linhas do arquivo debug)
2. **Descrever o formato real da fatura** (como as linhas de transação aparecem)
3. **Enviar um exemplo de linha de transação** do PDF

## Exemplos de formatos esperados

O parser atual espera um destes formatos:

### Formato 1: Data completa com R$
```
15/10/2024 RESTAURANTE XYZ R$ 123,45
```

### Formato 2: Data curta sem símbolo
```
15/10 MERCADO ABC 234,56
```

### Formato 3: Data com ano curto
```
15/10/24 UBER VIAGEM $ 45,00
```

## Regex patterns usados

```javascript
// Pattern 1: DD/MM/YYYY DESCRIPTION R$ 1.234,56
/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d.,]+)/gi

// Pattern 2: DD/MM DESCRIPTION 1.234,56
/(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)/gi

// Pattern 3: DD/MM/YY DESCRIPTION $ 1.234,56
/(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+\$?\s*([\d.,]+)/gi
```

## Próximos passos

Após análise do arquivo de debug, podemos:

1. **Ajustar os padrões regex** se o formato da fatura for diferente
2. **Adicionar novos padrões** para suportar o formato específico do seu banco
3. **Melhorar a extração de texto** se houver problemas na conversão PDF → texto
4. **Adicionar pré-processamento** para normalizar o texto antes do parsing

## Remover o debug após diagnóstico

Após identificar o problema, lembre-se de remover o modo debug para evitar logs desnecessários em produção.

**Arquivos modificados:**
- `src/lib/pdf/parser.ts` - Linha 51, 209, 238, 252
- `src/actions/invoice.actions.ts` - Linha 51-59

Para remover, basta mudar `parsePdfFile(buffer, true)` para `parsePdfFile(buffer)` e remover os console.logs adicionados.
