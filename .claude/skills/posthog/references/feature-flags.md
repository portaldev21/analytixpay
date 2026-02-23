# Feature Flags & Experimentos - PostHog

## Tipos de Flag

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **Boolean** | On/off simples | `new-dashboard`, `beta-ai-chat` |
| **Multivariate** | A/B/n testing | `pricing-page-variant` |
| **JSON Payload** | Configuração dinâmica | `rate-limits`, `feature-config` |

---

## Implementação Client-Side

### Boolean Flag

```typescript
'use client'
import { useFeatureFlagEnabled } from 'posthog-js/react'

function Dashboard() {
  const showNewFeature = useFeatureFlagEnabled('new-dashboard')

  // IMPORTANTE: Tratar undefined (loading)
  if (showNewFeature === undefined) {
    return <DashboardSkeleton />
  }

  return showNewFeature ? <NewDashboard /> : <OldDashboard />
}
```

### Multivariate Flag

```typescript
'use client'
import { useFeatureFlagPayload } from 'posthog-js/react'

function PricingPage() {
  const variant = useFeatureFlagPayload('pricing-experiment')

  switch (variant) {
    case 'control':
      return <PricingControl />
    case 'variant-a':
      return <PricingVariantA />
    case 'variant-b':
      return <PricingVariantB />
    default:
      return <PricingControl />  // Fallback
  }
}
```

### JSON Payload

```typescript
'use client'
import { useFeatureFlagPayload } from 'posthog-js/react'

interface RateLimits {
  maxGroups: number
  maxAIQueries: number
}

function useRateLimits(): RateLimits {
  const payload = useFeatureFlagPayload('rate-limits') as RateLimits | undefined

  return payload ?? {
    maxGroups: 10,      // Default
    maxAIQueries: 50,   // Default
  }
}
```

---

## Implementação Server-Side

### Em API Routes

```typescript
import { PostHog } from 'posthog-node'

export async function POST(request: NextRequest) {
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  })

  try {
    const userId = "123"  // Do seu sistema de auth

    const useNewModel = await posthog.isFeatureEnabled('new-ai-model', userId)

    if (useNewModel) {
      // Nova implementação
    } else {
      // Implementação atual
    }

    return NextResponse.json({ success: true })
  } finally {
    await posthog.shutdown()  // IMPORTANTE: sempre fazer shutdown
  }
}
```

### Com getFeatureFlagPayload

```typescript
const config = await posthog.getFeatureFlagPayload('feature-config', userId)
```

---

## Evitar Flicker (Flash of Content)

### Problema

Quando a página carrega, o PostHog ainda não tem os dados das flags, causando "flicker" entre estados.

### Solução 1: Skeleton enquanto carrega

```typescript
const isEnabled = useFeatureFlagEnabled('feature')

if (isEnabled === undefined) {
  return <Skeleton />  // Mostra loading
}
```

### Solução 2: Bootstrapping (mais avançado)

Pré-carregar flags no server e passar para o client:

```typescript
// middleware.ts ou Server Component
import { PostHog } from 'posthog-node'

export async function getBootstrapData(userId: string) {
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)

  const flags = await posthog.getAllFlags(userId)
  await posthog.shutdown()

  return { distinctId: userId, featureFlags: flags }
}

// No client, passar para posthog.init()
posthog.init(key, {
  bootstrap: bootstrapData,
})
```

---

## Estratégias de Rollout

### Rollout Gradual por Porcentagem

```
0%   → Apenas devs/QA
10%  → Beta users
25%  → Early adopters
50%  → Metade dos usuários
100% → Todos
```

### Targeting por Propriedade

```
Flag: enterprise-features
├── User property: plan_name = "enterprise"
├── OR User property: is_beta_tester = true
└── OR User ID está na lista específica
```

### Targeting por Grupo (B2B)

```
Flag: org-wide-feature
├── Group type: organization
└── Group property: tier = "premium"
```

---

## Experimentos A/B

### Criar Experimento no PostHog

1. Criar feature flag com variantes
2. Criar experimento vinculado à flag
3. Definir métrica de sucesso (ex: `billing:checkout_complete`)
4. Definir tamanho mínimo da amostra

### Tracking de Conversão

O PostHog automaticamente associa eventos às variantes. Certifique-se de:

1. User está identificado ANTES de ver o experimento
2. Evento de conversão usa o mesmo `distinctId`
3. Evento tem propriedades relevantes para análise

```typescript
// Ao mostrar a variante
posthog.capture('experiment:pricing_view', {
  variant: currentVariant,
})

// Na conversão
posthog.capture('billing:checkout_complete', {
  plan_name: 'pro',
  experiment_variant: currentVariant,  // Opcional mas útil
})
```

---

## Cleanup de Flags

Quando uma flag chega a 100% e está estável:

- [ ] Flag está em 100% há pelo menos 1 semana
- [ ] Sem bugs reportados
- [ ] Sem experimentos ativos usando a flag
- [ ] Remover código condicional (manter só versão nova)
- [ ] Arquivar flag no PostHog (não deletar)

---

## Boas Práticas

### Nomenclatura de Flags

```typescript
// ✅ Bom
"new-dashboard"
"ai-chat-v2"
"pricing-experiment"

// ❌ Evitar
"feature_1"
"test"
"temporary"
```

### Defaults Seguros

Sempre ter um fallback que funciona se a flag falhar:

```typescript
const isEnabled = useFeatureFlagEnabled('risky-feature') ?? false

// Se PostHog falhar, feature fica desabilitada
```

### Logging para Debug

```typescript
const variant = useFeatureFlagPayload('experiment')

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[FeatureFlag] experiment:', variant)
  }
}, [variant])
```

---

## Referências

- [PostHog Feature Flags Docs](https://posthog.com/docs/feature-flags)
- [Next.js A/B Tests Tutorial](https://posthog.com/tutorials/nextjs-ab-tests)
- [Creating Experiments](https://posthog.com/docs/experiments/creating-an-experiment)
- [Bootstrapping Flags](https://posthog.com/docs/feature-flags/bootstrapping)
