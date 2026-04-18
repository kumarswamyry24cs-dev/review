
/*
  # CodeSense AI - Code Review App Schema

  ## Overview
  Creates the complete schema for the AI code reviewing application.

  ## Tables

  ### 1. profiles
  Extends Supabase auth.users with additional user profile data.
  - id: UUID (references auth.users)
  - full_name: User's display name
  - avatar_url: Profile picture URL
  - plan: Subscription plan (free, pro, enterprise)
  - reviews_count: Total number of reviews performed
  - created_at / updated_at: Timestamps

  ### 2. code_reviews
  Stores all code review requests and their AI-generated results.
  - id: UUID primary key
  - user_id: References profiles
  - title: Review title
  - code: The submitted code
  - language: Programming language
  - overall_score: 0-100 quality score
  - summary: High-level summary from AI
  - issues: JSONB array of code issues
  - suggestions: JSONB array of improvement suggestions
  - security_issues: JSONB array of security findings
  - performance_notes: JSONB array of performance observations
  - complexity_score: Code complexity rating
  - maintainability_score: Maintainability rating
  - status: pending | completed | failed
  - created_at: Timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  reviews_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS code_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Review',
  code text NOT NULL,
  language text NOT NULL DEFAULT 'javascript',
  overall_score integer DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  summary text DEFAULT '',
  issues jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  security_issues jsonb DEFAULT '[]'::jsonb,
  performance_notes jsonb DEFAULT '[]'::jsonb,
  complexity_score integer DEFAULT 0 CHECK (complexity_score >= 0 AND complexity_score <= 100),
  maintainability_score integer DEFAULT 0 CHECK (maintainability_score >= 0 AND maintainability_score <= 100),
  lines_of_code integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE code_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reviews"
  ON code_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON code_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON code_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON code_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_code_reviews_user_id ON code_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_code_reviews_created_at ON code_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_reviews_language ON code_reviews(language);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION increment_reviews_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET reviews_count = reviews_count + 1, updated_at = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
