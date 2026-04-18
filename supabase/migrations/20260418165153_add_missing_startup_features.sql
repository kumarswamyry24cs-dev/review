/*
  # Add Missing Startup Features Schema

  ## Summary
  This migration adds all the missing tables and columns needed to make CodeSense
  a production-ready startup product.

  ## New Tables

  1. **notification_preferences** - Stores per-user notification toggle settings
     - `user_id` (uuid, FK to profiles)
     - `review_completed` (boolean) - notify when AI review is done
     - `weekly_digest` (boolean) - weekly code quality summary
     - `security_alerts` (boolean) - critical security issue alerts

  2. **api_keys** - User-generated API keys for programmatic access
     - `user_id` (uuid, FK to profiles)
     - `name` (text) - friendly name for the key
     - `key_prefix` (text) - visible prefix like "cs_live_xxxx"
     - `key_hash` (text, unique) - hashed key for secure storage
     - `last_used_at` (timestamptz) - track usage

  3. **review_shares** - Tracks reviews shared between users or via public link
     - `review_id` (uuid, FK to code_reviews)
     - `shared_by_id` (uuid, FK to profiles)
     - `public_token` (text, unique) - unique public share token
     - `expires_at` (timestamptz) - optional expiry

  ## Modified Tables

  - **profiles**: Added `monthly_reviews_used` and `monthly_reset_at` columns for rate limiting

  ## Security
  - RLS enabled on all new tables
  - Policies restrict users to their own data only
*/

-- Add rate limiting columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_reviews_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_reviews_used integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_reset_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_reset_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_completed boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  key_prefix text NOT NULL DEFAULT '',
  key_hash text UNIQUE NOT NULL DEFAULT '',
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Review shares table
CREATE TABLE IF NOT EXISTS review_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
  shared_by_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  public_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own review shares"
  ON review_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by_id);

CREATE POLICY "Users can insert own review shares"
  ON review_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by_id);

CREATE POLICY "Users can delete own review shares"
  ON review_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by_id);

-- Function to auto-reset monthly review count
CREATE OR REPLACE FUNCTION reset_monthly_reviews_if_needed(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET monthly_reviews_used = 0,
      monthly_reset_at = now()
  WHERE id = user_uuid
    AND monthly_reset_at < date_trunc('month', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment reviews count (already exists, recreate safely)
CREATE OR REPLACE FUNCTION increment_reviews_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET reviews_count = reviews_count + 1,
      monthly_reviews_used = monthly_reviews_used + 1,
      updated_at = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
