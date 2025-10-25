# Guia de Deploy - AnalytiXPay

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Conta na Vercel (recomendado) ou outro provedor

## 🚀 Deploy na Vercel (Recomendado)

### 1. Preparar o Projeto

```bash
# Instalar dependências
npm install

# Build local para testar
npm run build

# Testar localmente
npm run start
```

### 2. Configurar Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Importe o repositório do GitHub
5. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

6. Clique em "Deploy"

### 3. Configurar Domínio Customizado (Opcional)

1. Na Vercel, vá em Settings → Domains
2. Adicione seu domínio
3. Configure o DNS conforme instruções
4. Atualize `NEXT_PUBLIC_APP_URL` nas variáveis de ambiente

### 4. Atualizar URLs no Supabase

1. Vá em Authentication → URL Configuration
2. Adicione seu domínio em:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/auth/callback`

## 🐳 Deploy com Docker

### 1. Criar Dockerfile

O projeto já está configurado para Next.js standalone build.

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### 2. Build e Run

```bash
# Build
docker build -t analytixpay .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
  analytixpay
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    restart: unless-stopped
```

## ☁️ Deploy em Outros Provedores

### Netlify

1. Instale Netlify CLI: `npm install -g netlify-cli`
2. Build: `npm run build`
3. Deploy: `netlify deploy --prod`
4. Configure variáveis de ambiente no painel

### Railway

1. Conecte o repositório GitHub
2. Configure variáveis de ambiente
3. Deploy automático

### AWS (EC2 + PM2)

```bash
# Instalar dependências
npm install

# Build
npm run build

# Instalar PM2
npm install -g pm2

# Start com PM2
pm2 start npm --name "analytixpay" -- start

# Salvar configuração
pm2 save
pm2 startup
```

## 🔒 Segurança em Produção

### 1. Variáveis de Ambiente

**NUNCA** commite o arquivo `.env.local` no Git!

Adicione ao `.gitignore`:
```
.env*.local
.env
```

### 2. CORS e CSP

Configure no `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### 3. Rate Limiting

No Supabase, configure rate limiting para:
- Login: 5 tentativas por minuto
- Upload: 10 uploads por hora
- API calls: 100 requests por minuto

### 4. Backup do Banco de Dados

Configure backups automáticos no Supabase:
1. Vá em Settings → Database
2. Configure Daily Backups
3. Retenção: 7 dias (mínimo)

## 📊 Monitoramento

### Vercel Analytics

Adicione ao `layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Logs no Supabase

Monitore:
- Auth logs (logins, signups)
- Database logs (queries lentas)
- Storage logs (uploads)

## ⚡ Otimizações de Performance

### 1. Next.js Config

```typescript
const nextConfig = {
  output: 'standalone', // Para Docker
  compress: true, // Compressão gzip
  images: {
    domains: ['seu-projeto.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
}
```

### 2. CDN para Arquivos Estáticos

- Vercel CDN (automático)
- Cloudflare (se usar domínio próprio)

### 3. Edge Functions

Para APIs frequentes, use Edge Runtime:

```typescript
export const runtime = 'edge'
```

## 🔄 CI/CD

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Checklist de Deploy

- [ ] Build local funciona sem erros
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Schema SQL executado no Supabase
- [ ] Bucket 'invoices' criado no Storage
- [ ] Políticas de Storage configuradas
- [ ] Políticas RLS testadas
- [ ] Google OAuth configurado (se aplicável)
- [ ] URLs de callback atualizadas no Supabase
- [ ] Domínio customizado configurado (opcional)
- [ ] Analytics configurado
- [ ] Error tracking configurado
- [ ] Backups automáticos configurados
- [ ] Performance testada
- [ ] SSL/HTTPS funcionando

## 🆘 Troubleshooting

### Build falha na Vercel

- Verifique versão do Node.js (18+)
- Limpe cache: `npm run clean` (se disponível)
- Verifique logs de build

### Erro de autenticação em produção

- Verifique URLs no Supabase
- Confirme variáveis de ambiente
- Teste callback URL

### PDF parsing não funciona

- Verifique se pdf-parse está em dependencies (não devDependencies)
- Configure webpack corretamente no next.config.ts

### Performance lenta

- Ative caching no Supabase
- Use React Server Components
- Otimize queries do banco

## 📞 Suporte

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs

---

**Última atualização**: 2025-10-12
**Versão**: 1.0.0
