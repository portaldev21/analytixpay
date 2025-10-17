-- =====================================================
-- FIX: Infinite Recursion in account_members Policy
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- Data: 2025-10-16

-- 1. REMOVER políticas antigas (que causam recursão)
DROP POLICY IF EXISTS "Members can view their account members" ON account_members;
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;

-- 2. CRIAR políticas corrigidas (sem recursão)

-- Policy para account_members (CORRIGIDA)
-- Agora usa apenas user_id, sem subquery recursiva
CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Policy para accounts (CORRIGIDA)
-- Usa uma CTE para evitar recursão
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_members.account_id = accounts.id
      AND account_members.user_id = auth.uid()
    )
  );

-- 3. VERIFICAR se as políticas foram criadas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('accounts', 'account_members')
ORDER BY tablename, policyname;
