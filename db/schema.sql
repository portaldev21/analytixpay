-- AnalytiXPay Database Schema
-- Supabase PostgreSQL
-- Version: 1.0.0
-- Date: 2025-10-11

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Accounts (Shared accounts for families/groups)
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Account Members (Many-to-many relationship)
CREATE TABLE account_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (account_id, user_id)
);

-- Invoices (PDF files uploaded)
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  period text, -- Example: "September/2025", "09/2025"
  card_last_digits text, -- Last 4 digits of card
  total_amount numeric(10,2),
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions (Extracted from PDFs)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other',
  amount numeric(10,2) NOT NULL,
  installment text, -- Example: "1/12", "3/6"
  is_international boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories (Pre-defined categories)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  icon text, -- Lucide icon name
  color text, -- Hex color
  keywords text[], -- Keywords for auto-categorization
  created_at timestamptz DEFAULT now()
);

-- User Profiles (Extended user info)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX idx_account_members_account_id ON account_members(account_id);
CREATE INDEX idx_account_members_user_id ON account_members(user_id);
CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_period ON invoices(period);
CREATE INDEX idx_transactions_invoice_id ON transactions(invoice_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Accounts Policies
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owners can update their accounts"
  ON accounts FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Only owners can delete their accounts"
  ON accounts FOR DELETE
  USING (owner_id = auth.uid());

-- Account Members Policies
CREATE POLICY "Members can view their account members"
  ON account_members FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can add members"
  ON account_members FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can remove members"
  ON account_members FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Invoices Policies
CREATE POLICY "Members can view their account invoices"
  ON invoices FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Members can update their own invoices"
  ON invoices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Only owners can delete invoices"
  ON invoices FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Transactions Policies
CREATE POLICY "Members can view their account transactions"
  ON transactions FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update transactions"
  ON transactions FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only owners can delete transactions"
  ON transactions FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_id = auth.uid()
    )
  );

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - Default Categories
-- =====================================================

INSERT INTO categories (name, icon, color, keywords) VALUES
  ('Alimentação', 'UtensilsCrossed', '#10b981', ARRAY['restaurante', 'lanchonete', 'mercado', 'supermercado', 'padaria', 'açougue', 'hortifruti', 'delivery', 'ifood', 'rappi']),
  ('Transporte', 'Car', '#3b82f6', ARRAY['uber', 'taxi', '99', 'combustivel', 'gasolina', 'etanol', 'diesel', 'estacionamento', 'pedágio', 'metrô', 'ônibus']),
  ('Saúde', 'Heart', '#ef4444', ARRAY['farmácia', 'drogaria', 'clínica', 'hospital', 'médico', 'dentista', 'laboratório', 'exame']),
  ('Lazer', 'Gamepad2', '#8b5cf6', ARRAY['cinema', 'teatro', 'show', 'streaming', 'netflix', 'spotify', 'youtube', 'game', 'parque']),
  ('Compras', 'ShoppingBag', '#ec4899', ARRAY['loja', 'magazine', 'shopping', 'marketplace', 'mercado livre', 'amazon', 'shopee', 'aliexpress']),
  ('Educação', 'GraduationCap', '#f59e0b', ARRAY['escola', 'curso', 'faculdade', 'universidade', 'livro', 'material escolar', 'udemy', 'coursera']),
  ('Casa', 'Home', '#06b6d4', ARRAY['água', 'luz', 'energia', 'gás', 'internet', 'condomínio', 'aluguel', 'iptu']),
  ('Vestuário', 'Shirt', '#14b8a6', ARRAY['roupa', 'calçado', 'sapato', 'tênis', 'bolsa', 'acessório', 'moda']),
  ('Beleza', 'Sparkles', '#f97316', ARRAY['salão', 'cabeleireiro', 'manicure', 'spa', 'cosméticos', 'perfume', 'maquiagem']),
  ('Tecnologia', 'Laptop', '#6366f1', ARRAY['eletrônico', 'computador', 'celular', 'smartphone', 'notebook', 'tablet', 'acessório tech']),
  ('Serviços', 'Wrench', '#64748b', ARRAY['manutenção', 'conserto', 'reparo', 'serviço', 'assinatura', 'mensalidade']),
  ('Outros', 'MoreHorizontal', '#94a3b8', ARRAY[]::text[]);

-- =====================================================
-- STORAGE BUCKET (Execute in Supabase Dashboard > Storage)
-- =====================================================

-- Create bucket 'invoices' with public access disabled
-- Then add these policies in Storage settings:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- CREATE POLICY "Users can upload their own invoices"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'invoices' AND
--   (storage.foldername(name))[1] IN (
--     SELECT account_id::text FROM account_members WHERE user_id = auth.uid()
--   )
-- );

-- CREATE POLICY "Users can read invoices from their accounts"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'invoices' AND
--   (storage.foldername(name))[1] IN (
--     SELECT account_id::text FROM account_members WHERE user_id = auth.uid()
--   )
-- );

-- CREATE POLICY "Only owners can delete invoices"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'invoices' AND
--   (storage.foldername(name))[1] IN (
--     SELECT id::text FROM accounts WHERE owner_id = auth.uid()
--   )
-- );
