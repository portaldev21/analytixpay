# Session Context - DB Setup & Architecture Review

## Session ID: 2
## Date: 2026-01-01
## Status: COMPLETED

---

## Summary

Session focused on understanding the system architecture and preparing for production reset.

---

## What Was Done

### 1. CLAUDE.md Updated
- Added `budget.actions.ts` to Server Actions list
- Added Budget library documentation (`src/lib/budget/`)
- Added "Rolling Budget System (Orcamento Fluido)" section
- Updated main tables list with budget tables

### 2. Architecture Clarification
Explained how the system handles:
- **Installments**: `installment` field stores "3/10", forecast projects future months
- **Date vs Billing Date**: `date` = purchase date, `billing_date` = invoice date
- **Budget flow**: Manual expenses → Invoice upload → Reconciliation

### 3. Database Reset SQL Provided
```sql
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE account_members CASCADE;
TRUNCATE TABLE accounts CASCADE;
DELETE FROM storage.objects WHERE bucket_id = 'invoices';
```

### 4. Added `npm run db:types` Script
- Installed `supabase` CLI as dev dependency
- Added script: `"db:types": "supabase gen types typescript --project-id qzczyicspbizosjogmlq > src/db/database.types.ts"`

---

## Pending Actions (User)

1. **Run migrations in Supabase SQL Editor:**
   - `src/db/migrations/005_add_chat_tables.sql`
   - `src/db/migrations/006_add_budget_tables.sql`

2. **Login to Supabase CLI:**
   ```bash
   npx supabase login
   ```

3. **Generate types:**
   ```bash
   npm run db:types
   ```

4. **Optional:** Migrate from manual `types.ts` to generated `database.types.ts`

---

## Files Modified

- `CLAUDE.md` - Added budget documentation
- `package.json` - Added `db:types` script + `supabase` dev dependency

---
