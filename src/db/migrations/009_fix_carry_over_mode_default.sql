-- Migration 009: fix carry_over_mode default
--
-- The default set in 006_add_budget_tables.sql was 'carry_deficit', which
-- keeps only the punitive half of the rolling balance: overspending rolls
-- into the next day while savings evaporate. That inverts the method this
-- budget is built on, and it fails silently because the system works fine
-- with the wrong mode.
--
-- 'carry_all' is symmetric: saving today raises tomorrow, overspending
-- today eats into it.
--
-- The application layer was fixed in the same change (upsertBudgetConfig
-- no longer writes 'carry_deficit' on insert, and no longer overwrites the
-- column on a partial update). This migration fixes the third layer, so any
-- insert that omits the column, from a script, a seed, or the Supabase
-- dashboard, lands on the right mode.

ALTER TABLE budget_configs
  ALTER COLUMN carry_over_mode SET DEFAULT 'carry_all';

COMMENT ON COLUMN budget_configs.carry_over_mode IS
  'How to handle balance at week end: reset, carry_all, carry_deficit, carry_credit. Default carry_all: savings and deficits both carry forward.';
