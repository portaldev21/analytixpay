# AnalytiXPay - Lista de Tarefas Pendentes

## ✅ Concluído

- [x] Documentação completa do projeto (PROJECT_DOCUMENTATION.md)
- [x] Instruções de instalação (INSTALLATION.md)
- [x] Schema SQL do banco de dados (db/schema.sql)
- [x] Tipos TypeScript (db/types.ts)
- [x] Estrutura de pastas criada
- [x] Utilitários (src/lib/utils.ts)
- [x] Validações com Zod (src/lib/validations/index.ts)
- [x] Configuração Supabase client/server/middleware
- [x] Middleware de autenticação (middleware.ts)
- [x] Parser de PDF (src/lib/pdf/parser.ts)
- [x] Server Actions:
  - [x] auth.actions.ts (login, signup, logout, Google OAuth)
  - [x] account.actions.ts (criar conta, adicionar/remover membros)
  - [x] invoice.actions.ts (upload, listar, deletar faturas)
  - [x] transaction.actions.ts (listar, atualizar, deletar, stats)

## 📦 Próximo Passo - Instalação de Dependências

Antes de continuar, execute os comandos abaixo:

```bash
# 1. Instalar dependências principais
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers framer-motion lucide-react pdf-parse class-variance-authority clsx tailwind-merge

# 2. Instalar dependências de desenvolvimento
npm install -D @types/pdf-parse

# 3. Inicializar Shadcn UI
npx shadcn@latest init

# 4. Instalar componentes Shadcn UI
npx shadcn@latest add button card input label table dialog dropdown-menu select tabs avatar badge progress toast form popover calendar command separator skeleton switch textarea
```

## 🚀 Tarefas Pendentes

### 1. Configuração Inicial

- [ ] Criar arquivo `.env.local` com as variáveis de ambiente (veja INSTALLATION.md)
- [ ] Configurar projeto no Supabase
- [ ] Executar schema SQL no Supabase (db/schema.sql)
- [ ] Criar bucket 'invoices' no Supabase Storage
- [ ] Configurar políticas de acesso do Storage

### 2. Atualizar Configurações

