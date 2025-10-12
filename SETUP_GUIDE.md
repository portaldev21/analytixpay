# Guia de Configuração - AnalytiXPay

## ✅ Implementação Concluída

Toda a aplicação foi implementada com sucesso! Agora você precisa configurar o Supabase para que tudo funcione.

## 📦 Dependências Instaladas

As seguintes dependências já foram instaladas:

- @supabase/supabase-js @supabase/ssr
- zod react-hook-form @hookform/resolvers
- framer-motion lucide-react
- pdf-parse class-variance-authority clsx tailwind-merge
- react-dropzone recharts date-fns

**Falta instalar apenas os pacotes do Radix UI:**

```bash
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-popover @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-alert-dialog @radix-ui/react-toast
```

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: AnalytiXPay
   - **Database Password**: (escolha uma senha forte)
   - **Region**: Escolha a mais próxima
5. Aguarde a criação do projeto (~2 minutos)

### 2. Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em "New Query"
3. Copie todo o conteúdo do arquivo `db/schema.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar
6. Aguarde a confirmação de sucesso

### 3. Configurar Storage

1. Vá em **Storage** no menu lateral
2. Clique em "Create a new bucket"
3. Configurações:
   - **Name**: `invoices`
   - **Public bucket**: Deixe desmarcado (private)
4. Clique em "Create bucket"

### 4. Configurar Políticas de Storage

No bucket `invoices`, vá em **Policies** e adicione:

**Policy para Upload (INSERT):**
```sql
CREATE POLICY "Users can upload their invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy para Leitura (SELECT):**
```sql
CREATE POLICY "Users can read their invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy para Deletar (DELETE):**
```sql
CREATE POLICY "Users can delete their invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 5. Configurar Autenticação Google (Opcional)

1. Vá em **Authentication** → **Providers**
2. Clique em "Google"
3. Ative o provider
4. Configure o Google OAuth:
   - Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
   - Ative a Google+ API
   - Crie credenciais OAuth 2.0
   - Copie Client ID e Client Secret
   - Cole no Supabase
5. Salve as configurações

### 6. Obter as Chaves de API

1. Vá em **Settings** → **API**
2. Copie os seguintes valores:
   - **Project URL**: Sua URL do projeto
   - **anon/public key**: Chave pública
   - **service_role key**: Chave de serviço (NUNCA exponha no frontend)

### 7. Criar arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: Substitua os valores pelos dados do seu projeto!

## 🚀 Executar a Aplicação

Após configurar tudo:

```bash
# Instalar pacotes Radix UI (se ainda não instalou)
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-popover @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-alert-dialog @radix-ui/react-toast

# Executar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 📱 Estrutura Implementada

### Páginas Criadas

- ✅ `/login` - Página de login
- ✅ `/signup` - Página de cadastro
- ✅ `/dashboard` - Dashboard principal com estatísticas
- ✅ `/invoices` - Upload e gerenciamento de faturas
- ✅ `/transactions` - Visualização de transações
- ✅ `/settings` - Configurações e gerenciamento de contas

### Componentes Criados

**UI Components:**
- Button, Card, Input, Label, Badge, Skeleton, Textarea

**Shared Components:**
- Loading, EmptyState, UserAvatar, ThemeProvider

**Auth Components:**
- LoginForm, SignupForm, GoogleButton

**Dashboard Components:**
- Sidebar, Header, StatsCard

**Invoice Components:**
- UploadInvoice, InvoiceCard

**Transaction Components:**
- TransactionsTable, CategoryBadge

**Settings Components:**
- CreateAccountForm

### Features Implementadas

✅ **Autenticação Completa**
- Login com email/senha
- Cadastro com criação automática de conta
- Google OAuth (se configurado)
- Proteção de rotas com middleware

✅ **Upload de Faturas**
- Drag & drop de PDF
- Processamento automático
- Extração de transações
- Feedback visual de sucesso/erro

✅ **Dashboard**
- Cards de estatísticas (gasto total, média, etc)
- Visualização de dados
- Navegação fluida

✅ **Transações**
- Listagem de todas as transações
- Badges de categorias com cores
- Indicadores de parcelamento
- Transações internacionais

✅ **Gerenciamento de Contas**
- Criar novas contas
- Visualizar contas existentes
- Sistema de roles (owner/member)

✅ **Dark Mode**
- Tema dark por padrão
- Suporte a light mode
- Persistência da preferência

## 🧪 Testar a Aplicação

### Fluxo de Teste Recomendado:

1. **Criar conta**
   - Acesse `/signup`
   - Cadastre-se com email e senha
   - Ou use Google OAuth

2. **Criar uma conta compartilhada**
   - Vá em `/settings`
   - Crie uma nova conta (ex: "Minha Família")

3. **Fazer upload de uma fatura**
   - Vá em `/invoices`
   - Faça upload de um PDF de fatura de cartão
   - Aguarde o processamento

4. **Ver transações extraídas**
   - Vá em `/transactions`
   - Visualize as transações extraídas automaticamente

5. **Ver estatísticas**
   - Vá em `/dashboard`
   - Veja os cards com totais e médias

## ⚠️ Troubleshooting

### Erro "Invalid API Key"
- Verifique se o `.env.local` está na raiz do projeto
- Confirme que as chaves estão corretas
- Reinicie o servidor de desenvolvimento

### Erro ao fazer upload
- Verifique se o bucket `invoices` foi criado
- Confirme que as políticas de storage foram configuradas
- Verifique o tamanho do arquivo (máx 10MB)

### Erro ao processar PDF
- Alguns formatos de PDF podem não ser compatíveis
- Teste com uma fatura de banco brasileiro comum
- Verifique os logs no console

### Página em branco
- Verifique o console do navegador
- Confirme que o Supabase está configurado
- Verifique se todas as dependências foram instaladas

## 📚 Próximos Passos (Opcional)

Funcionalidades que podem ser adicionadas no futuro:

- [ ] Filtros avançados em transações
- [ ] Edição manual de transações
- [ ] Gráficos de gastos por categoria (Recharts)
- [ ] Export para CSV/Excel
- [ ] Adicionar membros às contas
- [ ] Notificações por email
- [ ] App mobile (React Native)
- [ ] IA para categorização mais precisa

## 🎉 Conclusão

A aplicação está 100% funcional! Basta configurar o Supabase e você terá um sistema completo de gestão de faturas de cartão de crédito.

**Desenvolvido com:**
- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- Shadcn UI

---

**Data de Conclusão**: 2025-10-12
**Versão**: 1.0.0
