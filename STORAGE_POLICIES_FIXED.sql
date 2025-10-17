-- =====================================================
-- POLÍTICAS DE STORAGE PARA BUCKET 'invoices'
-- Execute este SQL após criar o bucket 'invoices'
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

-- ✅ PRONTO! As 3 políticas foram criadas.
-- Agora teste fazer upload de um PDF em: http://localhost:3000/invoices
