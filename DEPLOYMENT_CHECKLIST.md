# Checklist de Deploy - AnalytiXPay

## Status Atual
- ✅ Build corrigido (erro de TypeScript resolvido)
- ⚠️ Configuração do Supabase incompleta
- ⚠️ Variáveis de ambiente faltando
- ❌ Ainda não está pronto para produção

---

## Passos para Colocar no Ar

### 1. ✅ Corrigir Build (CONCLUÍDO)
- [x] Corrigir erro de TypeScript em `account.actions.ts`
- [x] Testar build: `npm run build`

### 2. ⚠️ Configurar Supabase (PENDENTE)

#### 2.1. Obter Service Role Key
1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq
2. Vá em **Settings** → **API**
3. Copie a **service_role** key (secret)
4. Cole no `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
```

**⚠️ IMPORTANTE:** Esta chave é secreta e NÃO deve ser commitada no git!

#### 2.2. Aplicar Schema do Banco de Dados
1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/editor
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie TODO o conteúdo de `src/db/schema.sql`
5. Execute o SQL
6. Verifique se todas as tabelas foram criadas:
   - ✅ accounts
   - ✅ account_members
   - ✅ invoices
   - ✅ transactions
   - ✅ categories
   - ✅ profiles

#### 2.3. Criar Storage Bucket
1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/storage/buckets
2. Clique em **New bucket**
3. Configure:
   - **Name:** `invoices`
   - **Public:** ❌ Deixe DESMARCADO (bucket privado)
4. Clique em **Create bucket**

#### 2.4. Configurar Políticas de Storage
1. Clique no bucket `invoices`
2. Vá em **Policies**
3. Adicione as 3 políticas (estão comentadas no final de `src/db/schema.sql`):
   - Upload policy (INSERT)
   - Read policy (SELECT)
   - Delete policy (DELETE)

**SQL das políticas:**
```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload their own invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM account_members WHERE user_id = auth.uid()
  )
);

-- Policy 2: Read
CREATE POLICY "Users can read invoices from their accounts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM account_members WHERE user_id = auth.uid()
  )
);

-- Policy 3: Delete
CREATE POLICY "Only owners can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM accounts WHERE owner_id = auth.uid()
  )
);
```

#### 2.5. Configurar Google OAuth (Opcional mas Recomendado)
1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/auth/providers
2. Clique em **Google**
3. Habilite o provider
4. Configure:
   - **Client ID:** (obter no Google Cloud Console)
   - **Client Secret:** (obter no Google Cloud Console)
5. Salve

**Para obter credenciais do Google:**
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou use um existente
3. Vá em **APIs & Services** → **Credentials**
4. Crie **OAuth 2.0 Client ID**
5. Configure:
   - **Application type:** Web application
   - **Authorized redirect URIs:**
     - `https://qzczyicspbizosjogmlq.supabase.co/auth/v1/callback`

### 3. ⚠️ Testar Localmente (PENDENTE)

Após completar as configurações acima:

```bash
# 1. Verificar .env.local
cat .env.local

# 2. Instalar dependências (se necessário)
npm install

# 3. Fazer build
npm run build

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

**Testes a fazer:**
- [ ] Acessar http://localhost:3000
- [ ] Criar uma conta (signup)
- [ ] Fazer login
- [ ] Criar um account (conta compartilhada)
- [ ] Upload de PDF de fatura
- [ ] Verificar se transações foram extraídas
- [ ] Visualizar dashboard
- [ ] Testar logout

### 4. ⚠️ Preparar para Deploy em Produção (PENDENTE)

#### 4.1. Criar .env.example
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 4.2. Atualizar .gitignore
Verificar se está ignorando:
```
.env.local
.env*.local
.vercel
```

### 5. ⚠️ Deploy na Vercel (PENDENTE)

#### 5.1. Criar Projeto na Vercel
1. Acesse: https://vercel.com/new
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (será gerado pela Vercel)

#### 5.2. Configurar Domínio Customizado (Opcional)
1. Vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

#### 5.3. Atualizar URL no Supabase
1. Vá em Supabase → **Authentication** → **URL Configuration**
2. Adicione a URL da Vercel em:
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** `https://seu-app.vercel.app/**`

### 6. ⚠️ Pós-Deploy (PENDENTE)

- [ ] Testar todos os fluxos em produção
- [ ] Verificar logs de erro na Vercel
- [ ] Configurar monitoramento (Sentry, LogRocket, etc.)
- [ ] Configurar backup do banco de dados
- [ ] Documentar processo de rollback

---

## Checklist Rápido

### Desenvolvimento (Local)
- [x] Código compilando sem erros
- [ ] .env.local configurado com SERVICE_ROLE_KEY
- [ ] Schema SQL aplicado no Supabase
- [ ] Storage bucket criado
- [ ] Políticas de Storage configuradas
- [ ] Testado localmente

### Produção (Vercel)
- [ ] Repositório no GitHub atualizado
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy realizado
- [ ] URL de callback configurada no Supabase
- [ ] OAuth configurado (se aplicável)
- [ ] Testado em produção

---

## Problemas Conhecidos

### ⚠️ SERVICE_ROLE_KEY não configurada
**Impacto:** Algumas operações administrativas podem falhar
**Solução:** Obter a chave no Supabase e adicionar ao .env.local

### ⚠️ Schema do banco pode não estar aplicado
**Impacto:** Aplicação não funcionará corretamente
**Solução:** Executar todo o conteúdo de `src/db/schema.sql` no SQL Editor do Supabase

### ⚠️ Storage bucket pode não existir
**Impacto:** Upload de PDFs falhará
**Solução:** Criar bucket `invoices` (privado) no Supabase Storage

---

## Comandos Úteis

```bash
# Verificar build
npm run build

# Rodar localmente
npm run dev

# Linter
npm run lint

# Formatar código
npm run format

# Verificar status git
git status

# Commit
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

---

## Próximos Passos IMEDIATOS

1. **Obter SERVICE_ROLE_KEY do Supabase** e adicionar ao `.env.local`
2. **Aplicar schema SQL** no Supabase SQL Editor
3. **Criar bucket `invoices`** no Supabase Storage
4. **Testar localmente** com `npm run dev`
5. **Deploy na Vercel** quando tudo estiver funcionando

---

## Documentos de Referência

- [QUICKSTART.md](./QUICKSTART.md) - Setup rápido
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guia detalhado
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Arquitetura
- [CLAUDE.md](./CLAUDE.md) - Guia para IA
- [README.md](./README.md) - Visão geral do projeto
