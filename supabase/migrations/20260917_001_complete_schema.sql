-- ============================================================
-- PERSONAL MONEY TRACKER — COMPLETE MIGRATION
-- Run this in one shot against your Supabase PostgreSQL database
-- ============================================================

-- ========== MIGRATION 001: CORE SCHEMA ==========

CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'savings', 'investment');

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT U&'\+01F4E6',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             transaction_type NOT NULL,
  amount           NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_id      UUID REFERENCES categories(id) ON DELETE RESTRICT,
  note             TEXT,
  transaction_date DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user_id        ON categories(user_id);
CREATE INDEX idx_transactions_user_id      ON transactions(user_id);
CREATE INDEX idx_transactions_user_date    ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type    ON transactions(user_id, type);
CREATE INDEX idx_transactions_category     ON transactions(category_id);
CREATE INDEX idx_transactions_date         ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_note_fts     ON transactions USING gin(to_tsvector('english', COALESCE(note, '')));

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at   BEFORE UPDATE ON categories   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, is_default) VALUES
    (NEW.id, 'Food',          U&'\+01F354', true),
    (NEW.id, 'Transport',     U&'\+01F697', true),
    (NEW.id, 'Shopping',      U&'\+01F6CD\+0000FE0F', true),
    (NEW.id, 'Entertainment', U&'\+01F3AC', true),
    (NEW.id, 'Bills',         U&'\+01F4C4', true),
    (NEW.id, 'Family',        U&'\+01F46A', true),
    (NEW.id, 'Personal',      U&'\+01F464', true),
    (NEW.id, 'Fun',           U&'\+01F3AE', true);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_profile_created AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION seed_default_categories();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========== MIGRATION 002: RLS POLICIES ==========

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"  ON profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "profiles: insert own"  ON profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles: update own"  ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles: delete own"  ON profiles FOR DELETE TO authenticated USING ((select auth.uid()) = id);

CREATE POLICY "categories: select own" ON categories FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "categories: insert own" ON categories FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "categories: update own" ON categories FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "categories: delete own" ON categories FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE POLICY "transactions: select own" ON transactions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "transactions: insert own" ON transactions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "transactions: update own" ON transactions FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "transactions: delete own" ON transactions FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

-- ========== MIGRATION 003: ANALYTICS FUNCTIONS ==========

CREATE OR REPLACE FUNCTION get_balance_summary(p_user_id UUID)
RETURNS TABLE (income_total NUMERIC, expense_total NUMERIC, savings_total NUMERIC, investment_total NUMERIC, available_balance NUMERIC)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),     0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'),    0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'savings'),    0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'investment'), 0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),     0)
    - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'),    0)
    - COALESCE(SUM(amount) FILTER (WHERE type = 'savings'),    0)
    - COALESCE(SUM(amount) FILTER (WHERE type = 'investment'), 0)
  FROM transactions WHERE user_id = p_user_id
$$;

CREATE OR REPLACE FUNCTION get_period_summary(p_user_id UUID, p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS TABLE (income_total NUMERIC, expense_total NUMERIC, savings_total NUMERIC, investment_total NUMERIC)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),     0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'),    0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'savings'),    0),
    COALESCE(SUM(amount) FILTER (WHERE type = 'investment'), 0)
  FROM transactions
  WHERE user_id = p_user_id
    AND (p_from IS NULL OR transaction_date >= p_from)
    AND (p_to   IS NULL OR transaction_date <= p_to)
$$;

CREATE OR REPLACE FUNCTION get_category_spending(p_user_id UUID, p_from DATE DEFAULT NULL, p_to DATE DEFAULT NULL)
RETURNS TABLE (category_id UUID, category_name TEXT, category_icon TEXT, total NUMERIC, pct NUMERIC)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH expense_by_cat AS (
    SELECT t.category_id,
           COALESCE(c.name, 'Uncategorized') AS category_name,
           COALESCE(c.icon, U&'\+01F4E6')    AS category_icon,
           SUM(t.amount)                      AS total
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = p_user_id AND t.type = 'expense'
      AND (p_from IS NULL OR t.transaction_date >= p_from)
      AND (p_to   IS NULL OR t.transaction_date <= p_to)
    GROUP BY t.category_id, c.name, c.icon
  ),
  grand_total AS (SELECT SUM(total) AS gt FROM expense_by_cat)
  SELECT e.category_id, e.category_name, e.category_icon, e.total,
         CASE WHEN g.gt > 0 THEN ROUND((e.total / g.gt) * 100, 1) ELSE 0 END
  FROM expense_by_cat e, grand_total g ORDER BY e.total DESC
$$;

CREATE OR REPLACE FUNCTION get_today_spending(p_user_id UUID)
RETURNS NUMERIC LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount), 0) FROM transactions
  WHERE user_id = p_user_id AND type = 'expense' AND transaction_date = CURRENT_DATE
$$;

GRANT EXECUTE ON FUNCTION get_balance_summary(UUID)               TO authenticated;
GRANT EXECUTE ON FUNCTION get_period_summary(UUID, DATE, DATE)    TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_spending(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_spending(UUID)                TO authenticated;
