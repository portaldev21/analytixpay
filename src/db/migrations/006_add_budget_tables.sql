-- Migration: Add budget tables for Rolling Budget (Orcamento Fluido) feature
-- Version: 006
-- Date: 2024-12-29
-- Description: Creates tables for budget configuration, weekly cycles, daily records, and manual expenses

-- =============================================================================
-- BUDGET_CONFIGS TABLE - Account-level budget configuration
-- =============================================================================
CREATE TABLE IF NOT EXISTS budget_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  daily_base numeric(10,2) NOT NULL CHECK (daily_base > 0 AND daily_base <= 100000),
  week_start_day integer DEFAULT 1 CHECK (week_start_day >= 0 AND week_start_day <= 6), -- 0=Sun, 1=Mon...
  carry_over_mode text DEFAULT 'carry_deficit' CHECK (carry_over_mode IN ('reset', 'carry_all', 'carry_deficit', 'carry_credit')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- WEEK_CYCLES TABLE - Weekly budget cycles
-- =============================================================================
CREATE TABLE IF NOT EXISTS week_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  config_id uuid REFERENCES budget_configs(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  initial_budget numeric(10,2) NOT NULL, -- daily_base * 7
  carried_balance numeric(10,2) DEFAULT 0, -- Balance from previous cycle
  accumulated_balance numeric(10,2) DEFAULT 0, -- Current accumulated balance
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- DAILY_RECORDS TABLE - Daily budget tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  cycle_id uuid REFERENCES week_cycles(id) ON DELETE CASCADE NOT NULL,
  record_date date NOT NULL,
  base_budget numeric(10,2) NOT NULL,
  available_budget numeric(10,2) NOT NULL, -- Calculated: base + (accumulated / remaining_days)
  total_spent numeric(10,2) DEFAULT 0,
  daily_balance numeric(10,2) DEFAULT 0, -- available - spent
  remaining_days integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(account_id, record_date)
);

-- =============================================================================
-- BUDGET_EXPENSES TABLE - Manual expense entries
-- =============================================================================
CREATE TABLE IF NOT EXISTS budget_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  daily_record_id uuid REFERENCES daily_records(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  category text DEFAULT 'Outros',
  description text,
  expense_date date NOT NULL,
  expense_time time,
  -- Reconciliation fields
  reconciled_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  reconciliation_status text DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'unmatched', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Budget configs indexes
CREATE INDEX IF NOT EXISTS idx_budget_configs_account ON budget_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_budget_configs_active ON budget_configs(account_id, is_active);

-- Week cycles indexes
CREATE INDEX IF NOT EXISTS idx_week_cycles_account ON week_cycles(account_id);
CREATE INDEX IF NOT EXISTS idx_week_cycles_status ON week_cycles(account_id, status);
CREATE INDEX IF NOT EXISTS idx_week_cycles_dates ON week_cycles(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_week_cycles_config ON week_cycles(config_id);

-- Daily records indexes
CREATE INDEX IF NOT EXISTS idx_daily_records_account ON daily_records(account_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_cycle ON daily_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_account_date ON daily_records(account_id, record_date);

-- Budget expenses indexes
CREATE INDEX IF NOT EXISTS idx_budget_expenses_account ON budget_expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_daily ON budget_expenses(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_reconciled ON budget_expenses(reconciled_transaction_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_status ON budget_expenses(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user ON budget_expenses(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE budget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR BUDGET_CONFIGS
-- =============================================================================

-- Members can view account budget configs
CREATE POLICY "Members can view account budget configs"
  ON budget_configs FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Owners can insert budget configs
CREATE POLICY "Owners can insert budget configs"
  ON budget_configs FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Owners can update budget configs
CREATE POLICY "Owners can update budget configs"
  ON budget_configs FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Owners can delete budget configs
CREATE POLICY "Owners can delete budget configs"
  ON budget_configs FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS POLICIES FOR WEEK_CYCLES
-- =============================================================================

-- Members can view account week cycles
CREATE POLICY "Members can view account week cycles"
  ON week_cycles FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can insert week cycles (system creates them)
CREATE POLICY "Members can insert week cycles"
  ON week_cycles FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can update week cycles
CREATE POLICY "Members can update week cycles"
  ON week_cycles FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS POLICIES FOR DAILY_RECORDS
-- =============================================================================

-- Members can view account daily records
CREATE POLICY "Members can view account daily records"
  ON daily_records FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can insert daily records
CREATE POLICY "Members can insert daily records"
  ON daily_records FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can update daily records
CREATE POLICY "Members can update daily records"
  ON daily_records FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS POLICIES FOR BUDGET_EXPENSES
-- =============================================================================

-- Members can view account expenses
CREATE POLICY "Members can view account budget expenses"
  ON budget_expenses FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can insert expenses
CREATE POLICY "Members can insert budget expenses"
  ON budget_expenses FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Users can update their own expenses, owners can update all
CREATE POLICY "Users can update own expenses"
  ON budget_expenses FOR UPDATE
  USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their own expenses, owners can delete all
CREATE POLICY "Users can delete own expenses"
  ON budget_expenses FOR DELETE
  USING (
    user_id = auth.uid() OR
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Budget configs trigger
CREATE TRIGGER update_budget_configs_updated_at
  BEFORE UPDATE ON budget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Week cycles trigger
CREATE TRIGGER update_week_cycles_updated_at
  BEFORE UPDATE ON week_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Daily records trigger
CREATE TRIGGER update_daily_records_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Budget expenses trigger
CREATE TRIGGER update_budget_expenses_updated_at
  BEFORE UPDATE ON budget_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE budget_configs IS 'Stores budget configuration for Rolling Budget feature';
COMMENT ON TABLE week_cycles IS 'Stores weekly budget cycles with accumulated balances';
COMMENT ON TABLE daily_records IS 'Stores daily budget records with available and spent amounts';
COMMENT ON TABLE budget_expenses IS 'Stores manual expense entries with optional reconciliation to invoice transactions';

COMMENT ON COLUMN budget_configs.daily_base IS 'Daily budget base in BRL (user input)';
COMMENT ON COLUMN budget_configs.week_start_day IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN budget_configs.carry_over_mode IS 'How to handle balance at week end: reset, carry_all, carry_deficit, carry_credit';

COMMENT ON COLUMN week_cycles.initial_budget IS 'daily_base * 7 at cycle creation';
COMMENT ON COLUMN week_cycles.carried_balance IS 'Balance carried from previous cycle based on carry_over_mode';
COMMENT ON COLUMN week_cycles.accumulated_balance IS 'Sum of all daily balances in this cycle';

COMMENT ON COLUMN daily_records.available_budget IS 'Calculated: base_budget + (accumulated_balance / remaining_days)';
COMMENT ON COLUMN daily_records.daily_balance IS 'available_budget - total_spent';

COMMENT ON COLUMN budget_expenses.reconciled_transaction_id IS 'FK to transactions table when expense is matched to invoice transaction';
COMMENT ON COLUMN budget_expenses.reconciliation_status IS 'pending=awaiting match, matched=linked to transaction, unmatched=no match found, manual=user marked as manual';
