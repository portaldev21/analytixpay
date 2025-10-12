# AnalytiXPay - Documentação do Projeto

## 📋 Visão Geral

AnalytiXPay é uma aplicação web moderna para gestão de faturas de cartão de crédito com extração automática de transações via OCR/parsing de PDF.

## 🎯 Objetivos

- Permitir que usuários façam login e façam upload de PDFs de faturas
- Extrair automaticamente transações (data, estabelecimento, valor, categoria)
- Contas compartilhadas entre múltiplos usuários (família/amigos)
- Interface moderna, minimalista e mobile-friendly com dark mode

## 🏗️ Arquitetura

### Stack Tecnológica

- **Framework**: Next.js 15+ (App Router, TypeScript)
- **Autenticação**: Supabase Auth (Google + Email/Senha)
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (PDFs)
- **Styling**: Tailwind CSS + Shadcn UI
- **Ícones**: Lucide Icons
- **Animações**: Framer Motion
- **PDF Parsing**: pdf-parse
- **Validação**: Zod + React Hook Form
- **Runtime**: Edge Runtime (onde possível)

### Estrutura de Pastas

```
analytixpay/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rotas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Rotas protegidas
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── transactions/
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   ├── upload/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Componentes React
│   ├── ui/                       # Componentes Shadcn
│   ├── auth/
│   ├── dashboard/
│   ├── invoices/
│   ├── transactions/
│   └── shared/
├── lib/                          # Utilitários e configurações
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── pdf/
│   │   └── parser.ts
│   ├── validations/
│   └── utils.ts
├── actions/                      # Server Actions
│   ├── auth.actions.ts
│   ├── invoice.actions.ts
│   ├── transaction.actions.ts
│   └── account.actions.ts
├── db/                           # Database schemas e tipos
│   ├── schema.sql
│   └── types.ts
├── hooks/                        # Custom React Hooks
├── public/
└── styles/
```

## 🗄️ Modelo de Dados

### Entidades Principais

1. **accounts** - Contas compartilhadas
2. **account_members** - Relacionamento usuário-conta
3. **invoices** - Faturas enviadas (PDFs)
4. **transactions** - Transações extraídas

### Relacionamentos

- Um `account` tem muitos `account_members`
- Um `account` tem muitas `invoices`
- Uma `invoice` tem muitas `transactions`
- Um `user` pode pertencer a múltiplos `accounts`

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

1. Usuário faz login via Supabase Auth (Google ou Email/Senha)
2. Middleware verifica sessão em todas as rotas protegidas
3. Server Actions verificam permissões antes de operações

### Roles

- **owner**: Criador da conta, pode adicionar/remover membros
- **member**: Membro da conta, pode ver e adicionar faturas

## 📄 Features Principais

### 1. Dashboard

- Cards de resumo (gasto total, média mensal, maior compra)
- Gráficos de gastos por categoria
- Últimas transações
- Menu lateral com navegação

### 2. Upload de Fatura

- Drag & drop de PDF
- Preview do arquivo
- Progress bar durante upload e processamento
- Feedback visual de sucesso/erro

### 3. Extração de Transações

- Parsing automático do PDF
- Detecção de padrões (data, estabelecimento, valor)
- Categorização automática baseada em keywords
- Revisão manual opcional

### 4. Tabela de Transações

- Listagem paginada
- Filtros: mês, cartão, categoria, valor
- Busca por estabelecimento
- Ordenação por colunas
- Export para CSV/Excel

### 5. Gerenciamento de Conta

- Adicionar membros via email
- Remover membros
- Visualizar histórico de atividades
- Configurações de notificações

## 🎨 Design System

### Cores

```css
/* Dark Mode (padrão) */
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%
--primary: 217.2 91.2% 59.8%
--secondary: 217.2 32.6% 17.5%
--accent: 217.2 32.6% 17.5%
--destructive: 0 62.8% 30.6%

/* Light Mode */
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--primary: 221.2 83.2% 53.3%
```

### Componentes Shadcn UI Necessários

- Button
- Card
- Input
- Label
- Table
- Dialog
- Dropdown Menu
- Select
- Tabs
- Avatar
- Badge
- Progress
- Toast
- Form
- Popover
- Calendar
- Command

