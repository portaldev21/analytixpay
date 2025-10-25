-- Migration: Add Performance Indexes for Dashboard
-- Date: 2025-10-24
-- Description: Add composite indexes to optimize dashboard queries

-- ============================================
-- Index for category aggregations
-- ============================================
-- Used by: getTransactionStats for category breakdown
CREATE INDEX IF NOT EXISTS idx_transactions_account_category
ON transactions(account_id, category);

-- ============================================
-- Index for date-based queries
-- ============================================
-- Used by: getSpendingTrends, period filtering
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
ON transactions(account_id, date DESC);

-- ============================================
-- Index for amount sorting
-- ============================================
-- Used by: getTopExpenses
CREATE INDEX IF NOT EXISTS idx_transactions_account_amount
ON transactions(account_id, amount DESC);

-- ============================================
-- Composite index for filtered aggregations
-- ============================================
-- Used by: Complex queries with both date and category filters
CREATE INDEX IF NOT EXISTS idx_transactions_account_date_category
ON transactions(account_id, date, category);

-- ============================================
-- Index for invoice summaries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_account_created
ON invoices(account_id, created_at DESC);

-- ============================================
-- Analyze tables for query planner optimization
-- ============================================
ANALYZE transactions;
ANALYZE invoices;

-- ============================================
-- Verify indexes were created
-- ============================================
-- Run this query to verify:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('transactions', 'invoices')
-- ORDER BY tablename, indexname;
