---
name: posthog
description: Implement PostHog analytics, feature flags, and session replay for Next.js apps. Use this skill for event tracking, user identification, A/B testing, experiments, and session recording setup. Also handles analytics reporting (funnel analysis, retention, SEO) with Google Search Console integration.
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, Bash
---

# PostHog no ControleFatura - Guia Operacional

## Arquitetura Recomendada no ControleFatura

O PostHog deve ser configurado seguindo a arquitetura do ControleFatura. Aqui esta onde cada coisa deve viver:

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| Provider Client | `src/components/shared/posthog-provider.tsx` | Inicializacao, identificacao de usuario, error tracking |
| Server Client | `src/lib/analytics/posthog.ts` | `captureServerEvent()`, `identifyServerUser()` |
| Reverse Proxy | `next.config.mjs` | Rewrites `/ingest` -> PostHog (bypass ad blockers) |

### Variaveis de Ambiente

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx    # Project API Key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Quando Usar Client vs Server

```
Onde trackear?
|-- Acao do usuario no browser -> Client (posthog-js)
|   Exemplos: clicks, navegacao, interacoes UI
|
|-- API route / webhook -> Server (posthog-node)
|   Exemplos: signup completo, pagamento, erros criticos
|
|-- Precisa 100% precisao -> Server (sem ad blockers)
|   Exemplos: funnel de conversao, billing events
|
\-- Feedback visual em tempo real -> Client (posthog-js)
```

---

## Taxonomia de Eventos do ControleFatura

### Padrao de Nomenclatura

Use `category:object_action` em **snake_case**:

```typescript
// Correto
"auth:signup_start"
"invoice:upload_start"
"invoice:parse_complete"
"transaction:categorize_success"
"budget:expense_add"
"chat:message_send"

// Errado
"User Signed Up"        // Sem espacos, sem caps
"signupComplete"        // Use snake_case
"invoice_uploaded"      // Falta categoria
```

### Categorias de Eventos do ControleFatura

#### Autenticacao (auth:)
```typescript
"auth:signup_start"      // Client - inicio do signup
"auth:signup_complete"   // Server - signup finalizado
"auth:login_success"     // Client - login bem sucedido
"auth:oauth_start"       // Client - inicio OAuth (Google)
"auth:oauth_complete"    // Server - OAuth finalizado
"auth:logout"            // Client - usuario fez logout
```

#### Faturas (invoice:)
```typescript
"invoice:upload_start"     // Client - usuario iniciou upload de PDF
"invoice:upload_success"   // Server - PDF salvo no storage
"invoice:upload_error"     // Server - erro no upload
"invoice:parse_start"      // Server - inicio do parsing (AI ou regex)
"invoice:parse_complete"   // Server - parsing finalizado com sucesso
"invoice:parse_error"      // Server - erro no parsing
"invoice:delete"           // Server - fatura deletada
"invoice:view"             // Client - usuario visualizou fatura
```

#### Transacoes (transaction:)
```typescript
"transaction:categorize_success"  // Server - transacao categorizada
"transaction:categorize_manual"   // Client - usuario alterou categoria
"transaction:filter"              // Client - usuario filtrou transacoes
"transaction:search"              // Client - usuario buscou transacoes
"transaction:export"              // Client - usuario exportou dados
```

#### Orcamento (budget:)
```typescript
"budget:config_create"      // Server - configuracao criada
"budget:config_update"      // Server - configuracao atualizada
"budget:expense_add"        // Client - despesa manual adicionada
"budget:expense_delete"     // Client - despesa removida
"budget:reconcile_match"    // Server - despesa reconciliada com transacao
"budget:forecast_view"      // Client - usuario visualizou previsao
```

#### Analytics (analytics:)
```typescript
"analytics:dashboard_view"   // Client - usuario visualizou analytics
"analytics:chart_interact"   // Client - interacao com grafico
"analytics:filter_apply"     // Client - filtro aplicado
"analytics:export"           // Client - dados exportados
```

#### Chat IA (chat:)
```typescript
"chat:conversation_start"   // Client - nova conversa iniciada
"chat:message_send"         // Client - mensagem enviada
"chat:message_receive"      // Server - resposta do AI recebida
"chat:suggestion_click"     // Client - sugestao clicada
```

### Propriedades Padrao

| Padrao | Exemplo | Quando Usar |
|--------|---------|-------------|
| `_id` | `user_id`, `account_id` | Identificadores |
| `_count` | `transactions_count` | Quantidades |
| `_at` | `created_at` | Timestamps |
| `is_` | `is_first_time` | Booleanos |
| `has_` | `has_subscription` | Booleanos de posse |

---

## Implementacao Pratica

### 1. Tracking no Client (Componentes)

