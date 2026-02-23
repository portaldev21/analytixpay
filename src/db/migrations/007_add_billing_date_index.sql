-- Migration: Add billing_date index for transactions
-- Date: 2026-02-23
-- Description: Add composite index on (account_id, billing_date) to optimize
-- dashboard stats, spending trends, and analytics queries that filter by billing_date.

-- ============================================
-- Index for billing_date-based queries
-- ============================================
-- Used by: getTransactionStatsWithComparison, getSpendingTrends, getTopExpenses
-- when dateType="billing"
CREATE INDEX IF NOT EXISTS idx_transactions_account_billing_date
ON transactions(account_id, billing_date DESC);

-- ============================================
-- Analyze table for query planner optimization
-- ============================================
ANALYZE transactions;
