# 🗂️ Criar Bucket de Storage - URGENTE

## ❌ Erro: "Bucket not found"

Você está vendo esse erro porque o bucket `invoices` não existe no Supabase Storage.

---

## ✅ Solução (5 minutos)

### **Método 1: Via Interface do Supabase (Recomendado)**

1. **Acesse o Storage:**
   - Vá em: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/storage/buckets
   - Ou navegue: Supabase Dashboard → Storage (menu lateral)

2. **Criar o Bucket:**
   - Clique em **"New bucket"** ou **"Create bucket"**
   - Preencha:
     - **Name**: `invoices` (exatamente assim, sem espaços)
     - **Public**: **OFF** ❌ (deixe desmarcado - bucket privado)
   - Clique em **"Create bucket"** ou **"Save"**

3. **Configurar Políticas de Acesso:**

   Após criar o bucket, você precisa adicionar políticas RLS para permitir upload/download.

   Vá em: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/sql/new

   Execute este SQL:

```sql
-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET 'invoices'
-- =====================================================

-- Policy 1: Permitir UPLOAD de faturas
CREATE POLICY "Users can upload invoices to their accounts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text
    FROM account_members
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Permitir LER faturas das suas contas
CREATE POLICY "Users can view invoices from their accounts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text
    FROM account_members
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Permitir DELETAR faturas (apenas owners)
CREATE POLICY "Owners can delete invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM accounts
    WHERE owner_id = auth.uid()
  )
);

-- Verificar se as políticas foram criadas
SELECT * FROM storage.policies WHERE bucket_id = 'invoices';
```

---

### **Método 2: Via SQL (Alternativo)**

Se preferir criar tudo via SQL, execute:

```sql
-- 1. Criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Adicionar as políticas (mesmo SQL do Método 1)
CREATE POLICY "Users can upload invoices to their accounts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text
    FROM account_members
    WHERE user_id = auth.uid()
  )
);

-- ... (resto das políticas igual ao Método 1)
```

---

## 🧪 Testar

Após criar o bucket e as políticas:

1. Recarregue a página de Faturas: http://localhost:3000/invoices
2. O erro "Bucket not found" deve desaparecer
3. Tente fazer upload de um PDF de fatura de cartão
4. Deve funcionar! ✅

---

## 📝 Como o Storage Funciona

```
storage/
└── buckets/
    └── invoices/                    ← Bucket criado
        └── {account_id}/            ← Pasta por conta
            └── 1234567890.pdf       ← PDFs das faturas
            └── 9876543210.pdf
```

**Estrutura:**
- Cada conta tem sua própria pasta dentro do bucket
- Os PDFs são salvos como: `{account_id}/{timestamp}.pdf`
- As políticas RLS garantem que você só acessa PDFs das suas contas

---

## ⚠️ Problemas Comuns

### "Ainda aparece erro após criar bucket"
- Verifique se o nome é **exatamente** `invoices` (minúsculas, plural)
- Verifique se as políticas SQL foram executadas com sucesso
- Recarregue a página (Ctrl+F5)

### "Unauthorized" ao fazer upload
- As políticas SQL não foram executadas
- Volte e execute as 3 políticas de storage

### "File too large"
- Máximo 10MB por arquivo
- Verifique o tamanho do PDF

---

## 📚 Documentação Oficial

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload](https://supabase.com/docs/guides/storage/uploads)

---

**Status**: ⚠️ URGENTE - Executar agora para sistema funcionar
**Tempo**: 5 minutos
**Dificuldade**: Fácil

🤖 Generated with [Claude Code](https://claude.com/claude-code)
