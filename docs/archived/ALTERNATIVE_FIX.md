# 🔧 Fix Alternativo - Desabilitar RLS Temporariamente

## Se o erro persistir após executar FIX_RLS_COMPLETE.sql

### Opção 1: Desabilitar RLS temporariamente (TESTE RÁPIDO)

Execute no Supabase SQL Editor:

```sql
-- DESABILITAR RLS temporariamente para testar
ALTER TABLE account_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Isso remove a segurança! Use APENAS para testar localmente.

Depois de testar, **REABILITE**:
```sql
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
```

---

### Opção 2: Simplificar a Query (RECOMENDADO)

O problema pode estar na query complexa com relacionamentos aninhados.

**Execute este SQL:**

```sql
-- Política SUPER SIMPLES para account_members (teste)
DROP POLICY IF EXISTS "Members can view their account members" ON account_members;

CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (true);  -- Permite ver tudo (temporário para teste)
```

Se funcionar, você sabe que o problema é a política. Depois refine para:

```sql
-- Política melhorada (sem recursão)
DROP POLICY IF EXISTS "Members can view their account members" ON account_members;

CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    user_id = auth.uid()
  );
```

---

### Opção 3: Verificar se já existia account_member

O erro pode acontecer se você criou uma conta mas não foi adicionado à tabela `account_members`.

**Execute:**

```sql
-- Ver suas contas
SELECT * FROM account_members WHERE user_id = auth.uid();

-- Ver todas as contas
SELECT * FROM accounts WHERE owner_id = auth.uid();
```

Se não retornar nada, você precisa criar uma entrada:

```sql
-- Inserir você como membro da sua conta
INSERT INTO account_members (account_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM accounts
WHERE owner_id = auth.uid()
AND id NOT IN (
  SELECT account_id FROM account_members WHERE user_id = auth.uid()
);
```

---

### Opção 4: Verificar logs do Supabase

1. Vá em: https://supabase.com/dashboard/project/qzczyicspbizosjogmlq/logs/explorer
2. Procure por "infinite recursion"
3. Veja qual exatamente é a query que está causando o problema

---

### Opção 5: Recriar as tabelas do zero

⚠️ **ATENÇÃO: Isso apaga TODOS os dados!**

```sql
-- BACKUP primeiro!
-- Depois:

DROP TABLE IF EXISTS account_members CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Execute todo o schema.sql novamente
```

---

## 🎯 Minha Recomendação

Tente na ordem:

1. **Opção 2** - Simplificar política (mais seguro)
2. **Opção 3** - Verificar dados
3. **Opção 1** - Desabilitar RLS (só pra teste)
4. **Opção 4** - Ver logs
5. **Opção 5** - Recriar (último recurso)

---

## 📞 Debug Interativo

Me diga o resultado de executar:

```sql
-- 1. Quantas políticas existem?
SELECT COUNT(*) as total, tablename
FROM pg_policies
WHERE tablename IN ('accounts', 'account_members')
GROUP BY tablename;

-- 2. Você tem contas?
SELECT COUNT(*) FROM accounts WHERE owner_id = auth.uid();

-- 3. Você é membro de alguma conta?
SELECT COUNT(*) FROM account_members WHERE user_id = auth.uid();

-- 4. RLS está ativo?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('accounts', 'account_members');
```

Me passe os resultados e eu te ajudo a resolver!
