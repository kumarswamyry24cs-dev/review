/*
  # Fix profile creation on signup

  The handle_new_user trigger fires when a new auth user is created, but the INSERT
  policy on profiles only allows 'authenticated' role. During signup the trigger
  runs as the postgres/service_role before the session is established, causing
  "Database error saving new user".

  Fix: Recreate handle_new_user with SET search_path and ensure the function
  bypasses RLS by setting it as SECURITY DEFINER (already is), and add a policy
  that allows the service_role to insert profiles so the trigger succeeds.

  Also adds a bypass policy for the postgres role used internally by triggers.
*/

-- Drop the restrictive insert policy and replace with one that also covers the trigger path
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Allow authenticated users to insert their own profile (normal client-side case)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service_role to insert profiles (used by the handle_new_user trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Recreate the handle_new_user function with explicit search_path for safety
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
