/*
# Create subscriptions and cancellation requests tables

1. New Tables
- `subscriptions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `name` (text, not null) — the subscription service name (e.g. "Netflix", "Spotify")
  - `category` (text, not null) — category of the service (e.g. "Streaming", "Productivity")
  - `billing_platform` (text, not null) — how it's billed: "direct", "apple", "google_play", "amazon", "paypal", "roku"
  - `price` (numeric, not null) — the recurring charge amount
  - `currency` (text, default "USD")
  - `billing_cycle` (text, not null) — "monthly" or "yearly"
  - `next_renewal_date` (date) — when the next charge occurs
  - `status` (text, not null, default "active") — "active", "cancelling", "cancelled"
  - `logo_url` (text) — optional URL for the service logo
  - `notes` (text) — optional user notes
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `cancellation_requests`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `subscription_id` (uuid, not null, references subscriptions, ON DELETE CASCADE)
  - `method` (text, not null) — "auto", "guided", "email"
  - `status` (text, not null, default "pending") — "pending", "in_progress", "completed", "failed"
  - `email_subject` (text) — generated email subject for email-based cancellations
  - `email_body` (text) — generated email body for email-based cancellations
  - `steps` (jsonb) — guided cancellation steps array
  - `current_step` (integer, default 0) — which guided step the user is on
  - `created_at` (timestamptz, default now())
  - `completed_at` (timestamptz) — when cancellation was confirmed

2. Indexes
- `subscriptions_user_id_idx` on subscriptions(user_id) for fast user queries
- `subscriptions_next_renewal_date_idx` on subscriptions(next_renewal_date) for upcoming renewal queries
- `cancellation_requests_subscription_id_idx` on cancellation_requests(subscription_id)

3. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- All policies use auth.uid() = user_id ownership checks.
- user_id columns default to auth.uid() so inserts that omit user_id succeed.
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  billing_platform text NOT NULL DEFAULT 'direct',
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  next_renewal_date date,
  status text NOT NULL DEFAULT 'active',
  logo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create cancellation_requests table
CREATE TABLE IF NOT EXISTS cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'guided',
  status text NOT NULL DEFAULT 'pending',
  email_subject text,
  email_body text,
  steps jsonb,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_next_renewal_date_idx ON subscriptions(next_renewal_date);
CREATE INDEX IF NOT EXISTS cancellation_requests_subscription_id_idx ON cancellation_requests(subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Cancellation requests policies
DROP POLICY IF EXISTS "select_own_cancellation_requests" ON cancellation_requests;
CREATE POLICY "select_own_cancellation_requests" ON cancellation_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cancellation_requests" ON cancellation_requests;
CREATE POLICY "insert_own_cancellation_requests" ON cancellation_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cancellation_requests" ON cancellation_requests;
CREATE POLICY "update_own_cancellation_requests" ON cancellation_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cancellation_requests" ON cancellation_requests;
CREATE POLICY "delete_own_cancellation_requests" ON cancellation_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
