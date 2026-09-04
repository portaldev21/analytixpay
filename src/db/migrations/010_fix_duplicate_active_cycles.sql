-- Migration 010: stop duplicate active week cycles
--
-- getActiveCycle used PostgREST .single(), which answers PGRST116 both when
-- there is no row and when there is more than one. The code read that as "no
-- active cycle" and created another one, so every page load added a cycle.
-- The application side is fixed in the same change; this migration cleans up
-- what the bug already created and makes the database refuse a repeat.

-- 1. Point daily records at the oldest active cycle of their account, so the
--    cleanup below does not cascade-delete them.
WITH keeper AS (
  SELECT DISTINCT ON (account_id) account_id, id
  FROM week_cycles
  WHERE status = 'active'
  ORDER BY account_id, created_at ASC
)
UPDATE daily_records dr
SET cycle_id = k.id
FROM keeper k
WHERE dr.account_id = k.account_id
  AND dr.cycle_id <> k.id;

-- 2. Remove the surplus active cycles.
WITH keeper AS (
  SELECT DISTINCT ON (account_id) account_id, id
  FROM week_cycles
  WHERE status = 'active'
  ORDER BY account_id, created_at ASC
)
DELETE FROM week_cycles wc
USING keeper k
WHERE wc.account_id = k.account_id
  AND wc.status = 'active'
  AND wc.id <> k.id;

-- 3. Make it impossible to have two active cycles for the same account.
--    The trust boundary is the database, not the application code.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_week_cycles_one_active_per_account
  ON week_cycles (account_id)
  WHERE status = 'active';
