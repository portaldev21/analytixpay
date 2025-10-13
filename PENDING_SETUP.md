# ⚠️ Configurações Pendentes

## 📝 Ações necessárias do usuário

### 1. Adicionar SUPABASE_SERVICE_ROLE_KEY ao .env.local

O arquivo `.env.local` está **incompleto**. Você precisa adicionar a chave de serviço do Supabase.

#### Como fazer:

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **Settings** → **API**
3. Copie o valor de **service_role key** (⚠️ NUNCA exponha esta chave no frontend!)
4. Adicione ao arquivo `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

#### Arquivo .env.local atual:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qzczyicspbizosjogmlq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=          # ← ADICIONE AQUI!
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ← Adicione esta linha também
```

### 2. Executar o Schema SQL no Supabase

Se ainda não executou, siga estes passos:

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor** (menu lateral)
3. Clique em "New Query"
4. Copie todo o conteúdo do arquivo `db/schema.sql`
5. Cole no editor e clique em "Run"

### 3. Criar o Bucket de Storage

1. Vá em **Storage** no Supabase
2. Clique em "Create a new bucket"
3. Nome: `invoices`
4. Public: **OFF** (deixe desmarcado)
5. Clique em "Create bucket"

### 4. Configurar Políticas de Storage

No bucket `invoices`, vá em **Policies** e execute estas queries SQL:

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload their invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Read
CREATE POLICY "Users can read their invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Delete
CREATE POLICY "Users can delete their invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ Checklist

Marque conforme for completando:

- [ ] SERVICE_ROLE_KEY adicionada ao .env.local
- [ ] APP_URL adicionada ao .env.local
- [ ] Schema SQL executado no Supabase
- [ ] Bucket 'invoices' criado no Storage
- [ ] Políticas de Storage configuradas
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Testado criação de conta
- [ ] Testado upload de PDF

## 🚀 Próximo Passo

Após completar todas as configurações acima, execute:

```bash
npm run dev
```

E acesse: http://localhost:3000

## 📚 Guias Úteis

- [QUICKSTART.md](./QUICKSTART.md) - Início rápido
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guia detalhado
- [README.md](./README.md) - Documentação principal

---

**Status atual**: ⚠️ Configuração incompleta
**Criado em**: 2025-10-12
