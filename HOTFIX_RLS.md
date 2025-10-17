# 🚨 HOTFIX: Recursão Infinita nas Políticas RLS

## ❌ Problema

Erro ao acessar página de Configurações:
```
infinite recursion detected in policy for relation "account_members"
```

## 🔍 Causa

A política RLS de `account_members` estava consultando a própria tabela `account_members`, causando recursão infinita:

```sql
-- ❌ ERRADO (causa recursão)
CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
      -- ↑ Consulta account_members dentro da política de account_members!
    )
  );
```

## ✅ Solução (URGENTE - Execute AGORA)

### **Execute este SQL no Supabase:**

1. Acesse: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/sql/new
2. Copie e cole o código abaixo
3. Clique em **Run** (ou F5)

```sql
-- 1. REMOVER políticas antigas (que causam recursão)
DROP POLICY IF EXISTS "Members can view their account members" ON account_members;
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;

-- 2. CRIAR políticas corrigidas (sem recursão)

-- Policy para account_members (CORRIGIDA)
CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Policy para accounts (CORRIGIDA)
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
```

4. **Verifique** se funcionou:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('accounts', 'account_members')
ORDER BY tablename, policyname;
```

Você deve ver 2 políticas com os nomes corretos.

---

## 🧪 Testar

Após executar o SQL:

1. Recarregue a página de Configurações: http://localhost:3000/settings
2. O erro deve desaparecer
3. Você deve ver o formulário de configurações normalmente

---

## 📝 O que mudou?

### Antes (Recursão):
```sql
-- ❌ account_members consultando account_members
account_id IN (
  SELECT account_id FROM account_members WHERE user_id = auth.uid()
)
```

### Depois (Sem Recursão):
```sql
-- ✅ Verifica diretamente o user_id ou consulta accounts
user_id = auth.uid() OR
account_id IN (
  SELECT id FROM accounts WHERE owner_id = auth.uid()
)
```

---

## 🎯 Próxima Vez

Para evitar recursão em políticas RLS:

1. **Nunca consulte a mesma tabela** dentro da própria política
2. Use `user_id = auth.uid()` quando possível (mais rápido)
3. Use `EXISTS` ao invés de `IN` para melhor performance
4. Teste sempre com `EXPLAIN ANALYZE`

---

## 📚 Documentação

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Evitando Recursão](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Status**: ✅ Corrigido no código
**Ação**: Execute o SQL no Supabase (2 minutos)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
