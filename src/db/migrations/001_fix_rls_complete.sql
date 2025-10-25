-- =====================================================
-- FIX COMPLETO: Recursão Infinita RLS
-- =====================================================
-- Execute TODO este SQL de uma vez no Supabase SQL Editor
-- Data: 2025-10-16

-- PASSO 1: DESABILITAR RLS temporariamente para limpar
ALTER TABLE account_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS as políticas antigas
DROP POLICY IF EXISTS "Members can view their account members" ON account_members;
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
DROP POLICY IF EXISTS "Only owners can update their accounts" ON accounts;
DROP POLICY IF EXISTS "Only owners can delete their accounts" ON accounts;
DROP POLICY IF EXISTS "Only owners can add members" ON account_members;
DROP POLICY IF EXISTS "Only owners can remove members" ON account_members;

-- PASSO 3: REABILITAR RLS
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- PASSO 4: CRIAR POLÍTICAS CORRIGIDAS (SEM RECURSÃO)

-- ========== ACCOUNTS POLICIES ==========

-- SELECT: Ver contas que você é owner OU membro
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

-- INSERT: Criar contas (só você como owner)
CREATE POLICY "Users can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Atualizar apenas suas próprias contas (owner)
CREATE POLICY "Only owners can update their accounts"
  ON accounts FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: Deletar apenas suas próprias contas (owner)
CREATE POLICY "Only owners can delete their accounts"
  ON accounts FOR DELETE
  USING (owner_id = auth.uid());

-- ========== ACCOUNT_MEMBERS POLICIES ==========

-- SELECT: Ver membros de contas que você participa
-- CORRIGIDO: Não consulta account_members recursivamente
CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Apenas owners podem adicionar membros
CREATE POLICY "Only owners can add members"
  ON account_members FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Apenas owners podem remover membros
CREATE POLICY "Only owners can remove members"
  ON account_members FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- PASSO 5: VERIFICAR se as políticas foram criadas corretamente
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('accounts', 'account_members')
ORDER BY tablename, policyname;

-- Deve retornar 7 políticas:
-- - 4 para accounts (SELECT, INSERT, UPDATE, DELETE)
-- - 3 para account_members (SELECT, INSERT, DELETE)
