# PostHog + Next.js - Guia de Implementação

## Setup no ControleFatura

O ControleFatura pode integrar PostHog para analytics de produto. Esta referência documenta como configurar e manter a integração.

### Arquivos Principais

```
src/
├── providers/
│   └── posthog-provider.tsx    # Client-side provider + identificação
├── lib/
│   ├── posthog-server.ts       # Server-side client
│   └── posthog-api.ts          # Queries HogQL
├── hooks/
│   └── useTrackSection.ts      # Hook para tracking de seções
next.config.ts                   # Reverse proxy config
```

---

## Client-Side (posthog-js)

### Inicialização

```typescript
// src/providers/posthog-provider.tsx
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",                    // Usa reverse proxy
  capture_pageview: "history_change",     // Auto-capture para App Router
  capture_pageleave: true,                // Track quando sai da página
  persistence: "localStorage",
  autocapture: true,                      // Clicks, forms, etc
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: { password: true },
    maskTextSelector: ".ph-no-capture",
  },
})
```

### Opções de Inicialização

| Opção | Valor | Descrição |
|-------|-------|-----------|
| `api_host` | `/ingest` | Reverse proxy (bypass ad blockers) |
| `capture_pageview` | `"history_change"` | Auto-capture de pageviews |
| `capture_pageleave` | `true` | Track quando usuário sai |
| `persistence` | `"localStorage"` | Onde salvar estado |
| `autocapture` | `true` | Captura automática de clicks |
| `person_profiles` | `"identified_only"` | Só cria perfil após identify |

### Debug Mode

Em development, o PostHog automaticamente entra em debug mode:

```typescript
loaded: (posthog) => {
  if (process.env.NODE_ENV === 'development') {
    posthog.debug()  // Logs no console
  }
}
```

---

## Server-Side (posthog-node)

### Funções Disponíveis

```typescript
// src/lib/posthog-server.ts

// Captura evento server-side
await captureServerEvent(
  distinctId: string,  // user.id (Supabase auth UUID)
  event: string,       // "invoice:upload_success"
  properties?: Record<string, unknown>
)

// Identifica usuário server-side
await identifyServerUser(
  distinctId: string,
  properties: Record<string, unknown>
)

// Shutdown (cleanup)
await shutdownPostHog()
```

### Quando Usar Server vs Client

| Cenário | Usar |
|---------|------|
| Click de botão | Client |
| Navegação entre páginas | Client (automático) |
| Signup completo | **Server** |
| Fatura processada com sucesso | **Server** |
| Erro em Server Action | Server |

---

## Reverse Proxy

### Por que usar?

Ad blockers bloqueiam requisições para `posthog.com`. O reverse proxy roteia via seu próprio domínio.

### Configuração em next.config.ts

```javascript
async rewrites() {
  return [
    {
      source: "/ingest/static/:path*",
      destination: "https://us-assets.i.posthog.com/static/:path*",
    },
    {
      source: "/ingest/:path*",
      destination: "https://us.i.posthog.com/:path*",
    },
    {
      source: "/ingest/decide",
      destination: "https://us.i.posthog.com/decide",
    },
  ]
}
```

### Verificar se está funcionando

1. Abrir DevTools → Network
2. Procurar requisições para `/ingest`
3. Devem retornar 200 (não blocked)

---

## Identificação de Usuário

### Fluxo no ControleFatura

```
Login → Supabase Auth atualiza → PostHogIdentifier detecta → posthog.identify()
                                                                  ↓
Logout → Auth state limpa → PostHogIdentifier detecta → posthog.reset()
```

### Código

```typescript
function PostHogIdentifier() {
  const { user } = useAuth() // Supabase auth user

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, { // UUID from Supabase Auth
        email: user.email,
      })
    } else {
      posthog.reset()
    }
  }, [user])

  return null
}
```

### Propriedades do Usuário

Após `identify()`, você pode adicionar propriedades:

```typescript
// Atualizar propriedades
posthog.people.set({
  accounts_count: 2,
  invoices_count: 15,
  last_active_at: new Date().toISOString(),
})

// Incrementar contador
posthog.people.increment('ai_queries_count', 1)

// Set once (não sobrescreve)
posthog.people.set_once({
  first_signup_source: 'google_ads',
})
```

---

## Session Replay

### Configuração

```typescript
session_recording: {
  maskAllInputs: false,       // Não mascara todos inputs
  maskInputOptions: {
    password: true,           // SEMPRE mascara senhas
  },
  maskTextSelector: ".ph-no-capture",  // Classe para mascarar
}
```

### Mascarar Elementos

```tsx
// Elemento não será gravado
<div className="ph-no-capture">
  Informação sensível
</div>

// Input específico mascarado
<input type="password" />  // Automático
<input className="ph-no-capture" />  // Manual
```

### Desabilitar Replay em Páginas

```typescript
// Em páginas específicas
useEffect(() => {
  posthog.stopSessionRecording()
  return () => posthog.startSessionRecording()
}, [])
```

---

## Error Tracking

### Autocapture de Erros

O provider configura handlers globais:

```typescript
// window.onerror - erros síncronos
window.onerror = (message, source, lineno, colno, error) => {
  posthog.captureException(error)
}

// unhandledrejection - promises
window.onunhandledrejection = (event) => {
  posthog.captureException(event.reason)
}
```

### Captura Manual

```typescript
try {
  await riskyOperation()
} catch (error) {
  posthog.captureException(error, {
    operation: 'riskyOperation',
    user_id: userId,
  })
  throw error  // Re-throw se necessário
}
```

### Error Boundaries Next.js

Arquivos existentes:
- `src/app/error.tsx` - Error boundary por rota
- `src/app/global-error.tsx` - Error boundary global

---

## Variáveis de Ambiente

### Obrigatórias

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Onde encontrar

1. Login em [app.posthog.com](https://app.posthog.com)
2. Project Settings → Project API Key

---

## Troubleshooting

### Eventos não aparecem

1. Verificar se `NEXT_PUBLIC_POSTHOG_KEY` está setada
2. Verificar Network tab - requisições para `/ingest`
3. Se bloqueado, verificar reverse proxy
4. Em dev, verificar console (debug mode)

### User não identificado

1. Verificar se `identify()` é chamado
2. Verificar se `distinctId` é consistente (user.id como string)
3. Eventos devem vir DEPOIS do identify

### Session replay não grava

1. Verificar se está habilitado no PostHog dashboard
2. Verificar se `session_recording` está na config
3. Verificar se página não está em `ph-no-capture`

### Server events não chegam

1. Usar `await` em `captureServerEvent()`
2. Verificar se não está em try/catch silencioso
3. Verificar logs do servidor

---

## Referências Atualizadas (2025)

- [Next.js Setup](https://posthog.com/docs/libraries/next-js)
- [Error Tracking](https://posthog.com/docs/error-tracking/installation/nextjs)
- [Session Replay Privacy](https://posthog.com/docs/session-replay/privacy)
- [Instrumentation Client (Next.js 15.3+)](https://posthog.com/docs/libraries/next-js#quick-installation-using-instrumentation-clienttsjs)
