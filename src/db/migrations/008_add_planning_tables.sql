-- Migration: Add financial planning tables
-- Version: 008
-- Date: 2026-02-23
-- Description: Creates tables for financial planning with scenarios feature

-- =============================================================================
-- FINANCIAL_PLANS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS financial_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_month date NOT NULL,
  months integer NOT NULL DEFAULT 12 CHECK (months >= 1 AND months <= 24),
  initial_balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_INCOME_SOURCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_income_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid REFERENCES financial_plans(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'once')),
  month_index integer CHECK (month_index >= 0 AND month_index <= 23),
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_SCENARIOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_scenarios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid REFERENCES financial_plans(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('current', 'optimistic', 'pessimistic')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PLAN_SCENARIO_ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plan_scenario_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id uuid REFERENCES plan_scenarios(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('fixed', 'variable')),
  name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  end_month integer CHECK (end_month >= 0 AND end_month <= 23),
  auto_detected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_plans_account ON financial_plans(account_id);
CREATE INDEX IF NOT EXISTS idx_plan_income_sources_plan ON plan_income_sources(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_scenarios_plan ON plan_scenarios(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_scenarios_type ON plan_scenarios(plan_id, type);
CREATE INDEX IF NOT EXISTS idx_plan_scenario_items_scenario ON plan_scenario_items(scenario_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_scenario_items ENABLE ROW LEVEL SECURITY;

-- financial_plans policies
CREATE POLICY "Members can view account plans"
  ON financial_plans FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert plans"
  ON financial_plans FOR INSERT
  WITH CHECK (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update plans"
  ON financial_plans FOR UPDATE
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Owners can delete plans"
  ON financial_plans FOR DELETE
  USING (account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid()));

-- plan_income_sources policies (via plan_id -> financial_plans -> account_id)
CREATE POLICY "Members can view plan incomes"
  ON plan_income_sources FOR SELECT
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can insert plan incomes"
  ON plan_income_sources FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can update plan incomes"
  ON plan_income_sources FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can delete plan incomes"
  ON plan_income_sources FOR DELETE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

-- plan_scenarios policies
CREATE POLICY "Members can view plan scenarios"
  ON plan_scenarios FOR SELECT
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can insert plan scenarios"
  ON plan_scenarios FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Members can update plan scenarios"
  ON plan_scenarios FOR UPDATE
  USING (plan_id IN (
    SELECT id FROM financial_plans WHERE account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  ));

-- plan_scenario_items policies
CREATE POLICY "Members can view scenario items"
  ON plan_scenario_items FOR SELECT
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can insert scenario items"
  ON plan_scenario_items FOR INSERT
  WITH CHECK (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can update scenario items"
  ON plan_scenario_items FOR UPDATE
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Members can delete scenario items"
  ON plan_scenario_items FOR DELETE
  USING (scenario_id IN (
    SELECT id FROM plan_scenarios WHERE plan_id IN (
      SELECT id FROM financial_plans WHERE account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  ));

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE TRIGGER update_financial_plans_updated_at
  BEFORE UPDATE ON financial_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE financial_plans IS 'Financial planning projections with 12-month horizon';
COMMENT ON TABLE plan_income_sources IS 'Income sources for a financial plan (shared across scenarios)';
COMMENT ON TABLE plan_scenarios IS 'Three scenarios per plan: current, optimistic, pessimistic';
COMMENT ON TABLE plan_scenario_items IS 'Expense items per scenario (fixed or variable)';
COMMENT ON COLUMN plan_scenario_items.end_month IS 'Month index (0-based) where expense ends. NULL = continues for all months';
COMMENT ON COLUMN plan_scenario_items.auto_detected IS 'True if item was auto-populated from real transaction data';
COMMENT ON COLUMN plan_income_sources.month_index IS 'For one-time income: which month (0-based). NULL for monthly income';
