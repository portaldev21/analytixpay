# AnalytiXPay - Plano de Implementação Completo

## 📋 Visão Geral

Este documento descreve o plano completo de implementação da interface do AnalytiXPay.
O backend (Server Actions, Schema DB, Parser PDF) já está 100% implementado.

## 🎯 Objetivo

Implementar toda a camada de UI/Frontend para completar a aplicação, incluindo:
- Componentes UI base (Shadcn)
- Páginas de autenticação
- Dashboard completo
- Gerenciamento de faturas
- Visualização de transações
- Configurações de conta

## 📦 Fase 1: Configuração e Dependências

### 1.1 Instalação de Dependências
```bash
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers framer-motion lucide-react pdf-parse class-variance-authority clsx tailwind-merge react-dropzone recharts date-fns
npm install -D @types/pdf-parse
```

### 1.2 Configurações de Arquivos
- ✅ tsconfig.json - adicionar paths @/*
- ✅ next.config.ts - configurar webpack para pdf-parse
- ✅ components.json - configuração do Shadcn UI
- ✅ globals.css - estilos base do Shadcn

### 1.3 Componentes Shadcn UI
Instalar via CLI:
```bash
npx shadcn@latest add button card input label table dialog dropdown-menu select tabs avatar badge progress toast form popover calendar command separator skeleton switch textarea alert-dialog
```

## 🧩 Fase 2: Componentes Base

### 2.1 Componentes UI Shadcn (manual se necessário)
- Button
- Card
- Input
- Label
- Table
- Dialog
- Select
- Badge
- Avatar
- Toast
- Form
- Skeleton

### 2.2 Componentes Shared
- `Loading.tsx` - Spinner de loading
- `ErrorBoundary.tsx` - Boundary para erros
- `EmptyState.tsx` - Estado vazio
- `ConfirmDialog.tsx` - Diálogo de confirmação
- `UserAvatar.tsx` - Avatar do usuário
- `ThemeProvider.tsx` - Provider de tema (dark mode)

## 🔐 Fase 3: Autenticação

### 3.1 Componentes de Auth
- `LoginForm.tsx` - Formulário de login
- `SignupForm.tsx` - Formulário de cadastro
- `GoogleButton.tsx` - Botão OAuth Google

### 3.2 Páginas de Auth
- `app/(auth)/layout.tsx` - Layout sem sidebar
- `app/(auth)/login/page.tsx` - Página de login
- `app/(auth)/signup/page.tsx` - Página de cadastro

## 📊 Fase 4: Dashboard

### 4.1 Componentes do Dashboard
- `Sidebar.tsx` - Menu lateral
- `Header.tsx` - Cabeçalho com usuário
- `StatsCard.tsx` - Cards de estatísticas
- `CategoryChart.tsx` - Gráfico de categorias
- `RecentTransactions.tsx` - Últimas transações

### 4.2 Layout e Página
- `app/(dashboard)/layout.tsx` - Layout com sidebar
- `app/(dashboard)/dashboard/page.tsx` - Dashboard principal

## 📄 Fase 5: Faturas

### 5.1 Componentes de Invoices
- `UploadInvoice.tsx` - Upload com drag & drop
- `InvoiceCard.tsx` - Card de fatura
- `InvoiceList.tsx` - Lista de faturas
- `DeleteInvoiceDialog.tsx` - Confirmar exclusão
- `ProcessingStatus.tsx` - Status de processamento

### 5.2 Página
- `app/(dashboard)/invoices/page.tsx` - Página de faturas

## 💰 Fase 6: Transações

### 6.1 Componentes de Transactions
- `TransactionsTable.tsx` - Tabela principal
- `TransactionFilters.tsx` - Filtros avançados
- `EditTransactionDialog.tsx` - Editar transação
- `CategoryBadge.tsx` - Badge de categoria
- `ExportButton.tsx` - Exportar CSV

### 6.2 Página
- `app/(dashboard)/transactions/page.tsx` - Página de transações

## ⚙️ Fase 7: Configurações

### 7.1 Componentes de Settings
- `AccountSelector.tsx` - Seletor de conta
- `CreateAccountDialog.tsx` - Criar nova conta
- `MembersList.tsx` - Lista de membros
- `AddMemberDialog.tsx` - Adicionar membro
- `ProfileSettings.tsx` - Configurações de perfil

### 7.2 Página
- `app/(dashboard)/settings/page.tsx` - Página de configurações

## 🪝 Fase 8: Hooks Customizados

- `useAccount.ts` - Gerenciar conta atual
- `useTransactions.ts` - Gerenciar transações
- `useInvoices.ts` - Gerenciar faturas
- `useToast.ts` - Sistema de notificações

## 🎨 Fase 9: Finalização

### 9.1 Páginas Finais
- `app/page.tsx` - Landing page ou redirect
- `app/layout.tsx` - Root layout com providers

### 9.2 Polish
- Adicionar animações com Framer Motion
- Skeleton loaders
- Transições de página
- Dark mode toggle
- Responsividade mobile

## 📝 Ordem de Execução

1. ✅ Configuração (tsconfig, next.config, components.json)
2. ✅ Globals CSS e estilos base
3. ✅ Componentes UI Shadcn
4. ✅ Componentes Shared
5. ✅ Autenticação (componentes + páginas)
6. ✅ Dashboard (layout + componentes + página)
7. ✅ Invoices (componentes + página)
8. ✅ Transactions (componentes + página)
9. ✅ Settings (componentes + página)
10. ✅ Hooks customizados
11. ✅ Root layout e página inicial
12. ✅ Animações e polish final

## 🔧 Configuração do Supabase (Usuário)

Após implementação, o usuário deverá:

1. Criar projeto no Supabase
2. Executar `db/schema.sql` no SQL Editor
3. Criar bucket 'invoices' no Storage
4. Configurar políticas de Storage:
   - Allow authenticated users to upload
   - Allow users to read their own files
5. Criar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📊 Progresso Esperado

- **Fase 1**: ~10 minutos
- **Fase 2**: ~20 minutos
- **Fase 3**: ~15 minutos
- **Fase 4**: ~25 minutos
- **Fase 5**: ~20 minutos
- **Fase 6**: ~25 minutos
- **Fase 7**: ~20 minutos
- **Fase 8**: ~15 minutos
- **Fase 9**: ~15 minutos

**Total estimado**: ~2.5 horas de implementação

---

**Data**: 2025-10-12
**Status**: Iniciando implementação