### Animações

- Fade in/out para modais
- Slide in para sidebar mobile
- Skeleton loading para dados
- Smooth transitions entre páginas

## 🔄 Fluxo de Upload e Processamento

1. Usuário seleciona PDF (drag & drop ou clique)
2. Frontend valida tipo e tamanho do arquivo
3. Upload para Supabase Storage
4. Server Action processa o PDF:
   - Extrai texto com pdf-parse
   - Identifica padrões de transações com regex
   - Categoriza automaticamente
   - Salva no banco de dados
5. Retorna transações extraídas para preview
6. Usuário confirma ou edita
7. Transações são persistidas

## 🛡️ Segurança

### Row Level Security (RLS)

- Usuários só veem faturas e transações das suas contas
- Apenas owners podem adicionar/remover membros
- Upload de arquivo limitado por tamanho e tipo

### Validações

- Todas as entradas validadas com Zod
- Server Actions sempre verificam permissões
- Rate limiting em API routes

## 📱 Responsividade

- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Menu lateral colapsável em mobile
- Tabelas com scroll horizontal
- Modais fullscreen em mobile

## 🚀 Performance

- React Server Components para data fetching
- Edge Runtime para APIs
- Suspense boundaries para loading states
- Lazy loading de componentes pesados
- Otimização de imagens com next/image

## 📊 Padrões de Extração de PDF

### Formatos Comuns de Fatura

```
Padrão 1: DD/MM/YYYY | ESTABELECIMENTO | R$ 0.000,00
Padrão 2: DD/MM | DESCRIÇÃO | VALOR
Padrão 3: DATA | TRANSAÇÃO | CATEGORIA | VALOR
```

### Categorias Automáticas

- **Alimentação**: restaurante, lanchonete, mercado, supermercado
- **Transporte**: uber, taxi, combustível, estacionamento
- **Saúde**: farmácia, clínica, hospital
- **Lazer**: cinema, teatro, streaming
- **Compras**: loja, magazine, e-commerce
- **Educação**: escola, curso, livros
- **Outros**: padrão quando não identificado

## 🧪 Testes (Futuro)

- Unit tests com Jest + React Testing Library
- E2E tests com Playwright
- Integration tests para Server Actions

## 📝 Convenções de Código

### Nomenclatura

- Componentes: PascalCase (ex: `UploadInvoice.tsx`)
- Functions: camelCase (ex: `parseInvoicePdf`)
- Tipos: PascalCase com prefixo (ex: `TTransaction`, `TAccount`)
- Constants: UPPER_SNAKE_CASE

### Organização de Imports

```typescript
// 1. React/Next
import { useState } from 'react'
import Link from 'next/link'

// 2. Bibliotecas externas
import { motion } from 'framer-motion'
import { z } from 'zod'

// 3. Internos
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

// 4. Tipos
import type { TTransaction } from '@/db/types'
```

### Componentes

- Sempre usar function components
- Props tipadas com TypeScript
- Desestruturar props
- Usar Server Components por padrão
- Client Components apenas quando necessário ('use client')

### Server Actions

```typescript
'use server'

export async function actionName(data: TInput): Promise<TOutput> {
  // 1. Verificar autenticação
  // 2. Validar dados com Zod
  // 3. Verificar permissões
  // 4. Executar operação
  // 5. Revalidar cache
  // 6. Retornar resultado
}
```

## 🔧 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Dependências

### Principais

```json
{
  "next": "^15.0.0",
  "react": "^18.3.0",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0",
  "pdf-parse": "^1.1.1",
  "zod": "^3.22.4",
  "react-hook-form": "^7.49.0",
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.344.0"
}
```

## 🎯 Roadmap Futuro

- [ ] Suporte a múltiplos idiomas (i18n)
- [ ] OCR avançado com IA (OpenAI Vision API)
- [ ] Notificações push
- [ ] App mobile (React Native)
- [ ] Integração com bancos (Open Banking)
- [ ] Alertas de gastos
- [ ] Relatórios personalizados
- [ ] Export para contabilidade

## 📞 Contato e Suporte

- Issues: GitHub Issues
- Email: suporte@analytixpay.com

---

**Última atualização**: 2025-10-11
**Versão**: 1.0.0
