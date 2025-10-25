# 🗄️ Database - AnalytiXPay

Estrutura e gerenciamento do banco de dados PostgreSQL (Supabase).

---

## 📁 Estrutura de Pastas

```
src/db/
├── README.md                           # Este arquivo
├── schema.sql                          # Schema principal (setup inicial)
├── types.ts                            # TypeScript types do banco
├── migrations/                         # Migrations e hotfixes aplicados
│   ├── 001_fix_rls_complete.sql       # Fix: RLS recursion (2025-10-16)
│   ├── 002_fix_rls_recursion.sql      # Fix: RLS recursion alternativo
│   └── 003_storage_policies_fixed.sql # Fix: Storage policies
└── functions/                          # SQL functions (futuro)
```

---

## 🗃️ Arquivos Principais

### schema.sql ⭐
**Schema principal do banco de dados**

Execute este arquivo no **Supabase SQL Editor** durante o setup inicial.

**Contém:**
- Criação de todas as tabelas
- Row Level Security (RLS) policies
- Triggers e functions
- Indexes
- Constraints

**Tabelas criadas:**
- `profiles` - Perfis de usuários
- `accounts` - Contas compartilhadas
- `account_members` - Membros das contas (many-to-many)
- `invoices` - Faturas enviadas
- `transactions` - Transações extraídas
- `categories` - Categorias de gastos

**Quando executar:**
- ✅ Primeira vez: setup inicial do projeto
- ✅ Reset completo: quando quiser recriar o banco do zero

**Como executar:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o conteúdo de `schema.sql`
4. Execute (Run)

---

### types.ts ⭐
**TypeScript types gerados a partir do schema**

Tipos type-safe para todas as tabelas do banco.

**Exports principais:**
- `Database` - Interface completa do banco
- `TAccount`, `TInvoice`, `TTransaction` - Row types
- `TAccountInsert`, `TInvoiceInsert` - Insert types
- `TAccountUpdate`, `TInvoiceUpdate` - Update types
- `TApiResponse<T>` - Response wrapper
- Extended types com joins

**Uso:**
```typescript
import type { TTransaction, TApiResponse } from '@/db/types'

const transaction: TTransaction = {
  id: '...',
  amount: 100.50,
  // ...
}
```

**Quando atualizar:**
- Após modificar `schema.sql`
- Após adicionar/remover colunas
- Após mudanças na estrutura do banco

---

## 🔄 Migrations

Pasta `migrations/` contém migrations e hotfixes já aplicados ao banco.

### 001_fix_rls_complete.sql
**Fix completo para recursão infinita no RLS**

**Problema resolvido:**
- Recursão infinita em policies de `account_members`
- Queries travando ao buscar contas

**Aplicado em:** 2025-10-16

**O que faz:**
1. Desabilita RLS temporariamente
2. Remove políticas antigas
3. Cria políticas corrigidas sem recursão
4. Reabilita RLS

**Status:** ✅ Aplicado em produção

---

### 002_fix_rls_recursion.sql
**Fix alternativo para recursão RLS**

**Abordagem diferente do fix anterior**

**Aplicado em:** 2025-10-16

**Status:** ✅ Aplicado (versão alternativa)

---

### 003_storage_policies_fixed.sql
**Políticas de Storage para bucket 'invoices'**

**O que faz:**
- Policy para upload de faturas
- Policy para leitura de faturas
- Policy para deleção de faturas

**Quando executar:**
- Após criar o bucket `invoices` no Supabase Storage

**Status:** ✅ Aplicado

---

## 🆕 Adicionando Novas Migrations

Quando precisar modificar o banco de dados:

### 1. Criar arquivo de migration

```bash
# Formato: XXX_description.sql
# Exemplo:
touch src/db/migrations/004_add_tags_to_transactions.sql
```

### 2. Escrever SQL

```sql
-- =====================================================
-- Migration: Add tags to transactions
-- Date: 2025-10-XX
-- =====================================================

-- Add column
ALTER TABLE transactions
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index
CREATE INDEX idx_transactions_tags ON transactions USING GIN (tags);

-- Update RLS policies if needed
-- ...
```

### 3. Executar no Supabase

1. Acesse SQL Editor no Supabase
2. Cole o conteúdo da migration
3. Execute

### 4. Atualizar types.ts

Se a migration adicionar/modificar colunas:

```bash
# Gerar types do Supabase (se tiver CLI instalado)
npx supabase gen types typescript --project-id <project-id> > src/db/types.ts

# Ou atualizar manualmente
```

### 5. Documentar

Adicione a migration neste README com:
- Descrição
- Data
- O que faz
- Status (aplicado/pendente)

---

## 🔐 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado para segurança.

### Princípios RLS no projeto:

1. **Isolamento por conta**
   - Usuários só veem dados das contas que pertencem
   - Queries filtradas automaticamente por `account_id`

2. **Controle de acesso**
   - `owner` - Pode tudo (adicionar membros, deletar conta)
   - `member` - Pode visualizar e criar transações

3. **Validação em múltiplas camadas**
   - RLS no banco (última linha de defesa)
   - Helpers no código (`requireAccountAccess()`)
   - Validação nas Server Actions

### Policies principais:

**accounts:**
- Users can view their own accounts
- Users can create accounts
- Only owners can update/delete

**account_members:**
- Members can view their account members
- Only owners can add/remove members

**invoices:**
- Members can view invoices
- Members can create invoices
- Only owners can delete invoices

**transactions:**
- Members can view transactions
- Members can create/update transactions
- Only owners can delete transactions

---

## 📊 Schema Overview

```
┌─────────────┐
│  profiles   │ (1:N with accounts via account_members)
└─────────────┘
       │
       │ N:M
       ▼
┌─────────────┐      ┌──────────────┐
│  accounts   │◄─────┤account_members│
└─────────────┘      └──────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│  invoices   │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐      ┌──────────────┐
│transactions │─────►│  categories  │
└─────────────┘      └──────────────┘
```

---

## 🛠️ SQL Functions (Futuro)

Pasta `functions/` para armazenar SQL functions customizadas.

**Exemplos planejados:**
- `get_invoices_summary()` - Summary otimizado com aggregation
- `calculate_monthly_stats()` - Stats mensais
- `cleanup_expired_sessions()` - Limpeza automática

---

## 📚 Referências

### Setup Inicial
- [docs/setup/INSTALLATION.md](../../docs/setup/INSTALLATION.md)
- [docs/setup/SETUP_GUIDE.md](../../docs/setup/SETUP_GUIDE.md)
- [docs/setup/CREATE_STORAGE_BUCKET.md](../../docs/setup/CREATE_STORAGE_BUCKET.md)

### Documentação Supabase
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

## 🔒 Segurança

### ⚠️ NUNCA commite:
- `.env.local` com credenciais
- Service role keys
- Senhas de produção

### ✅ Sempre:
- Use RLS em todas as tabelas
- Valide acesso nas Server Actions
- Use prepared statements (Supabase já faz)
- Sanitize user input

---

## 🚀 Próximos Passos

### Melhorias Planejadas

1. **Query Optimization**
   - [ ] Criar SQL function `get_invoices_summary()` (N+1 fix)
   - [ ] Indexes adicionais para queries frequentes

2. **Data Management**
   - [ ] Soft deletes para auditoria
   - [ ] Archiving de dados antigos

3. **Monitoring**
   - [ ] Logs de queries lentas
   - [ ] Alertas de erro RLS

---

**Última atualização:** 2025-10-24
**Versão do schema:** 1.0
**Total de migrations:** 3