- [ ] Atualizar `src/app/globals.css` com os estilos do Shadcn UI
- [ ] Atualizar `tsconfig.json` para incluir paths (@/*)
- [ ] Atualizar `next.config.ts` para incluir configuração do webpack para pdf-parse

### 3. Componentes Shared

Criar em `src/components/shared/`:

- [ ] `Loading.tsx` - Loading spinner
- [ ] `ErrorBoundary.tsx` - Error boundary component
- [ ] `EmptyState.tsx` - Empty state placeholder
- [ ] `ConfirmDialog.tsx` - Confirmation dialog
- [ ] `UserAvatar.tsx` - User avatar component

### 4. Páginas de Autenticação

Criar estrutura de pastas e páginas:

```
src/app/(auth)/
├── layout.tsx         # Layout sem sidebar
├── login/
│   └── page.tsx       # Página de login
└── signup/
    └── page.tsx       # Página de signup
```

Componentes necessários:
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/auth/SignupForm.tsx`
- [ ] `src/components/auth/GoogleButton.tsx`

### 5. Layout do Dashboard

Criar estrutura:

```
src/app/(dashboard)/
├── layout.tsx         # Layout com sidebar
├── dashboard/
│   └── page.tsx       # Dashboard principal
├── invoices/
│   └── page.tsx       # Página de faturas
├── transactions/
│   └── page.tsx       # Página de transações
└── settings/
    └── page.tsx       # Configurações da conta
```

Componentes necessários:
- [ ] `src/components/dashboard/Sidebar.tsx`
- [ ] `src/components/dashboard/Header.tsx`
- [ ] `src/components/dashboard/StatsCard.tsx`
- [ ] `src/components/dashboard/CategoryChart.tsx`
- [ ] `src/components/dashboard/RecentTransactions.tsx`

### 6. Página de Invoices

Componentes necessários:
- [ ] `src/components/invoices/UploadInvoice.tsx` - Drag & drop de PDF
- [ ] `src/components/invoices/InvoiceCard.tsx` - Card de fatura
- [ ] `src/components/invoices/InvoiceList.tsx` - Lista de faturas
- [ ] `src/components/invoices/DeleteInvoiceDialog.tsx` - Confirmar exclusão

### 7. Página de Transactions

Componentes necessários:
- [ ] `src/components/transactions/TransactionsTable.tsx` - Tabela de transações
- [ ] `src/components/transactions/TransactionFilters.tsx` - Filtros
- [ ] `src/components/transactions/EditTransactionDialog.tsx` - Editar transação
- [ ] `src/components/transactions/CategoryBadge.tsx` - Badge de categoria
- [ ] `src/components/transactions/ExportButton.tsx` - Exportar para CSV

### 8. Página de Settings

Componentes necessários:
- [ ] `src/components/settings/AccountSelector.tsx` - Seletor de conta
- [ ] `src/components/settings/CreateAccountDialog.tsx` - Criar nova conta
- [ ] `src/components/settings/MembersList.tsx` - Lista de membros
- [ ] `src/components/settings/AddMemberDialog.tsx` - Adicionar membro
- [ ] `src/components/settings/ProfileSettings.tsx` - Configurações de perfil

### 9. Hooks Customizados

Criar em `src/hooks/`:

- [ ] `useAccount.ts` - Hook para gerenciar conta atual
- [ ] `useTransactions.ts` - Hook para transações
- [ ] `useInvoices.ts` - Hook para faturas
- [ ] `useToast.ts` - Hook para notificações

### 10. Página Inicial

- [ ] Atualizar `src/app/page.tsx` - Landing page ou redirect para dashboard

### 11. Atualizar Root Layout

- [ ] Atualizar `src/app/layout.tsx` com:
  - Theme provider (dark mode)
  - Toast provider
  - Metadata correta

### 12. Estilos e Animações

- [ ] Adicionar animações com Framer Motion nos componentes
- [ ] Configurar transições de página
- [ ] Adicionar skeleton loaders

## 🎨 Exemplo de Componente - UploadInvoice.tsx

```typescript
'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { uploadInvoice } from '@/actions/invoice.actions'
import { cn } from '@/lib/utils'

export function UploadInvoice({ accountId }: { accountId: string }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('accountId', accountId)

    const result = await uploadInvoice(formData)
    setUploading(false)

    if (result.success) {
      // Show success toast
    } else {
      // Show error toast
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  return (
    <Card
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed cursor-pointer transition-colors',
        isDragActive && 'border-primary bg-primary/5'
      )}
    >
      <input {...getInputProps()} />
      <div className="p-8 text-center">
        {uploading ? (
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        )}
        <h3 className="mt-4 font-semibold">Upload de Fatura</h3>
        <p className="text-sm text-muted-foreground">
          Arraste um PDF ou clique para selecionar
        </p>
      </div>
    </Card>
  )
}
```

## 📝 Ordem Recomendada de Desenvolvimento

1. **Instalar todas as dependências** (veja seção acima)
2. **Configurar Supabase** (criar projeto, executar SQL, configurar Storage)
3. **Atualizar globals.css** com estilos do Shadcn
4. **Criar componentes shared** (Loading, ErrorBoundary, etc)
5. **Implementar páginas de autenticação** (login/signup)
6. **Criar layout do dashboard** (Sidebar, Header)
7. **Implementar dashboard principal** (cards de stats, gráficos)
8. **Criar página de Invoices** (upload e listagem)
9. **Criar página de Transactions** (tabela com filtros)
10. **Criar página de Settings** (gerenciar membros)
11. **Testar todas as funcionalidades**
12. **Adicionar animações e polish final**

## 🔧 Configurações Adicionais Necessárias

### tsconfig.json

Adicionar/verificar:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### next.config.ts

Adicionar configuração para pdf-parse:

```typescript
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};
```

### .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Recursos Úteis

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Zod Docs](https://zod.dev)

## 🎯 Features Futuras

- [ ] Integração com IA (OpenAI) para OCR avançado
- [ ] Notificações por email
- [ ] Export para Excel
- [ ] Relatórios personalizados
- [ ] App mobile
- [ ] Gráficos interativos com Recharts
- [ ] Suporte a múltiplos idiomas

---

**Nota**: Todos os arquivos principais já foram criados. Basta seguir esta lista para completar a aplicação!
