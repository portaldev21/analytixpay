# Taxonomia de Eventos - ControleFatura

## Padrão de Nomenclatura

### Formato: `category:object_action`

```
category:object_action
   │        │     │
   │        │     └── verbo (start, complete, view, create, delete)
   │        └── substantivo (signup, checkout, invoice, transaction, budget)
   └── contexto (auth, invoice, transaction, budget, ai, dashboard)
```

### Regras

| Regra | Correto | Errado |
|-------|---------|--------|
| Lowercase | `auth:signup_start` | `Auth:Signup_Start` |
| Snake case | `invoice_upload` | `invoiceUpload` |
| Presente | `create`, `view` | `created`, `viewed` |
| Categoria obrigatória | `invoice:upload_start` | `invoice_uploaded` |

---

## Categorias do ControleFatura

### `auth:` - Autenticação

```typescript
"auth:signup_start"      // Usuário iniciou signup (client)
"auth:signup_complete"   // Signup finalizado com sucesso (server)
"auth:login_success"     // Login bem sucedido (client)
"auth:logout"            // Usuário fez logout (client)
"auth:password_reset"    // Solicitou reset de senha (client)
"auth:oauth_login"       // Login via Google OAuth (client)
```

**Propriedades comuns:**
```typescript
{
  method: "email" | "google",
  source: "landing" | "invite" | "direct",
}
```

### `invoice:` - Faturas de Cartão

```typescript
"invoice:upload_start"       // Iniciou upload de PDF (client)
"invoice:upload_success"     // PDF processado com sucesso (server)
"invoice:upload_error"       // Erro no processamento (server)
"invoice:view"               // Visualizou detalhes da fatura (client)
"invoice:delete"             // Fatura deletada (client)
```

**Propriedades comuns:**
```typescript
{
  invoice_id: string,
  file_name?: string,
  period?: string,         // "2024-01"
  total_amount?: number,
  transactions_count?: number,
  parser_type?: "ai" | "regex",
  error_type?: string,     // Para invoice:upload_error
}
```

### `transaction:` - Transações

```typescript
"transaction:view_list"      // Visualizou lista de transações (client)
"transaction:filter_apply"   // Aplicou filtro (client)
"transaction:category_edit"  // Editou categoria (client)
"transaction:search"         // Buscou transação (client)
```

**Propriedades comuns:**
```typescript
{
  transaction_id?: string,
  category?: string,
  filter_type?: string,
  search_query?: string,
}
```

### `budget:` - Orçamento Fluido

```typescript
"budget:config_create"       // Configurou orçamento (client)
"budget:expense_add"         // Adicionou despesa manual (client)
"budget:expense_delete"      // Deletou despesa (client)
"budget:reconcile_match"     // Reconciliou despesa com transação (client)
"budget:forecast_view"       // Visualizou projeção (client)
```

**Propriedades comuns:**
```typescript
{
  account_id?: string,
  daily_base?: number,
  carry_over_mode?: string,
  expense_amount?: number,
}
```

### `ai:` - Chat com IA (ControleIA)

```typescript
"ai:chat_open"           // Abriu chat de IA (client)
"ai:message_send"        // Enviou mensagem (client)
"ai:message_receive"     // Recebeu resposta (client)
"ai:conversation_create" // Nova conversa criada (client)
"ai:feedback_positive"   // Feedback positivo na resposta (client)
"ai:feedback_negative"   // Feedback negativo na resposta (client)
```

**Propriedades comuns:**
```typescript
{
  conversation_id?: string,
  account_id?: string,
  message_length?: number,
  response_time_ms?: number,
  question_type?: string,  // Classificação da pergunta
}
```

### `analytics:` - Dashboard de Analytics

```typescript
"analytics:view"            // Visualizou página de analytics (client)
"analytics:block_view"      // Visualizou bloco específico (client)
"analytics:export"          // Exportou dados (client)
"analytics:date_change"     // Mudou período de análise (client)
"analytics:filter_apply"    // Aplicou filtro (client)
```

**Propriedades comuns:**
```typescript
{
  block_id?: string,
  date_range?: string,
  export_format?: "csv" | "pdf",
  filter_type?: string,
}
```

### `onboarding:` - Fluxo de Onboarding

```typescript
"onboarding:start"           // Iniciou onboarding (client)
"onboarding:step_complete"   // Completou etapa (client)
"onboarding:skip"            // Pulou onboarding (client)
"onboarding:complete"        // Finalizou onboarding (client)
```

**Propriedades comuns:**
```typescript
{
  step_number: number,
  step_name: string,
  total_steps: number,
  skip_reason?: string,
}
```

### `activation:` - Momentos de Ativação

```typescript
"activation:first_invoice_upload"   // Enviou primeira fatura
"activation:first_ai_chat"         // Usou chat de IA pela primeira vez
"activation:first_budget_config"   // Configurou primeiro orçamento
"activation:first_reconciliation"  // Primeira reconciliação de despesa
```

**Propriedades comuns:**
```typescript
{
  days_since_signup: number,
  account_id: string,
}
```

### `account:` - Gestão de Conta

```typescript
"account:create"             // Criou nova conta (client)
"account:member_invite"      // Convidou membro (client)
"account:member_remove"      // Removeu membro (client)
"account:switch"             // Trocou de conta ativa (client)
```

**Propriedades comuns:**
```typescript
{
  account_id: string,
  role?: "owner" | "member",
  members_count?: number,
}
```

### `dashboard:` - Navegação Geral

```typescript
"section_viewed"    // Visualizou seção (via useTrackSection)
"feature_used"      // Usou feature (via useTrackSection)
"landing:page_view" // Visualizou landing page
```

---

## Propriedades Padrão

### Sufixos

| Sufixo | Tipo | Exemplo |
|--------|------|---------|
| `_id` | string (UUID) | `user_id`, `account_id`, `invoice_id` |
| `_count` | number | `transactions_count`, `members_count` |
| `_at` | ISO string | `created_at`, `uploaded_at` |
| `_ms` | number | `response_time_ms`, `parse_time_ms` |

### Prefixos Booleanos

| Prefixo | Exemplo |
|---------|---------|
| `is_` | `is_first_time`, `is_owner`, `is_international` |
| `has_` | `has_budget`, `has_invoices` |

### Propriedades Automáticas (PostHog)

Não precisa enviar - PostHog adiciona automaticamente:

```typescript
$current_url       // URL atual
$browser           // Browser do usuário
$device_type       // desktop/mobile/tablet
$os                // Sistema operacional
$referrer          // Referrer
$session_id        // ID da sessão
$lib               // Biblioteca (posthog-js)
```

---

## Anti-Patterns

```typescript
// ❌ Espaços e caps
"User Signed Up"

// ❌ Passado
"user_signed_up"

// ❌ Sem categoria
"signup_complete"

// ❌ Objetos aninhados
{ user: { id: "123", name: "João" } }

// ✅ Estrutura flat
{ user_id: "123", user_name: "João" }

// ❌ Propriedades demais (noise)
{ x: 1, y: 2, z: 3, timestamp: "...", random_data: "..." }

// ✅ Só o necessário
{ invoice_id: "inv-123", action: "delete" }
```

---

## Versionamento de Eventos

Se precisar mudar significativamente um evento:

```typescript
// Versão original
"onboarding:step_complete"

// Nova versão (fluxo redesenhado)
"onboarding_v2:step_complete"
```

Manter ambos por um período para não quebrar funnels existentes.
