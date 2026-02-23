# Implementação PostHog no ControleFatura

## Arquivos Principais

### 1. Provider Client (`src/providers/posthog-provider.tsx`)

**O que faz:**
- Inicializa PostHog no client-side
- Identifica usuários automaticamente via `PostHogIdentifier`
- Configura error tracking global (`window.onerror`, `unhandledrejection`)
- Configura session replay com masking de senhas

**Configuração:**
```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",                    // Reverse proxy
  capture_pageview: "history_change",     // Auto-capture para App Router
  capture_pageleave: true,
  persistence: "localStorage",
  autocapture: true,
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: { password: true },
    maskTextSelector: ".ph-no-capture",
  },
})
```

### 2. Server Client (`src/lib/posthog-server.ts`)

**Funções exportadas:**
- `captureServerEvent(distinctId, event, properties)` - Captura evento server-side
- `identifyServerUser(distinctId, properties)` - Identifica usuário server-side
- `shutdownPostHog()` - Encerra cliente (para cleanup)

**Quando usar:**
- Server Actions que precisam de 100% precisão (invoice processing, signup)
- Eventos críticos para funnels de conversão

### 3. Reverse Proxy (`next.config.ts`)

```javascript
async rewrites() {
  return [
    { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    { source: "/ingest/decide", destination: "https://us.i.posthog.com/decide" },
  ]
}
```

**Por que existe:** Ad blockers bloqueiam requisições diretas para `posthog.com`. O reverse proxy roteia via nosso domínio.

### 4. Hook useTrackSection (`src/hooks/useTrackSection.ts`)

**O que faz:**
- Tracking automático de visualização de seções
- Helper `trackEvent()` para eventos customizados
- Helper `trackFeature()` para uso de features

**Seções disponíveis:**
```typescript
type SectionId =
  | "dashboard" | "analytics" | "invoices" | "transactions"
  | "budget" | "settings" | "ai-chat" | "forecast"
  | "reconciliation"
```

### 5. PostHog API (`src/lib/posthog-api.ts`)

**O que faz:**
- Queries HogQL para extração de dados
- Usado para gerar relatórios e insights

---

## Fluxo de Dados

```
┌─────────────────┐      ┌─────────────────┐
│  Browser/Client │      │  Server Actions  │
│   (posthog-js)  │      │  (posthog-node)  │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │ /ingest (proxy)        │ direct
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────┐
│           PostHog Cloud (us.i.posthog.com)  │
└─────────────────────────────────────────────┘
```

---

## Identificação de Usuário

### Como funciona no ControleFatura

O `PostHogIdentifier` é montado no provider e observa o estado de auth do Supabase:

```typescript
function PostHogIdentifier() {
  const { user } = useAuth() // Supabase Auth user

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, { // UUID from Supabase Auth
        email: user.email,
      })
    } else {
      posthog.reset()  // Logout
    }
  }, [user])
}
```

### Distinct ID

- **Client:** `user.id` (Supabase Auth UUID)
- **Server:** Mesmo `user.id` passado para `captureServerEvent()`

**Importante:** Manter consistência entre client e server para que eventos sejam associados ao mesmo usuário.

---

## Error Tracking

### Configuração

O provider configura dois handlers globais:

1. **`window.onerror`** - Erros síncronos não capturados
2. **`window.onunhandledrejection`** - Promises rejeitadas

Ambos usam `posthog.captureException()` com metadata adicional.

### Error Boundaries Next.js

Arquivos existentes:
- `src/app/error.tsx` - Error boundary para rotas
- `src/app/global-error.tsx` - Error boundary global

---

## Eventos por Área

| Área | Eventos |
|------|---------|
| Auth | `auth:signup_start`, `auth:signup_complete`, `auth:login_success`, `auth:oauth_login` |
| Invoice | `invoice:upload_start`, `invoice:upload_success`, `invoice:upload_error`, `invoice:view` |
| Transaction | `transaction:view_list`, `transaction:filter_apply`, `transaction:category_edit` |
| Budget | `budget:config_create`, `budget:expense_add`, `budget:reconcile_match` |
| AI Chat | `ai:chat_open`, `ai:message_send`, `ai:message_receive` |
| Analytics | `analytics:view`, `analytics:date_change`, `analytics:filter_apply` |
| Account | `account:create`, `account:member_invite`, `account:switch` |
| Activation | `activation:first_invoice_upload`, `activation:first_ai_chat`, `activation:first_budget_config` |