```typescript
'use client'
import posthog from 'posthog-js'

// Evento simples
posthog.capture("invoice:upload_start", {
  source: "dashboard",
  invoice_count: 5,
})

// Exemplo em componente de upload
function InvoiceUpload() {
  const handleUpload = (file: File) => {
    posthog.capture("invoice:upload_start", {
      file_size: file.size,
      file_type: file.type,
    })
  }
}
```

### 2. Tracking no Server (Server Actions / API Routes)

```typescript
import { captureServerEvent } from "@/lib/analytics/posthog"

// Em qualquer Server Action
await captureServerEvent(user.id, "invoice:parse_complete", {
  parser_type: "ai", // or "regex"
  transactions_count: 45,
  invoice_id: invoiceId,
})
```

### 3. Identificacao de Usuario

Setup no provider (crie em `src/components/shared/posthog-provider.tsx`):

```typescript
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest',
      person_profiles: 'identified_only',
      capture_pageview: false, // Manual pageviews for App Router
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: { password: true },
        maskTextSelector: ".ph-no-capture",
      },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

Identificacao apos login:

```typescript
posthog.identify(user.id, {
  email: profile.email,
  name: profile.full_name,
  account_id: currentAccountId,
})
```

### 4. Error Tracking

Para erros manuais:
```typescript
posthog.captureException(error, {
  context: "invoice_parsing",
  additional_data: "value",
})
```

Erros automaticos (configurar no provider):
- `window.onerror` - erros nao capturados
- `unhandledrejection` - promises rejeitadas

---

## Feature Flags & Experimentos

### Verificar Flag no Client

```typescript
'use client'
import { useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react'

function MyComponent() {
  // Boolean flag
  const showNewFeature = useFeatureFlagEnabled('new-feature')

  // Multivariate / payload
  const variant = useFeatureFlagPayload('pricing-experiment')

  if (showNewFeature === undefined) {
    return <Skeleton /> // Loading state
  }

  return showNewFeature ? <NewFeature /> : <OldFeature />
}
```

### Verificar Flag no Server

```typescript
import { PostHog } from 'posthog-node'

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
})

const isEnabled = await posthog.isFeatureEnabled('feature-key', distinctId)
await posthog.shutdown()
```

---

## Session Replay

### Configuracao Recomendada

```typescript
session_recording: {
  maskAllInputs: false,
  maskInputOptions: { password: true },
  maskTextSelector: ".ph-no-capture",
}
```

### Mascarar Elementos Sensiveis

```tsx
// Elemento nao sera gravado
<div className="ph-no-capture">
  Dados sensiveis aqui
</div>
```

---

## Queries HogQL (Extracao de Dados)

Para extrair dados do PostHog via API, crie um helper em `src/lib/analytics/posthog.ts`:

```typescript
// POST /api/projects/:project_id/query
const response = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PERSONAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: `
        SELECT
          event,
          count() as count
        FROM events
        WHERE timestamp > now() - INTERVAL 7 DAY
        GROUP BY event
        ORDER BY count DESC
        LIMIT 10
      `
    }
  })
})
```

---

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| Eventos nao aparecem | Verificar se reverse proxy esta funcionando (`/ingest`) |
| Ad blockers bloqueando | Usar reverse proxy (ja configurado) |
| User nao identificado | Verificar se `identify()` e chamado antes de eventos |
| Feature flag undefined | Estado de loading - mostrar skeleton |
| Erros nao capturados | Verificar se provider esta no layout root |
| Server events perdidos | Usar `await captureServerEvent()` com await |

---

## Referencias Oficiais

Quando precisar de algo nao coberto aqui, consulte:

| Topico | Link |
|--------|------|
| **Next.js Setup** | https://posthog.com/docs/libraries/next-js |
| **Event Tracking** | https://posthog.com/docs/getting-started/send-events |
| **Feature Flags** | https://posthog.com/docs/feature-flags |
| **A/B Testing** | https://posthog.com/tutorials/nextjs-ab-tests |
| **Session Replay** | https://posthog.com/docs/session-replay |
| **Error Tracking** | https://posthog.com/docs/error-tracking |
| **HogQL/SQL** | https://posthog.com/docs/sql |
| **Group Analytics** | https://posthog.com/docs/product-analytics/group-analytics |
| **Privacy Controls** | https://posthog.com/docs/session-replay/privacy |
| **Query API** | https://posthog.com/docs/api/query |

---

## Checklist para Novas Features

Ao implementar tracking para uma nova feature:

- [ ] Definir evento com padrao `category:object_action`
- [ ] Decidir: client (UI) ou server (critico)?
- [ ] Adicionar propriedades relevantes (IDs, counts, contexto)
- [ ] Se critico para funnel -> usar `captureServerEvent()`
- [ ] Testar com PostHog debug mode (`NODE_ENV=development`)
- [ ] Verificar no painel PostHog que eventos chegaram
